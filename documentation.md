# Documentation to create an Amplify App

Used resources:
- Amplify to BedRock (https://docs.amplify.aws/nextjs/build-a-backend/data/custom-business-logic/connect-bedrock/)
- Send image call to Nova Lite (https://docs.aws.amazon.com/nova/latest/userguide/modalities-image-examples.html)
- How to send images (https://docs.aws.amazon.com/nova/latest/userguide/modalities-image.html)
- Image prompts (https://docs.aws.amazon.com/nova/latest/userguide/prompting-vision-prompting.html)

- Fork NextJS App template

- Prompt /dev 
Hi. I created an Amazon Amplify app using the NextJS template. I will explain now my application and I will give you resources from the official documentation to create this.
I want to create a modern interface that uses the users webcam. Every 30 seconds the system will take a screenshot of the webcam, adjust the quality, size and format and send it to Amazon Bedrock with the prompt: describe the picture. The prompt will always stay the same so we can hardcode it. The returning text will then be displayed.
Use the Nova Lite model "amazon.nova-lite-v1:0" to create the backend.
Any of the code that is already there is not needed, feel free to remove the code.
Also make sure to keep the package.json up to date with the appropriate versions, do not worry about the package-lock.json as I will manually install it.
Here is how we can generally connect to Amazon Bedrock, remember I want to only show you the logic, the applicacation will be different:

Connect to Amazon Bedrock for generative AI use cases
Amazon Bedrock is a fully managed service that removes the complexity of using foundation models (FMs) for generative AI development. It acts as a central hub, offering a curated selection of high-performing FMs from leading AI companies like Anthropic, AI21 Labs, Cohere, and Amazon itself.
Amazon Bedrock streamlines generative AI development by providing:
Choice and Flexibility: Experiment and evaluate a wide range of FMs to find the perfect fit for your use case.
Simplified Integration: Access and use FMs through a single, unified API, reducing development time.
Enhanced Security and Privacy: Benefit from built-in safeguards to protect your data and prevent misuse.
Responsible AI Features: Implement guardrails to control outputs and mitigate bias.
In the following sections, we walk through the steps to add Amazon Bedrock to your API as a data source and connect to it from your Amplify app:
Add Amazon Bedrock as a data source
Define a custom query
Configure custom business logic handler code
Invoke a custom query to prompt a generative AI model
Step 1 - Add Amazon Bedrock as a data source
To connect to Amazon Bedrock as a data source, you can choose between two methods - using a Lambda function or a custom resolver powered by AppSync JavaScript resolvers. The following steps demonstrate both methods:
Function
Custom resolver powered by AppSync JavaScript resolvers
In your amplify/backend.ts file, replace the content with the following code to add a lambda function to your backend and grant it permission to invoke a generative AI model in Amazon Bedrock. The generateHaikuFunction lambda function will be defined in and exported from the amplify/data/resource.ts file in the next steps:
amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data, MODEL_ID, generateHaikuFunction } from "./data/resource";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export const backend = defineBackend({
  auth,
  data,
  generateHaikuFunction,
});

backend.generateHaikuFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:*::foundation-model/${MODEL_ID}`,
    ],
  })
);
For the purpose of this guide, we will use Anthropic's Claude 3 Haiku to generate content. If you want to use a different model, you can find the ID for your model of choice in the Amazon Bedrock documentation's list of model IDs or the Amazon Bedrock console and replace the value of MODEL_ID.
The availability of Amazon Bedrock and its foundation models may vary by region.

The policy statement in the code above assumes that your Amplify app is deployed in a region supported by Amazon Bedrock and the Claude 3 Haiku model. If you are deploying your app in a region where Amazon Bedrock is not available, update the code above accordingly.

For a list of supported regions please refer to the Amazon Bedrock documentation.
Step 2 - Define a custom query
Function
Custom resolver powered by AppSync JavaScript resolvers
Next, replace the contents of your amplify/data/resource.ts file with the following code. This will define and export a lambda function that was granted permission to invoke a generative AI model in Amazon Bedrock in the previous step. A custom query named generateHaiku is added to the schema with the generateHaikuFunction as the handler using the a.handler.function() modifier:
amplify/data/resource.ts
import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

export const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export const generateHaikuFunction = defineFunction({
  entry: "./generateHaiku.ts",
  environment: {
    MODEL_ID,
  },
});

const schema = a.schema({
  generateHaiku: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generateHaikuFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
Step 3 - Configure custom business logic handler code
Function
Custom resolver powered by AppSync JavaScript resolvers
Next, create a generateHaiku.ts file in your amplify/data folder and use the following code to define a custom resolver for the custom query added to your schema in the previous step:
The following code uses the BedrockRuntimeClient from the @aws-sdk/client-bedrock-runtime package to invoke the generative AI model in Amazon Bedrock. The handler function takes the user prompt as an argument, invokes the model, and returns the generated haiku.
amplify/data/generateHaiku.ts
import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// initialize bedrock runtime client
const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  // User prompt
  const prompt = event.arguments.prompt;

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system:
        "You are a an expert at crafting a haiku. You are able to craft a haiku out of anything and therefore answer only in haiku.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  // Parse the response and return the generated haiku
  const data = JSON.parse(Buffer.from(response.body).toString());

  return data.content[0].text;
};
The code above uses the Messages API, which is supported by chat models such as Anthropic's Claude 3 Haiku.
The system prompt is used to give the model a persona or directives to follow, and the messages array can contain a history of messages. The max_tokens parameter controls the maximum number of tokens the model can generate, and the temperature parameter determines the randomness, or creativity, of the generated response.
Step 4 - Invoke a custom query to prompt a generative AI model
From your generated Data client, you can find all your custom queries and mutations under the client.queries and client.mutations APIs respectively.
The custom query below will prompt a generative AI model to create a haiku based on the given prompt. Replace the prompt value with your desired prompt text or user input and invoke the query as shown below:
App.tsx
const { data, errors } = await client.queries.generateHaiku({
  prompt: "Frank Herbert's Dune",
});
Here's an example of a simple UI that prompts a generative AI model to create a haiku based on user input:
App.tsx
import type { Schema } from '@/amplify/data/resource';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { data, errors } = await client.queries.generateHaiku({
      prompt
    });

    if (!errors) {
      setAnswer(data);
      setPrompt('');
    } else {
      console.log(errors);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:text-white">
      <div>
        <h1 className="text-3xl font-bold text-center mb-4">Haiku Generator</h1>
        <form className="mb-4 self-center max-w-[500px]" onSubmit={sendPrompt}>
          <input
            className="text-black p-2 w-full"
            placeholder="Enter a prompt..."
            name="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </form>
        <div className="text-center">
          <pre>{answer}</pre>
        </div>
      </div>
    </main>
  );
}
A webpage titled "Haiku Generator" and input field. "Frank Herbert's Dune" is entered and submitted. Shortly after, a haiku is rendered to the page.
Conclusion
In this guide, you learned how to connect to Amazon Bedrock from your Amplify app. By adding Bedrock as a data source, defining a custom query, configuring custom business logic handler code, and invoking custom queries, you can leverage the power of generative AI models in your application.
To clean up, you can delete your sandbox by accepting the prompt when terminating the sandbox process in your terminal. Alternatively, you can also use the AWS Amplify console to manage and delete sandbox environments.

This example uses another model. We want to use the NovaLite Model with which we can interact like this. For the text/prompt simply use the phrase "Describe the picture". When creating the image make sure to reduce resolution, quality and size so the model can process the image: 
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
import base64
import boto3
import json
# Create a Bedrock Runtime client in the AWS Region of your choice.
client = boto3.client(
    "bedrock-runtime",
    region_name="us-east-1",
)

MODEL_ID = "us.amazon.nova-lite-v1:0"
# Open the image you'd like to use and encode it as a Base64 string.
with open("media/sunset.png", "rb") as image_file:
    binary_data = image_file.read()
    base_64_encoded_data = base64.b64encode(binary_data)
    base64_string = base_64_encoded_data.decode("utf-8")
# Define your system prompt(s).
system_list = [    {
        "text": "You are an expert artist. When the user provides you with an image, provide 3 potential art titles"
    }
]
# Define a "user" message including both the image and a text prompt.
message_list = [
    {
        "role": "user",
        "content": [
            {
                "image": {
                    "format": "png",
                    "source": {"bytes": base64_string},
                }
            },
            {
                "text": "Provide art titles for this image."
            }
        ],
    }
]
# Configure the inference parameters.
inf_params = {"maxTokens": 300, "topP": 0.1, "topK": 20, "temperature": 0.3}

native_request = {
    "schemaVersion": "messages-v1",
    "messages": message_list,
    "system": system_list,
    "inferenceConfig": inf_params,
}
# Invoke the model and extract the response body.
response = client.invoke_model(modelId=MODEL_ID, body=json.dumps(native_request))
model_response = json.loads(response["body"].read())
# Pretty print the response JSON.
print("[Full Response]")
print(json.dumps(model_response, indent=2))
# Print the text content for easy readability.
content_text = model_response["output"]["message"]["content"][0]["text"]
print("\n[Response Content Text]")
print(content_text)

Here are also some tips to work with images with the Nova Lite model.
This are the requirements for the resolution:
Amazon Nova models allow you to include multiple images in the payload with a limitation of total payload size to not go beyond 25MB. Amazon Nova models can analyze the passed images and answer questions, classify an image, as well as summarize images based on provided instructions.

Image size information


To provide the best possible results, Amazon Nova automatically rescales input images up or down depending on their aspect ratio and original resolution. For each image, Amazon Nova first identifies the closest aspect ratio from 1:1, 1:2, 1:3, 1:4, 1:5, 1:6, 1:7, 1:8, 1:9 2:3, 2:4 and their transposes. Then the image is rescaled so that at least one side of the image is greater than 896px or the length of shorter side of the original image, while maintaining the closest aspect ratio. There's a maximum resolution of 8,000x8,000 pixels

Image to tokens conversion


As previously discussed, images are resized to maximize information extraction, while still maintaining the aspect ratio. What follows are some examples of sample image dimensions and approximate token calculations.

image_resolution (HxW or WxH)
900 x 450
900 x 900
1400 x 900
1.8K x 900
1.3Kx1.3K
Estimated token count
~800
~1300
~1800
~2400
~2600
So for example, consider an example image that is 800x400 in size, and you want to estimate the token count for this image. Based on the dimensions, to maintain an aspect ratio of 1:2, the closest resolution is 900x450. Therefore, the approximate token count for this image is about 800 tokens.

The following vision prompting techniques will help you create better prompts for Amazon Nova.

Topics

Placement matters
Multiple media files with vision components
Improved instruction following for video understanding
Richer outputs or style
Placement matters


We recommend that you place media files (such as images or videos) before adding any documents, followed by your instructional text or prompts to guide the model. While images placed after text or interspersed with text will still perform adequately, if the use case permits, the {media_file}-then-{text} structure is the preferred approach.

The following template can be used to place media files before text when performing vision understanding.


{
      "role": "user",
      "content": [
        {
          "image": "..."
        },
        {
          "video": "..."
        },
        {
          "document": "..."
        },
        {
          "text": "..."
        }
      ]
}
Example: Media before text
Multiple media files with vision components


In situations where you provide multiple media files across turns, introduce each image with a numbered label. For example, if you use two images, label them Image 1: and Image 2:. If you use three videos, label them Video 1:, Video 2:, and Video 3:. You don't need newlines between images or between images and the prompt.

The following template can be used to place multiple media files:


"content": [
        {
          "image 1": "..."
        },
        {
          "image 2": "..."
        },
        {
          "text": "Describe what you see in the second image."
        }
]
Unoptimized Prompt
Optimized Prompt
Describe what you see in the second image.

[Image1.png] [image2.png]
[Image1.png]

[Image2.png]

Describe what you see in the second image.
Is the second image described in the included document?

[Image1.png] [image2.png] [Document1.pdf]
[Image1.png]

[Image2.png]

[Document1.pdf]

Is the second image described in the included document?
Due to the long context tokens of the media file types, the system prompt indicated in the beginning of the prompt might not be respected in certain occasions. On this occasion, we recommend that you move any system instructions to user turns and follow the general guidance of {media_file}-then-{text}. This does not impact system prompting with RAG, agents, or tool usage.

Improved instruction following for video understanding


For video understanding, the number of tokens in-context makes the recommendations in Placement matters very important. Use the system prompt for more general things like tone and style. We recommend that you keep the video-related instructions as part of the user prompt for better performance.

The following template can be used to for improved instructions:


{
    "role": "user",
    "content": [
       {
           "video": {
                "format": "mp4",
                "source": { ... }
           }
       },
       {
           "text": "You are an expert in recipe videos. Describe this video in less than 200 words following these guidelines: ..."
       }
    ]
}

To put it short I want to create an app that uses a modern frontend and the users webcam to automatically send the pictures to the AI model Nova-lite which will interpret what is shown in the pictures. Feel free to use the resources I sent you.

- Design:
Perfect everything works amazingly. Can you use a black background, rearrange them to create a pleasant design, put the webcam on the left side and the AI description on the right side, use Arial as a font and the following colours as a design template: #00C49B, #277D9A, #0EA49A, #5E3D9C
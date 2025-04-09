# Documentation to create an Amplify App

- Fork NextJS App template
- Prompt /dev 
Hi. I created an Amazon Amplify app using the NextJS template. I want to create an application from the official documentation. Use the Nova Lite model "amazon.nova-lite-v1:0" to create the backend.. Make sure that the requests and results are applied to this new model, using the official documentation: import boto3
import json

client = boto3.client(service_name="bedrock-runtime")

messages = [
    {"role": "user", "content": [{"text": "Write a short poem"}]},
]

model_response = client.converse(
    modelId="us.amazon.nova-lite-v1:0", 
    messages=messages
)

print("\n[Full Response]")
print(json.dumps(model_response, indent=2))

print("\n[Response Content Text]")
print(model_response["output"]["message"]["content"][0]["text"]). To create requests use the most basic form. Create an appealing interface so the user can interact with the model. Also keep the package.json up to date and complete, do not worry about the package-lock.json as I will install it myself. Any functions that are already present are not necessary, I simply want to create a connection, send it a question and receive an answer. I will give you an official documentation on how to create this connections. Keep in mind to only use the most simple request and use nova lite as the model. This is the documentation: Step 1 - Add Amazon Bedrock as a data source To connect to Amazon Bedrock as a data source, you can choose between two methods - using a Lambda function or a custom resolver powered by AppSync JavaScript resolvers. The following steps demonstrate both methods: Function Custom resolver powered by AppSync JavaScript resolvers In your amplify/backend.ts file, replace the content with the following code to add a lambda function to your backend and grant it permission to invoke a generative AI model in Amazon Bedrock. The generateHaikuFunction lambda function will be defined in and exported from the amplify/data/resource.ts file in the next steps: amplify/backend.ts import { defineBackend } from "@aws-amplify/backend"; import { auth } from "./auth/resource"; import { data, MODEL_ID, generateHaikuFunction } from "./data/resource"; import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
export const backend = defineBackend({ auth, data, generateHaikuFunction, });

backend.generateHaikuFunction.resources.lambda.addToRolePolicy( new PolicyStatement({ effect: Effect.ALLOW, actions: ["bedrock:InvokeModel"], resources: [ arn:aws:bedrock:*::foundation-model/${MODEL_ID}, ], }) ); For the purpose of this guide, we will use Anthropic's Claude 3 Haiku to generate content. If you want to use a different model, you can find the ID for your model of choice in the Amazon Bedrock documentation's list of model IDs or the Amazon Bedrock console and replace the value of MODEL_ID. The availability of Amazon Bedrock and its foundation models may vary by region.

The policy statement in the code above assumes that your Amplify app is deployed in a region supported by Amazon Bedrock and the Claude 3 Haiku model. If you are deploying your app in a region where Amazon Bedrock is not available, update the code above accordingly.

For a list of supported regions please refer to the Amazon Bedrock documentation. Step 2 - Define a custom query Function Custom resolver powered by AppSync JavaScript resolvers Next, replace the contents of your amplify/data/resource.ts file with the following code. This will define and export a lambda function that was granted permission to invoke a generative AI model in Amazon Bedrock in the previous step. A custom query named generateHaiku is added to the schema with the generateHaikuFunction as the handler using the a.handler.function() modifier: amplify/data/resource.ts import { type ClientSchema, a, defineData, defineFunction, } from "@aws-amplify/backend";

export const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export const generateHaikuFunction = defineFunction({ entry: "./generateHaiku.ts", environment: { MODEL_ID, }, });

const schema = a.schema({ generateHaiku: a .query() .arguments({ prompt: a.string().required() }) .returns(a.string()) .authorization((allow) => [allow.publicApiKey()]) .handler(a.handler.function(generateHaikuFunction)), });

export type Schema = ClientSchema;

export const data = defineData({ schema, authorizationModes: { defaultAuthorizationMode: "apiKey", apiKeyAuthorizationMode: { expiresInDays: 30, }, }, }); Step 3 - Configure custom business logic handler code Function Custom resolver powered by AppSync JavaScript resolvers Next, create a generateHaiku.ts file in your amplify/data folder and use the following code to define a custom resolver for the custom query added to your schema in the previous step: The following code uses the BedrockRuntimeClient from the @aws-sdk/client-bedrock-runtime package to invoke the generative AI model in Amazon Bedrock. The handler function takes the user prompt as an argument, invokes the model, and returns the generated haiku. amplify/data/generateHaiku.ts import type { Schema } from "./resource"; import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput, } from "@aws-sdk/client-bedrock-runtime";

// initialize bedrock runtime client const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async ( event, context ) => { // User prompt const prompt = event.arguments.prompt;

// Invoke model const input = { modelId: process.env.MODEL_ID, contentType: "application/json", accept: "application/json", body: JSON.stringify({ anthropic_version: "bedrock-2023-05-31", system: "You are a an expert at crafting a haiku. You are able to craft a haiku out of anything and therefore answer only in haiku.", messages: [ { role: "user", content: [ { type: "text", text: prompt, }, ], }, ], max_tokens: 1000, temperature: 0.5, }), } as InvokeModelCommandInput;

const command = new InvokeModelCommand(input);

const response = await client.send(command);

// Parse the response and return the generated haiku const data = JSON.parse(Buffer.from(response.body).toString());

return data.content[0].text; }; The code above uses the Messages API, which is supported by chat models such as Anthropic's Claude 3 Haiku. The system prompt is used to give the model a persona or directives to follow, and the messages array can contain a history of messages. The max_tokens parameter controls the maximum number of tokens the model can generate, and the temperature parameter determines the randomness, or creativity, of the generated response. Step 4 - Invoke a custom query to prompt a generative AI model From your generated Data client, you can find all your custom queries and mutations under the client.queries and client.mutations APIs respectively. The custom query below will prompt a generative AI model to create a haiku based on the given prompt. Replace the prompt value with your desired prompt text or user input and invoke the query as shown below: App.tsx const { data, errors } = await client.queries.generateHaiku({ prompt: "Frank Herbert's Dune", }); Here's an example of a simple UI that prompts a generative AI model to create a haiku based on user input: App.tsx import type { Schema } from '@/amplify/data/resource'; import type { FormEvent } from 'react'; import { useState } from 'react'; import { Amplify } from 'aws-amplify'; import { generateClient } from 'aws-amplify/api'; import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs);

const client = generateClient();

export default function App() { const [prompt, setPrompt] = useState(''); const [answer, setAnswer] = useState<string | null>(null);

const sendPrompt = async (event: FormEvent) => { event.preventDefault();

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

Haiku Generator

<input className="text-black p-2 w-full" placeholder="Enter a prompt..." name="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
{answer}
); } A webpage titled "Haiku Generator" and input field. "Frank Herbert's Dune" is entered and submitted. Shortly after, a haiku is rendered to the page. Conclusion In this guide, you learned how to connect to Amazon Bedrock from your Amplify app. By adding Bedrock as a data source, defining a custom query, configuring custom business logic handler code, and invoking custom queries, you can leverage the power of generative AI models in your application. To clean up, you can delete your sandbox by accepting the prompt when terminating the sandbox process in your terminal. Alternatively, you can also use the AWS Amplify console to manage and delete sandbox environments.
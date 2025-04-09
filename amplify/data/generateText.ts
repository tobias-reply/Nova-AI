import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient();

export const handler: Schema["generateText"]["functionHandler"] = async (
  event,
  context
) => {
  const { prompt, imageData, imageFormat } = event.arguments;

  const content = [];
  
  // Add image content if provided
  if (imageData && imageFormat) {
    content.push({
      image: {
        format: imageFormat,
        source: { bytes: imageData }
      }
    });
  }
  
  // Add text prompt
  content.push({ text: prompt });

  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      schemaVersion: "messages-v1",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      inferenceConfig: {
        maxTokens: 300,
        topP: 0.1,
        topK: 20,
        temperature: 0.3
      }
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  try {
    const response = await client.send(command);
    const data = JSON.parse(Buffer.from(response.body).toString());
    return data.output.message.content[0].text;
  } catch (error) {
    console.error("Error invoking model:", error);
    throw error;
  }
};

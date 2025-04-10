import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize bedrock runtime client
const client = new BedrockRuntimeClient();

export const handler: Schema["analyzeImage"]["functionHandler"] = async (
  event,
  context
) => {
  // Get base64 image from event
  const imageBase64 = event.arguments.imageBase64;

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [
            {
              image: imageBase64
            },
            {
              text: "Describe the picture"
            }
          ]
        }
      ]
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  try {
    const response = await client.send(command);
    const data = JSON.parse(Buffer.from(response.body).toString());
    return data.output.message.content[0].text;
  } catch (error) {
    console.error("Error invoking Bedrock:", error);
    throw error;
  }
};
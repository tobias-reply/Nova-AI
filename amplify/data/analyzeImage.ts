import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize bedrock runtime client
const client = new BedrockRuntimeClient({
  region: "us-east-1", // Make sure this is a region where Bedrock is available
});

export const handler: Schema["analyzeImage"]["functionHandler"] = async (
  event,
  context
) => {
  const base64Image = event.arguments.imageBase64;

  // Configure the request for Nova Lite model
  const native_request = {
    schemaVersion: "messages-v1",
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format: "jpeg",
              source: { bytes: base64Image },
            }
          },
          {
            text: "Describe the picture"
          }
        ],
      }
    ],
    inferenceConfig: {
      maxTokens: 300,
      topP: 0.1,
      topK: 20,
      temperature: 0.3
    }
  };

  try {
    // Invoke the model
    const response = await client.send(
      new InvokeModelCommand({
        modelId: process.env.MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(native_request),
      })
    );

    // Parse and return the response
    const responseBody = JSON.parse(Buffer.from(response.body).toString());
    return responseBody.output.message.content[0].text;
  } catch (error) {
    console.error("Error invoking Bedrock:", error);
    throw error;
  }
};
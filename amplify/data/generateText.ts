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
  const prompt = event.arguments.prompt;

  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
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
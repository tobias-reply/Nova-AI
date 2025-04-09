import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  const prompt = event.arguments.prompt;
  
  const input = {
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `Create a haiku about: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  const data = JSON.parse(Buffer.from(response.body).toString());
  return data.messages[0].content;
};

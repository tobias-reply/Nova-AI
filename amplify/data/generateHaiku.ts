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
  const input = {
    modelId: "amazon.nova-lite-v1:0",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: `Create a haiku about: ${event.arguments.prompt}` }]
        }
      ]
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  const data = JSON.parse(Buffer.from(response.body).toString());
  return data.output.message.content[0].text;
};

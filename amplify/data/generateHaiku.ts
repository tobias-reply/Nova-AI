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
    modelId: "amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: `Create a haiku about: ${prompt}`,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 100
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  // Parse the response and return the generated haiku
  const data = JSON.parse(Buffer.from(response.body).toString());
  return data.completion;
};

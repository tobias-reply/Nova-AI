import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    const payload = {
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 300,
        temperature: 0.7,
        top_k: 250,
        top_p: 1,
        stop_sequences: ["\n\nHuman:"],
      }),
    };

    const command = new InvokeModelCommand(payload);
    const response = await bedrockClient.send(command);

    // Convert the Uint8Array to a string
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);

    return new Response(JSON.stringify({ response: parsedResponse.completion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
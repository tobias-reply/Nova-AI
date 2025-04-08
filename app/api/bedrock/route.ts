import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    
    console.log('Sending request to Bedrock...'); // Debug log
    const response = await bedrockClient.send(command);
    console.log('Received response from Bedrock'); // Debug log

    if (!response.body) {
      throw new Error('No response body received from Bedrock');
    }

    // Convert the Uint8Array to a string
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);

    if (!parsedResponse.completion) {
      throw new Error('No completion in response');
    }

    return new Response(JSON.stringify({ response: parsedResponse.completion }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
    });
  } catch (error: any) {
    console.error("Error details:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

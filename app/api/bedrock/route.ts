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
      modelId: "amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxTokenCount: 300,
          stopSequences: []
        }
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
    if (!parsedResponse.results) {
      throw new Error('No results in response');
    }
    return new Response(JSON.stringify({ response: parsedResponse.results[0].outputText }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
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

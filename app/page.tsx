"use client";

import { useState, FormEvent } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, errors } = await client.queries.generateText({
        prompt,
      });

      if (!errors) {
        setAnswer(data);
        setPrompt("");
      } else {
        console.error(errors);
        setAnswer("Error generating response. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setAnswer("Error generating response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Nova Lite AI Chat</h1>
      
      <form onSubmit={sendPrompt} className="space-y-4">
        <div>
          <textarea
            className="w-full p-4 border rounded-lg text-black"
            placeholder="Enter your prompt..."
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !prompt}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Generating..." : "Send"}
        </button>
      </form>

      {answer && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Response:</h2>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </main>
  );
}


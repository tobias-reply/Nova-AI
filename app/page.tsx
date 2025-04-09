"use client";

import { useState, FormEvent } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
      });

      if (!errors) {
        setAnswer(data);
        setPrompt("");
      } else {
        console.error(errors);
        setAnswer("Sorry, there was an error generating your haiku. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setAnswer("Sorry, there was an error generating your haiku. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          AI Haiku Generator
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <form className="mb-6" onSubmit={sendPrompt}>
            <div className="flex flex-col gap-4">
              <input
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter a topic for your haiku..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt}
                className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? "Generating..." : "Generate Haiku"}
              </button>
            </div>
          </form>
          {answer && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <pre className="whitespace-pre-wrap font-serif text-lg text-center leading-relaxed">
                {answer}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}



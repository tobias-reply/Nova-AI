"use client";

import { useState, FormEvent, ChangeEvent } from "react";
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      let imageData = null;
      let imageFormat = null;

      if (selectedImage) {
        const reader = new FileReader();
        const imageBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(selectedImage);
        });

        imageData = Buffer.from(imageBuffer).toString('base64');
        imageFormat = selectedImage.type.split('/')[1];
      }

      const { data, errors } = await client.queries.generateText({
        prompt,
        imageData,
        imageFormat,
      });

      if (!errors) {
        setAnswer(data);
        setPrompt("");
        setSelectedImage(null);
        setImagePreview(null);
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
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4"
          />
          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
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
          disabled={loading || (!prompt && !selectedImage)}
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


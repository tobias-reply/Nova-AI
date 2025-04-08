"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import Chat from './components/Chat';

Amplify.configure(outputs);

// Initialize Amplify configuration

export default function App() {
  return (
    <main className="container">
      <h1>Amazon Bedrock Chat</h1>
      <div className="chat-wrapper">
        <Chat />
      </div>
    </main>
  );
}

"use client";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "@/amplify_outputs.json";
import Chat from './components/Chat';

// Initialize Amplify configuration
Amplify.configure(outputs);

function App() {
  return (
    <main className="container">
      <h1>Amazon Bedrock Chat</h1>
      <div className="chat-wrapper">
        <Chat />
      </div>
    </main>
  );
}

// Wrap with authenticator if you need authentication
export default App;

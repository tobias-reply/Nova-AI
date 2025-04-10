"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Webcam from "react-webcam";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

const CAPTURE_INTERVAL = 30000; // 30 seconds
const WEBCAM_CONFIG = {
  width: 896,
  height: 896,
  facingMode: "user",
};

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const [description, setDescription] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const captureIntervalRef = useRef<NodeJS.Timeout>();

  const captureAndAnalyze = async () => {
    if (!webcamRef.current) return;

    try {
      // Capture image as base64
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Remove the data:image/jpeg;base64, prefix
      const base64Image = imageSrc.split(',')[1];

      // Send to Bedrock through our API
      const { data: result, errors } = await client.queries.analyzeImage({
        imageBase64: base64Image,
      });

      if (errors) {
        console.error("Error analyzing image:", errors);
        return;
      }

      setDescription(result || "No description available");
    } catch (error) {
      console.error("Error during capture and analysis:", error);
    }
  };

  const toggleCapture = () => {
    if (!isCapturing) {
      setIsCapturing(true);
      captureAndAnalyze(); // Immediate first capture
      captureIntervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL);
    } else {
      setIsCapturing(false);
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Vision Analysis
        </h1>

        <div className="relative w-full aspect-square max-w-lg mx-auto">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={WEBCAM_CONFIG}
            className="rounded-lg shadow-lg w-full h-full object-cover"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={toggleCapture}
            className={`px-6 py-3 rounded-full font-semibold ${
              isCapturing
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white transition-colors`}
          >
            {isCapturing ? "Stop Capturing" : "Start Capturing"}
          </button>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-3">AI Description:</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {description || "Waiting for first capture..."}
          </p>
        </div>
      </div>
    </main>
  );
}


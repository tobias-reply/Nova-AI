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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-7xl gap-8">
        {/* Left side - Webcam */}
        <div className="w-1/2">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#00C49B' }}>
            AI Vision Analysis
          </h1>

          <div className="relative aspect-square">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={WEBCAM_CONFIG}
              className="rounded-lg shadow-lg w-full h-full object-cover"
            />
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={toggleCapture}
              style={{
                backgroundColor: isCapturing ? '#5E3D9C' : '#277D9A',
                transition: 'background-color 0.3s'
              }}
              className="px-6 py-3 rounded-full font-semibold text-white hover:opacity-90"
            >
              {isCapturing ? "Stop Capturing" : "Start Capturing"}
            </button>
          </div>
        </div>

        {/* Right side - AI Description */}
        <div className="w-1/2">
          <div style={{ backgroundColor: '#0EA49A' }} className="p-6 rounded-lg shadow-lg h-full">
            <h2 className="text-2xl font-semibold mb-4 text-white">AI Description:</h2>
            <p className="text-white whitespace-pre-wrap">
              {description || "Waiting for first capture..."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}



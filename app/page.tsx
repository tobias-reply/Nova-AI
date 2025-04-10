"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Start webcam when component mounts
    startWebcam();

    // Set up interval for capturing images
    const interval = setInterval(captureAndAnalyze, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    try {
      // Capture frame from video
      const context = canvasRef.current.getContext("2d");
      if (!context) return;

      context.drawImage(videoRef.current, 0, 0, 640, 480);
      
      // Convert to base64
      const imageBase64 = canvasRef.current.toDataURL("image/jpeg")
        .replace("data:image/jpeg;base64,", "");

      // Send to Bedrock
      const { data, errors } = await client.queries.analyzeImage({
        imageBase64
      });

      if (errors) {
        console.error("Error analyzing image:", errors);
        return;
      }

      setDescription(data || "No description available");
    } catch (error) {
      console.error("Error processing image:", error);
      setDescription("Error analyzing image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="max-w-2xl w-full space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          AI Image Analyzer
        </h1>
        
        <div className="relative bg-white rounded-lg shadow-lg p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="hidden"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            AI Description
          </h2>
          {isLoading ? (
            <div className="text-center text-gray-600">
              Analyzing image...
            </div>
          ) : (
            <p className="text-gray-800 whitespace-pre-wrap">
              {description || "Waiting for first analysis..."}
            </p>
          )}
        </div>

        <p className="text-sm text-center text-gray-600">
          Images are automatically captured and analyzed every 30 seconds
        </p>
      </div>
    </main>
  );
}


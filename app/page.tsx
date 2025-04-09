"use client";
import { useState, useRef, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, // Reduced quality
            height: { ideal: 480 } 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startWebcam();
    
    // Cleanup
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);

    try {
      // Capture frame from webcam
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Match canvas size to video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert to base64 and reduce quality
      const imageData = canvas.toDataURL('image/jpeg', 0.5); // 50% quality
      const base64Data = imageData.split(',')[1];

      // Send to Bedrock
      const { data, errors } = await client.queries.generateText({
        prompt: "Describe what you see in this image in detail.",
        imageData: base64Data,
        imageFormat: 'jpeg'
      });

      if (!errors) {
        setAnswer(data);
      } else {
        console.error(errors);
        setAnswer("Error analyzing image. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setAnswer("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Nova Lite Image Analyzer</h1>
      
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <button
          onClick={captureAndAnalyze}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Capture and Analyze"}
        </button>

        {answer && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Analysis:</h2>
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </main>
  );
}

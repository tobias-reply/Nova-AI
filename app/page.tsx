"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Webcam from "react-webcam";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import Image from 'next/image';

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
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const base64Image = imageSrc.split(',')[1];

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
      captureAndAnalyze();
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
    <>
      {/* Header Section */}
      <header className="header_section">
        <div className="container-fluid px-6">
          <nav className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">AI Vision</span>
            </div>
            <div className="flex items-center space-x-8">
              <a href="#" className="text-white hover:text-gray-300">Home</a>
              <a href="#about" className="text-white hover:text-gray-300">About</a>
              <a href="#features" className="text-white hover:text-gray-300">Features</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero_area">
        <section className="layout_padding">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap items-center -mx-4">
              {/* Left Column - Text Content */}
              <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
                <div className="max-w-lg">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    AI-Powered Vision Analysis
                  </h1>
                  <p className="text-lg text-white mb-8">
                    Experience real-time computer vision analysis powered by advanced AI technology.
                    Get instant insights about your surroundings through our cutting-edge visual recognition system.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={toggleCapture}
                      className={`btn-primary ${isCapturing ? 'bg-red-500 hover:border-red-500 hover:text-red-500' : ''}`}
                    >
                      {isCapturing ? "Stop Analysis" : "Start Analysis"}
                    </button>
                    <a href="#about" className="btn-secondary">
                      Learn More
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column - Webcam and Analysis */}
              <div className="w-full lg:w-1/2 px-4">
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <div className="aspect-square rounded-lg overflow-hidden mb-6">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={WEBCAM_CONFIG}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Analysis:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {description || "Waiting for analysis to begin..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section id="features" className="layout_padding bg-white">
        <div className="container mx-auto px-6">
          <div className="heading_container">
            <h2>Key Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analysis</h3>
              <p className="text-gray-600">Instant visual analysis with continuous monitoring capabilities</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced AI</h3>
              <p className="text-gray-600">Powered by state-of-the-art computer vision algorithms</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
              <p className="text-gray-600">Get detailed descriptions of analyzed scenes in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="layout_padding bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="heading_container">
            <h2>About Our Technology</h2>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-700 mb-8">
              Our AI Vision Analysis system combines cutting-edge computer vision technology with advanced machine learning
              models to provide real-time scene understanding and object detection. Whether you're looking to enhance
              security, automate monitoring, or gain insights from visual data, our system delivers accurate and
              reliable results.
            </p>
            <a href="#" className="btn-primary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-color text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AI Vision</h3>
              <p className="text-gray-400">
                Advanced computer vision solutions for the modern world.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">Email: info@aivision.com</p>
              <p className="text-gray-400">Phone: (555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} AI Vision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
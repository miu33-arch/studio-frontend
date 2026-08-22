"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export interface GestureTelemetry {
  gesture: "IDLE" | "PINCH/DRAG" | "OPEN_PALM" | "POINT";
  axisLock: "NONE" | "X_AXIS" | "Y_AXIS" | "Z_AXIS";
  coords: { x: number; y: number; z: number };
  rawLandmarks: { x: number; y: number; z: number }[] | null;
  pinchDistance: number;
}

export function useHandGesture(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [telemetry, setTelemetry] = useState<GestureTelemetry>({
    gesture: "IDLE",
    axisLock: "NONE",
    coords: { x: 0, y: 0, z: 0 },
    rawLandmarks: null,
    pinchDistance: 1,
  });

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function initLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      if (active) {
        landmarkerRef.current = landmarker;
        startPredictionLoop();
      }
    }

    initLandmarker();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      landmarkerRef.current?.close();
    };
  }, []);

  const startPredictionLoop = () => {
    const detect = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        landmarkerRef.current
      ) {
        const startTimeMs = performance.now();
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];

          // Euclidean distance between Thumb tip & Index tip
          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const dz = thumbTip.z - indexTip.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const isPinching = dist < 0.08;

          setTelemetry({
            gesture: isPinching ? "PINCH/DRAG" : "OPEN_PALM",
            axisLock: isPinching ? "NONE" : "NONE",
            coords: {
              x: parseFloat(indexTip.x.toFixed(3)),
              y: parseFloat(indexTip.y.toFixed(3)),
              z: parseFloat(indexTip.z.toFixed(3)),
            },
            rawLandmarks: landmarks,
            pinchDistance: parseFloat(dist.toFixed(3)),
          });
        } else {
          setTelemetry((prev) => ({ ...prev, gesture: "IDLE", rawLandmarks: null }));
        }
      }
      requestRef.current = requestRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  return telemetry;
}
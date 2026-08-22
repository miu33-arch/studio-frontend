"use client";

import { useEffect, useRef, useState } from "react";
import SpatialViewport from "./SpatialViewport";
import { useHandGesture } from "@/hooks/useHandGesture";
import { UploadCloud, FileCode2, RefreshCw } from "lucide-react";

export default function SpatialGestureSandbox() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [modelFileName, setModelFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const telemetry = useHandGesture(videoRef);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMounted && videoRef.current) {
              videoRef.current.play().catch((e) => {
                if (e.name !== "AbortError") console.error("Video play error:", e);
              });
              setCameraActive(true);
            }
          };
        }
      } catch (err) {
        console.error("Webcam access error:", err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFileUpload = (file: File) => {
    if (file.name.endsWith(".glb") || file.name.endsWith(".gltf")) {
      const objectUrl = URL.createObjectURL(file);
      setCustomModelUrl(objectUrl);
      setModelFileName(file.name);
    } else {
      alert("Please upload a .glb or .gltf 3D file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleResetModel = () => {
    setCustomModelUrl(null);
    setModelFileName(null);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative w-full h-162.5 border rounded-xl overflow-hidden bg-slate-950 transition-colors ${
        isDragging ? "border-cyan-400 bg-cyan-950/20" : "border-cyan-500/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* 3D Viewport Layer */}
      <SpatialViewport telemetry={telemetry} customModelUrl={customModelUrl} />

      {/* Top Header HUD + Upload Trigger */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-slate-900/80 border border-cyan-500/40 rounded font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider backdrop-blur-md">
          Spatial Gesture 3D Sandbox
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-700 hover:border-cyan-400 rounded text-xs font-mono text-slate-200 transition-all shadow-lg backdrop-blur-md"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>{modelFileName ? modelFileName : "Upload .GLB"}</span>
        </button>

        {customModelUrl && (
          <button
            onClick={handleResetModel}
            title="Reset to default building"
            className="p-1.5 bg-slate-900/90 border border-slate-700 hover:border-rose-400 text-slate-400 hover:text-rose-400 rounded transition-all backdrop-blur-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top-Right Telemetry HUD */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-cyan-500/30 p-3 rounded-lg font-mono text-[11px] text-cyan-300/80 space-y-1 backdrop-blur-md pointer-events-none">
        <div>
          GESTURE: <span className="text-white font-bold">{telemetry.gesture}</span>
        </div>
        <div>
          AXIS LOCK: <span className="text-white font-bold">{telemetry.axisLock}</span>
        </div>
        <div>
          PINCH DELTA: <span className="text-white font-bold">{telemetry.pinchDistance}</span>
        </div>
      </div>

      {/* Drag Over Overlay Alert */}
      {isDragging && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-none">
          <FileCode2 className="w-12 h-12 text-cyan-400 animate-bounce mb-2" />
          <p className="font-mono text-sm text-cyan-300 font-bold">DROP .GLB / .GLTF BIM MODEL HERE</p>
        </div>
      )}

      {/* Bottom-Left Live Camera Preview */}
      <div className="absolute bottom-4 left-4 z-10 w-44 h-32 border border-cyan-500/40 rounded-lg overflow-hidden bg-slate-900/90 shadow-2xl backdrop-blur-md">
        <video
          ref={videoRef}
          className="w-full h-full object-cover transform -scale-x-100"
          playsInline
          muted
          autoPlay
        />
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-cyan-400/60">
            INITIALIZING SENSOR...
          </div>
        )}
      </div>

      {/* Bottom-Right Coordinates Feed */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-cyan-500/30 px-3 py-2 rounded font-mono text-[11px] text-cyan-400/80 space-y-0.5 backdrop-blur-md pointer-events-none">
        <div>
          VECTOR X: <span className="text-white">{telemetry.coords.x}</span>
        </div>
        <div>
          VECTOR Y: <span className="text-white">{telemetry.coords.y}</span>
        </div>
        <div>
          VECTOR Z: <span className="text-white">{telemetry.coords.z}</span>
        </div>
      </div>
    </div>
  );
}
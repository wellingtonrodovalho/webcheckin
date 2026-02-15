
import React, { useRef, useState, useEffect } from 'react';

interface SelfieCaptureProps {
  onCapture: (base64: string) => void;
  label: string;
}

const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (isCapturing && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onplaying = () => setIsCameraReady(true);
      video.play().catch(() => setIsCameraReady(false));
    }
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      alert("Permita o acesso à câmera.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 480;
      canvas.height = 480;
      ctx.translate(480, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, 480, 480);
      
      // Qualidade reduzida para 0.4
      const base64 = canvas.toDataURL('image/jpeg', 0.4);
      setCapturedImage(base64);
      onCapture(base64);
      stopCamera();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">{label}</label>
      <div className="relative w-full aspect-square max-w-[200px] mx-auto overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-900 flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover" alt="Selfie" />
        ) : isCapturing ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" />
        ) : (
          <i className="fas fa-user-circle text-slate-700 text-5xl"></i>
        )}
        {isCapturing && !isCameraReady && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px]">CARREGANDO...</div>}
      </div>
      <div className="flex justify-center mt-2">
        {!isCapturing && !capturedImage && <button type="button" onClick={startCamera} className="text-[10px] font-black uppercase bg-blue-600 text-white px-4 py-2 rounded-lg">Abrir Câmera</button>}
        {isCapturing && <button type="button" onClick={capturePhoto} className="w-12 h-12 rounded-full border-4 border-white bg-blue-600 shadow-lg"></button>}
        {capturedImage && <button type="button" onClick={() => {setCapturedImage(null); startCamera();}} className="text-[10px] font-black uppercase bg-slate-800 text-white px-4 py-2 rounded-lg">Refazer</button>}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SelfieCapture;

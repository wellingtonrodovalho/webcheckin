
import React, { useRef, useState, useCallback } from 'react';

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(base64);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative w-full aspect-square max-w-[300px] mx-auto overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 flex items-center justify-center group shadow-inner">
        {capturedImage ? (
          <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
        ) : isCapturing ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover mirror-mode"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="text-center p-6 text-slate-400">
            <i className="fas fa-user-circle text-5xl mb-2"></i>
            <p className="text-[10px] uppercase font-bold tracking-wider">Aguardando Câmera</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mt-2">
        {!isCapturing && !capturedImage && (
          <button 
            onClick={startCamera}
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            <i className="fas fa-camera mr-2"></i> Abrir Câmera para Selfie
          </button>
        )}
        {isCapturing && (
          <button 
            onClick={capturePhoto}
            className="w-12 h-12 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          </button>
        )}
        {capturedImage && (
          <button 
            onClick={retake}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold hover:bg-slate-300 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i> Tirar Outra Foto
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;

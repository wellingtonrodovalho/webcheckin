
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
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => setIsCameraReady(true));
      };
    }
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      setIsCameraReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 800 },
          height: { ideal: 800 }
        }, 
        audio: false 
      });
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Permissão de câmera negada ou dispositivo não encontrado.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        
        if (vW === 0 || vH === 0) return;

        canvasRef.current.width = vW;
        canvasRef.current.height = vH;
        
        context.save();
        context.translate(vW, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, vW, vH);
        context.restore();
        
        // Qualidade 0.7 para manter o arquivo leve e compatível com Apps Script
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
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
    setIsCameraReady(false);
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">{label}</label>
      
      <div className="relative w-full aspect-square max-w-[280px] mx-auto overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-900 flex items-center justify-center shadow-lg">
        {capturedImage ? (
          <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
        ) : isCapturing ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <i className="fas fa-camera text-slate-600 text-2xl"></i>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase">Câmera Desativada</p>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        {!isCapturing && !capturedImage && (
          <button onClick={startCamera} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            <i className="fas fa-camera mr-2"></i> Abrir Câmera
          </button>
        )}
        
        {isCapturing && (
          <button 
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${isCameraReady ? 'border-blue-600 bg-white' : 'border-slate-400 bg-slate-200 opacity-50'}`}
          >
            <div className={`w-10 h-10 rounded-full ${isCameraReady ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
          </button>
        )}
        
        {capturedImage && (
          <button onClick={retake} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
            <i className="fas fa-redo mr-2"></i> Repetir Foto
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;

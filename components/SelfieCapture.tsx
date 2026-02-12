
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

  const startCamera = async () => {
    try {
      // Usando 'ideal' para maior compatibilidade com diferentes modelos de celular/webcam
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        }, 
        audio: false 
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Alguns navegadores exigem play() explícito
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Erro ao dar play no vídeo:", e));
        };
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Câmera bloqueada ou não encontrada. Verifique as permissões do seu navegador.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Desenha a imagem espelhada se necessário
        context.save();
        context.scale(-1, 1);
        context.drawImage(videoRef.current, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
        context.restore();
        
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
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

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative w-full aspect-square max-w-[280px] mx-auto overflow-hidden rounded-full border-4 border-blue-100 bg-slate-100 flex items-center justify-center shadow-inner">
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
          <div className="text-center p-6 text-slate-400">
            <i className="fas fa-camera text-4xl mb-2 opacity-20"></i>
            <p className="text-[10px] uppercase font-bold tracking-wider">Câmera Desligada</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mt-3">
        {!isCapturing && !capturedImage && (
          <button 
            onClick={startCamera}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <i className="fas fa-video mr-2"></i> Ativar Câmera
          </button>
        )}
        {isCapturing && (
          <button 
            onClick={capturePhoto}
            className="w-14 h-14 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            title="Tirar Foto"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"></div>
          </button>
        )}
        {capturedImage && (
          <button 
            onClick={retake}
            className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-full text-xs font-bold hover:bg-slate-300 transition-all"
          >
            <i className="fas fa-sync-alt mr-2"></i> Refazer Foto
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;

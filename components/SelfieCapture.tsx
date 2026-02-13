
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

  // Efeito para vincular o stream ao elemento de vídeo assim que ele for renderizado
  useEffect(() => {
    if (isCapturing && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Erro ao iniciar reprodução do vídeo:", err);
      });
    }
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Erro ao acessar a câmera. Por favor, verifique as permissões do seu navegador.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Garantir que o canvas tenha o tamanho do vídeo real
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Desenha a imagem (espelhada para parecer natural ao usuário)
        context.save();
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        context.restore();
        
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.85);
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

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">{label}</label>
      
      <div className="relative w-full aspect-square max-w-[300px] mx-auto overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-900 flex items-center justify-center shadow-lg group">
        {capturedImage ? (
          <img src={capturedImage} alt="Selfie capturada" className="w-full h-full object-cover" />
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
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <i className="fas fa-camera text-slate-600 text-3xl"></i>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Câmera Desativada</p>
          </div>
        )}
        
        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mt-4">
        {!isCapturing && !capturedImage && (
          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <i className="fas fa-video"></i> Iniciar Câmera
          </button>
        )}
        
        {isCapturing && (
          <button 
            onClick={capturePhoto}
            className="w-16 h-16 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full group-hover:bg-blue-500 transition-colors"></div>
          </button>
        )}
        
        {capturedImage && (
          <button 
            onClick={retake}
            className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
          >
            <i className="fas fa-redo"></i> Tirar Outra
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;

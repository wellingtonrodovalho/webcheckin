
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
      
      // Evento mais seguro que onloadedmetadata para mobile
      videoRef.current.onplaying = () => {
        setIsCameraReady(true);
      };

      videoRef.current.play().catch(err => {
        console.error("Erro ao iniciar reprodução do vídeo:", err);
      });
    }
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      setIsCameraReady(false);
      // Resolução modesta para garantir compatibilidade e fluidez
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível abrir a câmera. Verifique se deu permissão no navegador.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    setIsCapturing(false);
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && isCameraReady && video.readyState >= 2) {
      const context = canvas.getContext('2d', { alpha: false });
      if (context) {
        const vW = video.videoWidth;
        const vH = video.videoHeight;
        
        // Limite rigoroso para evitar estouro de memória no Base64
        const maxDim = 720; 
        let tW = vW;
        let tH = vH;

        if (vW > maxDim || vH > maxDim) {
          const ratio = vW / vH;
          if (ratio > 1) {
            tW = maxDim;
            tH = maxDim / ratio;
          } else {
            tH = maxDim;
            tW = maxDim * ratio;
          }
        }

        canvas.width = tW;
        canvas.height = tH;
        
        // Desenha o frame usando requestAnimationFrame para estabilidade
        requestAnimationFrame(() => {
          context.save();
          context.translate(tW, 0);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, tW, tH);
          context.restore();
          
          // COMPRESSÃO AGRESSIVA (0.5) para garantir que o smartphone não trave ao gerar a string
          const base64 = canvas.toDataURL('image/jpeg', 0.5);
          
          // ORDEM CRÍTICA: Primeiro para o hardware, depois atualiza o estado
          stopCamera(); 
          
          setCapturedImage(base64);
          onCapture(base64);
        });
      }
    } else {
      alert("Aguarde a imagem da câmera aparecer.");
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

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
      
      <div className="relative w-full aspect-square max-w-[280px] mx-auto overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-900 flex items-center justify-center shadow-lg">
        {capturedImage ? (
          <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover animate-in fade-in" />
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
            <p className="text-slate-500 text-[10px] font-bold uppercase">Câmera pronta</p>
          </div>
        )}
        
        {/* Indicador de carregamento da câmera */}
        {isCapturing && !isCameraReady && (
          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
            <i className="fas fa-circle-notch fa-spin text-white text-2xl"></i>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mt-4">
        {!isCapturing && !capturedImage && (
          <button 
            type="button"
            onClick={startCamera} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <i className="fas fa-camera mr-2"></i> Abrir Câmera
          </button>
        )}
        
        {isCapturing && (
          <button 
            type="button"
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${isCameraReady ? 'border-blue-600 bg-white scale-110' : 'border-slate-400 bg-slate-200 opacity-50'}`}
          >
            <div className={`w-12 h-12 rounded-full ${isCameraReady ? 'bg-blue-600 shadow-inner' : 'bg-slate-400'}`}></div>
          </button>
        )}
        
        {capturedImage && (
          <button 
            type="button"
            onClick={retake} 
            className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all"
          >
            <i className="fas fa-redo mr-2"></i> Repetir Foto
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;

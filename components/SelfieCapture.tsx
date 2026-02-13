
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

  // Monitoramento de prontidão da câmera (múltiplos eventos para compatibilidade mobile)
  useEffect(() => {
    if (isCapturing && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;

      const handleReady = () => {
        if (video.videoWidth > 0) {
          setIsCameraReady(true);
        }
      };

      video.onplaying = handleReady;
      video.oncanplay = handleReady;
      video.onloadeddata = handleReady;

      // Check de segurança periódico (caso os eventos não disparem em alguns Androids)
      const checkInterval = setInterval(() => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          setIsCameraReady(true);
          clearInterval(checkInterval);
        }
      }, 500);

      video.play().catch(err => console.error("Erro autoplay:", err));

      return () => clearInterval(checkInterval);
    }
  }, [isCapturing, stream]);

  const startCamera = async () => {
    try {
      setIsCameraReady(false);
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
      alert("Não foi possível abrir a câmera. Verifique as permissões de privacidade do seu navegador.");
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
    
    if (!video || !canvas) return;

    // Verificação de segurança para evitar capturas pretas ou crashes
    if (video.readyState < 2 || video.videoWidth === 0) {
      alert("Aguarde a imagem da câmera carregar completamente...");
      return;
    }

    try {
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const vW = video.videoWidth;
      const vH = video.videoHeight;
      
      // Resolução segura para evitar crash de memória em Base64 no mobile
      const maxDim = 640; 
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
      
      // Desenho direto (mais estável que requestAnimationFrame para este caso)
      context.save();
      context.translate(tW, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, tW, tH);
      context.restore();
      
      // Qualidade 0.5 para garantir que a string base64 não exceda limites de buffer do navegador
      const base64 = canvas.toDataURL('image/jpeg', 0.5);
      
      setCapturedImage(base64);
      onCapture(base64);
      
      // Aguarda um instante antes de desligar o hardware para garantir o processamento
      setTimeout(stopCamera, 200);
      
    } catch (err) {
      console.error("Erro na captura:", err);
      alert("Erro ao processar a foto. Tente novamente.");
    }
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
            <p className="text-slate-500 text-[10px] font-bold uppercase">Toque abaixo para iniciar</p>
          </div>
        )}
        
        {isCapturing && !isCameraReady && (
          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-2"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Iniciando...</span>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mt-4">
        {!isCapturing && !capturedImage && (
          <button 
            type="button"
            onClick={startCamera} 
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            <i className="fas fa-camera mr-2"></i> Abrir Câmera
          </button>
        )}
        
        {isCapturing && (
          <div className="flex flex-col items-center gap-2">
            <button 
              type="button"
              onClick={capturePhoto}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isCameraReady ? 'border-blue-600 bg-white' : 'border-slate-500 bg-slate-300 opacity-70'}`}
            >
              <div className={`w-14 h-14 rounded-full ${isCameraReady ? 'bg-blue-600 shadow-lg' : 'bg-slate-500'}`}></div>
            </button>
            <span className="text-[10px] font-black text-blue-600 uppercase">Toque para tirar a foto</span>
          </div>
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

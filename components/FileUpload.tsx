
import React, { useState } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (base64: string) => void;
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, id }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar para manter o Base64 leve e evitar crashes no mobile
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Comprimir como JPEG 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPreview(compressedBase64);
          onFileSelect(compressedBase64);
        }
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      alert("Erro ao ler arquivo.");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreview(base64String);
          onFileSelect(base64String);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative group">
        <input
          type="file"
          id={id}
          accept="image/*"
          /* Atributo 'capture' removido para permitir escolha entre Galeria e Câmera */
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor={id}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${preview ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'}
            ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <i className="fas fa-circle-notch fa-spin text-blue-500 text-2xl mb-2"></i>
              <span className="text-slate-500 text-xs font-bold uppercase">Processando...</span>
            </div>
          ) : preview ? (
            <div className="flex items-center gap-3">
              <i className="fas fa-check-circle text-emerald-500 text-2xl"></i>
              <span className="text-emerald-700 font-medium text-sm">Documento Anexado</span>
            </div>
          ) : (
            <div className="text-center p-4">
              <i className="fas fa-file-upload text-slate-400 text-3xl mb-2"></i>
              <p className="text-slate-500 text-[10px] font-bold uppercase">Anexar ou Tirar Foto do Documento</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default FileUpload;

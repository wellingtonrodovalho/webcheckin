
import React, { useState } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (base64: string) => void;
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, id }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onFileSelect(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative group">
        <input
          type="file"
          id={id}
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor={id}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${preview ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'}`}
        >
          {preview ? (
            <div className="flex items-center gap-3">
              <i className="fas fa-check-circle text-emerald-500 text-2xl"></i>
              <span className="text-emerald-700 font-medium text-sm">Documento Carregado</span>
            </div>
          ) : (
            <div className="text-center p-4">
              <i className="fas fa-cloud-upload-alt text-slate-400 text-3xl mb-2"></i>
              <p className="text-slate-500 text-xs">Clique para selecionar ou tirar foto do RG/CNH</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default FileUpload;

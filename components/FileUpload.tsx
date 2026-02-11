
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFilesSelect: (files: FileList) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFilesSelect(files);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      onClick={triggerUpload}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all group ${
        isDragging 
          ? 'border-blue-600 bg-blue-100 scale-[1.02]' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <input 
        type="file" 
        className="hidden" 
        accept="image/*" 
        multiple
        onChange={handleChange} 
        ref={fileInputRef}
      />
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform ${
        isDragging ? 'bg-blue-200 scale-110' : 'bg-blue-100 group-hover:scale-110'
      }`}>
        <svg className={`w-10 h-10 ${isDragging ? 'text-blue-700' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-800">
        {isDragging ? 'Drop your receipts here' : 'Upload Receipt Images'}
      </h3>
      <p className="text-slate-500 mt-2 text-center">
        {isDragging ? 'Release to start processing' : 'Click to browse, take photos, or drag and drop multiple files here'}
      </p>
      <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-widest text-center">PNG, JPG up to 10MB per file</p>
    </div>
  );
};

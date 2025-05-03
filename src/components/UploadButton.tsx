
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const UploadButton = ({ onUpload, isLoading }: UploadButtonProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`w-full h-52 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all
      ${dragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}
      hover:border-primary hover:bg-primary/5`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        ref={fileInputRef}
        type="file"
        id="file-upload"
        accept=".zip,.tar,.gz,.7z"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />
      
      <Upload size={40} className="mb-4 text-primary" />
      
      <p className="mb-4 text-center text-muted-foreground">
        Drag &amp; drop your GitLab export file here, or
      </p>
      
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
        className="gradient-purple-blue"
      >
        Select File
      </Button>
    </div>
  );
};

export default UploadButton;

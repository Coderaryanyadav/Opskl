'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<string>;
  accept?: {
    [key: string]: string[];
  };
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function FileUpload({
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  disabled = false,
  label = 'Upload file',
  description = 'PDF, DOC, DOCX (max 5MB)',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      setError(null);
      setFile(selectedFile);
      setIsUploading(true);
      setProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const url = await onUpload(selectedFile);
        setFileUrl(url);
        setProgress(100);
      } catch (err) {
        console.error('Upload failed:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to upload file'
        );
        setProgress(0);
        setFile(null);
      } finally {
        clearInterval(interval);
        setTimeout(() => setIsUploading(false), 500);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled: isUploading || disabled,
    onDropRejected: (fileRejections) => {
      const { errors } = fileRejections[0];
      let message = errors[0]?.message || 'File not accepted';
      
      if (errors.some(e => e.code === 'file-too-large')) {
        message = 'File is too large';
      } else if (errors.some(e => e.code === 'file-invalid-type')) {
        message = 'Invalid file type';
      }
      
      setError(message);
    },
  });

  const handleRemove = () => {
    setFile(null);
    setFileUrl(null);
    setProgress(0);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      
      {file ? (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icons.file className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <Icons.trash className="h-4 w-4" />
            </Button>
          </div>
          
          {isUploading && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {fileUrl && !isUploading && (
            <div className="mt-2 flex items-center text-xs text-green-600">
              <Icons.checkCircle className="h-4 w-4 mr-1" />
              <span>Upload successful</span>
            </div>
          )}
          
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
          
          <input type="hidden" name="resumeUrl" value={fileUrl || ''} />
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Icons.upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag & drop your file here, or click to select'}
                
              </p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

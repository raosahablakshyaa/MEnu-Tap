'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  label: string;
  value?: string;
  onUpload: (file: File) => Promise<string | undefined>;
  onChange: (url: string) => void;
  accept?: string;
}

export function ImageUpload({ label, value, onUpload, onChange, accept = 'image/*' }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      if (url) onChange(url);
    } finally {
      setUploading(false);
    }
  }, [onUpload, onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="h-32 w-32 rounded-xl object-cover ring-2 ring-orange-500/20" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
            dragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-zinc-300 dark:border-zinc-600',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            type="file"
            accept={accept}
            className="hidden"
            id={`upload-${label}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <label htmlFor={`upload-${label}`} className="flex cursor-pointer flex-col items-center gap-2 p-4">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            ) : (
              <Upload className="h-8 w-8 text-zinc-400" />
            )}
            <span className="text-xs text-zinc-500">Drag & drop or click to upload</span>
          </label>
        </div>
      )}
    </div>
  );
}

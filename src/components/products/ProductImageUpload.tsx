"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, GripVertical, Star, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  isPrimary: boolean;
}

interface ProductImageUploadProps {
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
}

function uid() { return Math.random().toString(36).slice(2, 8); }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductImageUpload({
  value,
  onChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(value ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const emit = (imgs: UploadedImage[]) => {
    setImages(imgs);
    onChange?.(imgs);
  };

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - images.length;
      const toAdd = Array.from(files).slice(0, remaining);

      const newImages: UploadedImage[] = toAdd.map((file, i) => ({
        id: uid(),
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        isPrimary: images.length === 0 && i === 0,
      }));

      emit([...images, ...newImages]);
    },
    [images, maxImages]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    // Re-assign primary if needed
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    emit(updated);
  };

  const setPrimary = (id: string) => {
    emit(images.map((img) => ({ ...img, isPrimary: img.id === id })));
  };

  const canAdd = images.length < maxImages;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 h-36 rounded-[12px] border-2 border-dashed transition-all cursor-pointer",
            isDragging
              ? "border-[#C8924A] bg-[#C8924A]/10"
              : "border-[#3D2E1E] bg-[#2E231A] hover:border-[#C8924A]/40 hover:bg-[#221A12]"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all",
            isDragging ? "bg-[#C8924A]/20 text-[#C8924A]" : "bg-[#3D2E1E] text-[#5A4232]"
          )}>
            <Upload size={18} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#9A7A5A]">
              {isDragging ? "Drop images here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-[11px] text-[#3D2E1E] mt-0.5">
              JPG, PNG, WebP · Max 5MB · {images.length}/{maxImages} uploaded
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                "relative group rounded-[10px] border overflow-hidden bg-[#2E231A] aspect-square",
                img.isPrimary ? "border-[#C8924A]/60" : "border-[#3D2E1E]"
              )}
            >
              {/* Image */}
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#C8924A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <Star size={8} />
                  Primary
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-white/70">
                <GripVertical size={14} />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPrimary(img.id); }}
                    className="flex items-center gap-1 text-[10px] font-medium text-white bg-[#C8924A]/80 hover:bg-[#C8924A] px-2 py-1 rounded-full transition-colors"
                  >
                    <Star size={10} />
                    Set Primary
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="flex items-center gap-1 text-[10px] font-medium text-white bg-red-500/70 hover:bg-red-500 px-2 py-1 rounded-full transition-colors"
                >
                  <X size={10} />
                  Remove
                </button>
              </div>

              {/* File info */}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white/80 truncate">{img.name}</p>
                <p className="text-[9px] text-white/50">{formatBytes(img.size)}</p>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {canAdd && images.length > 0 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-[10px] border-2 border-dashed border-[#3D2E1E] bg-[#2E231A] flex flex-col items-center justify-center gap-1.5 text-[#3D2E1E] hover:border-[#C8924A]/40 hover:text-[#C8924A] hover:bg-[#221A12] transition-all"
            >
              <Upload size={16} />
              <span className="text-[10px] font-medium">Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !canAdd && (
        <div className="flex items-center gap-2 text-[#5A4232]">
          <ImageOff size={14} />
          <span className="text-[12px]">No images uploaded</span>
        </div>
      )}
    </div>
  );
}
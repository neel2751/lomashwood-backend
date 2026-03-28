"use client";

import { useState, useRef, useCallback } from "react";

import Image from "next/image";

import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Film,
  FileText,
  ChevronDown,
  FolderOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "done" | "error";

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  altText: string;
  folder: string;
}

const FOLDERS = ["products", "blog", "brand", "videos", "documents", "inspiration"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "application/pdf",
];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function formatBytes(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fileIcon(type: string) {
  if (type.startsWith("image")) return ImageIcon;
  if (type.startsWith("video")) return Film;
  return FileText;
}

function fileColor(type: string) {
  if (type.startsWith("image")) return "text-[#C8924A]";
  if (type.startsWith("video")) return "text-purple-400";
  return "text-[#6B8A9A]";
}

interface MediaUploaderProps {
  defaultFolder?: string;
  onUploadComplete?: (files: UploadFile[]) => void;
}

export function MediaUploader({
  defaultFolder = "products",
  onUploadComplete,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [globalFolder, setGlobalFolder] = useState(defaultFolder);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (raw: FileList | null) => {
      if (!raw) return;
      const newFiles: UploadFile[] = Array.from(raw).map((file) => {
        const isValid = ALLOWED.includes(file.type) && file.size <= MAX_SIZE;
        const preview = file.type.startsWith("image") ? URL.createObjectURL(file) : undefined;
        return {
          id: uid(),
          file,
          preview,
          progress: 0,
          status: isValid ? "queued" : "error",
          error: !ALLOWED.includes(file.type)
            ? "Unsupported file type"
            : file.size > MAX_SIZE
              ? "File exceeds 10 MB limit"
              : undefined,
          altText: "",
          folder: globalFolder,
        };
      });
      setFiles((prev) => [...prev, ...newFiles]);
      setAllDone(false);
    },
    [globalFolder],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const updateFile = (id: string, patch: Partial<UploadFile>) =>
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const simulateUpload = async () => {
    setUploading(true);
    const queued = files.filter((f) => f.status === "queued");
    for (const file of queued) {
      updateFile(file.id, { status: "uploading" });
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 80));
        updateFile(file.id, { progress: p });
      }
      updateFile(file.id, { status: "done", progress: 100 });
    }
    setUploading(false);
    setAllDone(true);
    onUploadComplete?.(files);
  };

  const queuedCount = files.filter((f) => f.status === "queued").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const selectCls =
    "appearance-none h-8 rounded-[7px] border border-[#D9D5CD] bg-white px-2.5 pr-6 text-[11.5px] text-[#2B2A28] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  const handleDropZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#1A1A18]">Upload Media</h3>
          <p className="mt-0.5 text-[12px] text-[#6B6B68]">
            JPG, PNG, WebP, SVG, MP4, PDF · Max 10 MB each
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global folder */}
          <div className="relative flex items-center gap-1.5">
            <FolderOpen size={12} className="text-[#8B8A86]" />
            <select
              value={globalFolder}
              onChange={(e) => setGlobalFolder(e.target.value)}
              className={selectCls + " w-32"}
            >
              {FOLDERS.map((f) => (
                <option key={f} value={f} className="capitalize">
                  {f}
                </option>
              ))}
            </select>
            <ChevronDown
              size={10}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8A86]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Drop zone */}
        <button
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleDropZoneKeyDown}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed py-10 transition-all",
            dragging
              ? "border-[#C8924A] bg-[#C8924A]/10"
              : "border-[#D9D5CD] hover:border-[#C8924A]/40 hover:bg-[#FCFBF9]",
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-all",
              dragging ? "bg-[#C8924A]/20" : "bg-[#F5F3EF]",
            )}
          >
            <Upload size={22} className={dragging ? "text-[#C8924A]" : "text-[#8B8A86]"} />
          </div>
          <div className="text-center">
            <p className="text-[13.5px] font-semibold text-[#1A1A18]">
              {dragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="mt-0.5 text-[12px] text-[#6B6B68]">
              or <span className="text-[#C8924A] underline">browse to upload</span>
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </button>

        {/* File queue */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* Summary bar */}
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11.5px]">
                <span className="text-[#6B6B68]">{files.length} files</span>
                {doneCount > 0 && <span className="text-emerald-400">{doneCount} uploaded</span>}
                {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
                {queuedCount > 0 && <span className="text-[#C8924A]">{queuedCount} queued</span>}
              </div>
              <button
                onClick={() => setFiles([])}
                className="text-[11px] text-[#8B8A86] transition-colors hover:text-red-400"
              >
                Clear all
              </button>
            </div>

            {files.map((item) => {
              const Icon = fileIcon(item.file.type);
              const color = fileColor(item.file.type);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-[12px] border border-[#E8E6E1] bg-[#FCFBF9] p-3"
                >
                  {/* Thumbnail / icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#D9D5CD] bg-white">
                    {item.preview ? (
                      <Image
                        src={item.preview}
                        alt={item.file.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon size={20} className={color} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-[#1A1A18]">
                          {item.file.name}
                        </p>
                        <p className="text-[11px] text-[#6B6B68]">{formatBytes(item.file.size)}</p>
                      </div>

                      {/* Status indicator */}
                      <div className="flex shrink-0 items-center gap-2">
                        {item.status === "done" && (
                          <CheckCircle size={15} className="text-emerald-400" />
                        )}
                        {item.status === "error" && (
                          <AlertTriangle size={15} className="text-red-400" />
                        )}
                        {item.status === "uploading" && (
                          <span className="text-[11px] font-medium text-[#C8924A]">
                            {item.progress}%
                          </span>
                        )}
                        {item.status !== "done" && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#8B8A86] transition-all hover:bg-red-400/10 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {item.status === "uploading" && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8E6E1]">
                        <div
                          className="h-full rounded-full bg-[#C8924A] transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === "error" && item.error && (
                      <p className="mt-1 text-[11px] text-red-400">{item.error}</p>
                    )}

                    {/* Metadata row (queued only) */}
                    {item.status === "queued" && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={item.altText}
                          onChange={(e) => updateFile(item.id, { altText: e.target.value })}
                          placeholder="Alt text…"
                          className="h-7 flex-1 rounded-[7px] border border-[#D9D5CD] bg-white px-2.5 text-[11.5px] text-[#2B2A28] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/50 focus:outline-none"
                        />
                        <div className="relative">
                          <select
                            value={item.folder}
                            onChange={(e) => updateFile(item.id, { folder: e.target.value })}
                            className={selectCls}
                          >
                            {FOLDERS.map((f) => (
                              <option key={f} value={f} className="capitalize">
                                {f}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={10}
                            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload button */}
        {queuedCount > 0 && (
          <button
            onClick={simulateUpload}
            disabled={uploading}
            className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#C8924A] text-[13px] font-semibold text-white transition-all hover:bg-[#B87E3E] disabled:pointer-events-none disabled:opacity-70"
          >
            <Upload size={15} />
            {uploading ? "Uploading…" : `Upload ${queuedCount} file${queuedCount !== 1 ? "s" : ""}`}
          </button>
        )}

        {allDone && files.length > 0 && errorCount === 0 && (
          <div className="flex items-center gap-2 rounded-[10px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-[12.5px] font-medium text-emerald-400">
            <CheckCircle size={15} /> All files uploaded successfully
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, X, CheckCircle, AlertTriangle,
  Image, Film, FileText, ChevronDown, FolderOpen,
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

const FOLDERS = ["products","blog","brand","videos","documents","inspiration"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED  = ["image/jpeg","image/png","image/webp","image/svg+xml","video/mp4","application/pdf"];

function uid() { return Math.random().toString(36).slice(2, 8); }

function formatBytes(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fileIcon(type: string) {
  if (type.startsWith("image"))  return Image;
  if (type.startsWith("video"))  return Film;
  return FileText;
}

function fileColor(type: string) {
  if (type.startsWith("image"))  return "text-[#C8924A]";
  if (type.startsWith("video"))  return "text-purple-400";
  return "text-[#6B8A9A]";
}

interface MediaUploaderProps {
  defaultFolder?: string;
  onUploadComplete?: (files: UploadFile[]) => void;
}

export function MediaUploader({ defaultFolder = "products", onUploadComplete }: MediaUploaderProps) {
  const [files, setFiles]       = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [globalFolder, setGlobalFolder] = useState(defaultFolder);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw) return;
    const newFiles: UploadFile[] = Array.from(raw).map((file) => {
      const isValid  = ALLOWED.includes(file.type) && file.size <= MAX_SIZE;
      const preview  = file.type.startsWith("image") ? URL.createObjectURL(file) : undefined;
      return {
        id: uid(),
        file,
        preview,
        progress: 0,
        status: isValid ? "queued" : "error",
        error: !ALLOWED.includes(file.type)
          ? "Unsupported file type"
          : file.size > MAX_SIZE ? "File exceeds 10 MB limit" : undefined,
        altText: "",
        folder: globalFolder,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
    setAllDone(false);
  }, [globalFolder]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const updateFile = (id: string, patch: Partial<UploadFile>) =>
    setFiles((p) => p.map((f) => f.id === id ? { ...f, ...patch } : f));

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
  const doneCount   = files.filter((f) => f.status === "done").length;
  const errorCount  = files.filter((f) => f.status === "error").length;

  const selectCls = "appearance-none h-8 px-2.5 pr-6 rounded-[7px] bg-[#1C1611] border border-[#3D2E1E] text-[11.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Upload Media</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">JPG, PNG, WebP, SVG, MP4, PDF · Max 10 MB each</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global folder */}
          <div className="relative flex items-center gap-1.5">
            <FolderOpen size={12} className="text-[#5A4232]" />
            <select value={globalFolder} onChange={(e) => setGlobalFolder(e.target.value)}
              className={selectCls + " w-32"}>
              {FOLDERS.map((f) => (
                <option key={f} value={f} className="bg-[#1C1611] capitalize">{f}</option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-[12px] py-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
            dragging ? "border-[#C8924A] bg-[#C8924A]/10" : "border-[#3D2E1E] hover:border-[#C8924A]/40 hover:bg-[#221A12]"
          )}
        >
          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all",
            dragging ? "bg-[#C8924A]/20" : "bg-[#2E231A]")}>
            <Upload size={22} className={dragging ? "text-[#C8924A]" : "text-[#5A4232]"} />
          </div>
          <div className="text-center">
            <p className="text-[13.5px] font-semibold text-[#E8D5B7]">
              {dragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-[12px] text-[#5A4232] mt-0.5">or <span className="text-[#C8924A] underline">browse to upload</span></p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* File queue */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* Summary bar */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3 text-[11.5px]">
                <span className="text-[#5A4232]">{files.length} files</span>
                {doneCount   > 0 && <span className="text-emerald-400">{doneCount} uploaded</span>}
                {errorCount  > 0 && <span className="text-red-400">{errorCount} failed</span>}
                {queuedCount > 0 && <span className="text-[#C8924A]">{queuedCount} queued</span>}
              </div>
              <button onClick={() => setFiles([])} className="text-[11px] text-[#5A4232] hover:text-red-400 transition-colors">
                Clear all
              </button>
            </div>

            {files.map((item) => {
              const Icon = fileIcon(item.file.type);
              const color = fileColor(item.file.type);
              return (
                <div key={item.id}
                  className="rounded-[12px] bg-[#2E231A] border border-[#3D2E1E] p-3 flex items-start gap-3">
                  {/* Thumbnail / icon */}
                  <div className="w-12 h-12 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] flex items-center justify-center shrink-0 overflow-hidden">
                    {item.preview
                      ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      : <Icon size={20} className={color} />
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-[#C8B99A] truncate">{item.file.name}</p>
                        <p className="text-[11px] text-[#5A4232]">{formatBytes(item.file.size)}</p>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === "done"      && <CheckCircle size={15} className="text-emerald-400" />}
                        {item.status === "error"     && <AlertTriangle size={15} className="text-red-400" />}
                        {item.status === "uploading" && (
                          <span className="text-[11px] text-[#C8924A] font-medium">{item.progress}%</span>
                        )}
                        {item.status !== "done" && (
                          <button onClick={() => removeFile(item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {item.status === "uploading" && (
                      <div className="mt-2 h-1.5 rounded-full bg-[#1C1611] overflow-hidden">
                        <div className="h-full bg-[#C8924A] rounded-full transition-all duration-200"
                          style={{ width: `${item.progress}%` }} />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === "error" && item.error && (
                      <p className="text-[11px] text-red-400 mt-1">{item.error}</p>
                    )}

                    {/* Metadata row (queued only) */}
                    {(item.status === "queued") && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={item.altText}
                          onChange={(e) => updateFile(item.id, { altText: e.target.value })}
                          placeholder="Alt text…"
                          className="flex-1 h-7 px-2.5 rounded-[7px] bg-[#1C1611] border border-[#3D2E1E] text-[11.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
                        />
                        <div className="relative">
                          <select value={item.folder}
                            onChange={(e) => updateFile(item.id, { folder: e.target.value })}
                            className={selectCls}>
                            {FOLDERS.map((f) => (
                              <option key={f} value={f} className="bg-[#1C1611] capitalize">{f}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
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
          <button onClick={simulateUpload} disabled={uploading}
            className="flex items-center justify-center gap-2 h-10 rounded-[10px] bg-[#C8924A] text-white text-[13px] font-semibold hover:bg-[#B87E3E] disabled:opacity-70 disabled:pointer-events-none transition-all">
            <Upload size={15} />
            {uploading ? "Uploading…" : `Upload ${queuedCount} file${queuedCount !== 1 ? "s" : ""}`}
          </button>
        )}

        {allDone && files.length > 0 && errorCount === 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[12.5px] font-medium">
            <CheckCircle size={15} /> All files uploaded successfully
          </div>
        )}
      </div>
    </div>
  );
}
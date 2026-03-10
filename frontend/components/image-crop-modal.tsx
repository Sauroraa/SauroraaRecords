"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type CropAspect = "square" | "banner";

interface ImageCropModalProps {
  open: boolean;
  file: File | null;
  aspect: CropAspect;
  title: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

const VIEWPORTS = {
  square: { width: 320, height: 320, outputWidth: 1200, outputHeight: 1200 },
  banner: { width: 360, height: 144, outputWidth: 1800, outputHeight: 720 }
} as const;

export function ImageCropModal({ open, file, aspect, title, onClose, onConfirm }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const viewport = VIEWPORTS[aspect];

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const baseScale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    return Math.max(viewport.width / naturalSize.width, viewport.height / naturalSize.height);
  }, [naturalSize, viewport.height, viewport.width]);

  const rendered = useMemo(() => {
    const displayScale = baseScale * scale;
    return {
      width: naturalSize.width * displayScale,
      height: naturalSize.height * displayScale,
      scale: displayScale
    };
  }, [baseScale, naturalSize.height, naturalSize.width, scale]);

  const clampOffset = (nextX: number, nextY: number) => {
    const maxX = Math.max(0, (rendered.width - viewport.width) / 2);
    const maxY = Math.max(0, (rendered.height - viewport.height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY))
    };
  };

  useEffect(() => {
    setOffset((current) => clampOffset(current.x, current.y));
  }, [rendered.width, rendered.height]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    setDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      originX: offset.x,
      originY: offset.y
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragging) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.originX + deltaX, dragStartRef.current.originY + deltaY));
  };

  const handleConfirm = async () => {
    if (!file || !naturalSize.width || !naturalSize.height) return;
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = viewport.outputWidth;
      canvas.height = viewport.outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const left = (viewport.width - rendered.width) / 2 + offset.x;
      const top = (viewport.height - rendered.height) / 2 + offset.y;
      const sourceX = Math.max(0, (-left) / rendered.scale);
      const sourceY = Math.max(0, (-top) / rendered.scale);
      const sourceWidth = Math.min(naturalSize.width - sourceX, viewport.width / rendered.scale);
      const sourceHeight = Math.min(naturalSize.height - sourceY, viewport.height / rendered.scale);

      ctx.drawImage(
        imgRef.current as HTMLImageElement,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        viewport.outputWidth,
        viewport.outputHeight
      );

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Crop failed");
      const cropped = new File([blob], file.name.replace(/\.(png|webp|jpeg)$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: Date.now()
      });
      onConfirm(cropped);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="space-y-5">
        <div className="text-sm text-cream/50">
          Glisse l’image pour cadrer, puis ajuste le zoom.
        </div>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-black/40 select-none touch-none"
            style={{ width: viewport.width, height: viewport.height, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={() => setDragging(false)}
          >
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={(e) => {
                  setNaturalSize({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight
                  });
                }}
                draggable={false}
                className="absolute max-w-none"
                style={{
                  width: rendered.width,
                  height: rendered.height,
                  left: (viewport.width - rendered.width) / 2 + offset.x,
                  top: (viewport.height - rendered.height) / 2 + offset.y
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 border border-white/10" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-cream/40">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => void handleConfirm()} disabled={!file || processing} className="gap-2">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Valider le cadrage
          </Button>
        </div>
      </div>
    </Modal>
  );
}

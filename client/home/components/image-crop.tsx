/**
 * ImageCrop
 *
 * Renders a cropped, square region of any image using CSS transforms.
 * The bounding box is padded and squared before cropping.
 *
 * Works with both HTTPS URLs and base64 data URIs — no canvas, no CORS issues.
 */

import { useRef, useState } from "react";

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropProps {
  src: string | null;
  box: CropBox;
  alt?: string;
  className?: string;
}

const PAD = 0.12; // fractional padding added around each crop

export function ImageCrop({ src, box, alt = "", className = "" }: ImageCropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>({ opacity: 0 });

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const C = container.clientWidth;
    if (!C) return;

    const nW = img.naturalWidth;
    const nH = img.naturalHeight;

    // Pad and square the bounding box
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const rawSize = Math.max(box.width, box.height) + PAD * 2;
    const clamped = Math.min(rawSize, 1);
    const sx = Math.max(0, Math.min(1 - clamped, cx - clamped / 2));
    const sy = Math.max(0, Math.min(1 - clamped, cy - clamped / 2));

    // Pixel region in the natural image
    const pxX = sx * nW;
    const pxY = sy * nH;
    const pxW = clamped * nW;
    const pxH = clamped * nH;

    // Scale so the crop region fills the container (uniform scale, fit to container)
    const scale = C / Math.max(pxW, pxH);

    setImgStyle({
      position: "absolute",
      top: 0,
      left: 0,
      width: nW * scale,
      height: nH * scale,
      maxWidth: "none",
      transform: `translate(${-pxX * scale}px, ${-pxY * scale}px)`,
      opacity: 1,
      transition: "opacity 0.15s",
    });
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: "1" }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          onLoad={onLoad}
          style={imgStyle}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
    </div>
  );
}

/**
 * /detect — Box Testing Tool
 *
 * Upload an image → runs DINO + Claude pipeline → shows every detected
 * bounding box with its label. No question generation.
 *
 * Solid border  = Grounding DINO
 * Dashed border = Claude Haiku estimated
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scan, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetectionBox {
  label:   string;
  score:   number;
  box:     { x: number; y: number; width: number; height: number };
  source?: "dino" | "claude";
}

interface ScanResponse {
  candidates:    string[];
  confirmedTags: string[];
  detections:    DetectionBox[];
  model:         string;
  error?:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_PX = 1024;

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = w > h ? MAX_PX / w : MAX_PX / h;
        const dw = scale < 1 ? Math.round(w * scale) : w;
        const dh = scale < 1 ? Math.round(h * scale) : h;
        const canvas = document.createElement("canvas");
        canvas.width = dw; canvas.height = dh;
        canvas.getContext("2d")!.drawImage(img, 0, 0, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const PALETTE = [
  "#3B82F6","#F59E0B","#8B5CF6","#EC4899","#10B981",
  "#EF4444","#F97316","#06B6D4","#84CC16","#6366F1",
  "#14B8A6","#F43F5E","#A855F7","#22C55E","#FB923C",
];

// ── Upload zone ───────────────────────────────────────────────────────────────

function ImageUploadZone({
  imageUri, onFile, onClear, disabled,
}: {
  imageUri: string; onFile: (uri: string) => void; onClear: () => void; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    onFile(await fileToDataUri(file));
  }, [onFile]);

  if (imageUri) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <img src={imageUri} alt="Uploaded" className="w-full max-h-72 object-contain bg-muted/30" draggable={false} />
        {!disabled && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-foreground/70" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 py-12 px-6 ${
        drag ? "border-trust-blue/60 bg-trust-blue/5" : "border-border/50 hover:border-border bg-muted/10 hover:bg-muted/20"
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground text-sm">Drop an image here</p>
        <p className="text-muted-foreground text-xs mt-0.5">or click to browse — JPG, PNG, WEBP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DetectPage() {
  const [imageUri,    setImageUri]    = useState("");
  const [scanning,    setScanning]    = useState(false);
  const [error,       setError]       = useState("");
  const [detections,  setDetections]  = useState<DetectionBox[]>([]);
  const [candidates,  setCandidates]  = useState<string[]>([]);
  const [confirmed,   setConfirmed]   = useState<string[]>([]);
  const [clicked,     setClicked]     = useState<{ label: string; index: number } | null>(null);

  // Stable colour per unique label
  const uniqueLabels = [...new Set(detections.map((d) => d.label))];
  const colorMap     = new Map(uniqueLabels.map((l, i) => [l, PALETTE[i % PALETTE.length]]));

  const handleImage = useCallback(async (uri: string) => {
    setImageUri(uri);
    setDetections([]);
    setCandidates([]);
    setConfirmed([]);
    setError("");
    setScanning(true);

    try {
      const r    = await fetch("/api/images/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image: uri }),
      });
      const data: ScanResponse = await r.json();
      if (!r.ok || data.error) throw new Error(data.error ?? "Scan failed");

      setDetections(data.detections ?? []);
      setCandidates(data.candidates ?? []);
      setConfirmed(data.confirmedTags ?? []);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setScanning(false);
    }
  }, []);

  const handleReset = () => {
    setImageUri("");
    setDetections([]);
    setCandidates([]);
    setConfirmed([]);
    setError("");
    setScanning(false);
    setClicked(null);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-trust-blue/10 flex items-center justify-center">
                <Scan className="w-4 h-4 text-trust-blue" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Box Testing</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Upload an image — DINO + Claude locate every object and draw labelled boxes.
            </p>
          </div>

          {/* Upload zone */}
          <ImageUploadZone
            imageUri={imageUri}
            onFile={handleImage}
            onClear={handleReset}
            disabled={scanning}
          />

          {/* Scanning state */}
          <AnimatePresence>
            {scanning && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-trust-blue/20 bg-trust-blue/5"
              >
                <Loader2 className="w-4 h-4 text-trust-blue animate-spin flex-shrink-0" />
                <p className="text-sm text-trust-blue font-medium">
                  Running DINO + Claude Vision pipeline…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={handleReset} className="mt-1 text-xs text-destructive/70 hover:text-destructive underline">
                    Try a different image
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {detections.length > 0 && !scanning && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Stats bar */}
                <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-full bg-trust-blue/10 text-trust-blue border border-trust-blue/20">
                    {detections.length} boxes
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                    ⚡ Grounding DINO
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
                    {candidates.length} candidates from Claude vision
                  </span>
                </div>

                {/* Image with all boxes overlaid */}
                <div className="relative w-full rounded-2xl overflow-hidden border border-border/40 bg-muted/20 select-none">
                  <img src={imageUri} alt="Scene" className="w-full block" draggable={false} />

                  {(() => {
                    const countMap = new Map<string, number>();
                    // Render largest boxes first so smaller ones sit on top and get clicks
                    const sorted = [...detections].sort(
                      (a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height)
                    );
                    return sorted.map((det, i) => {
                      const { x, y, width, height } = det.box;
                      const color     = colorMap.get(det.label) ?? "#3B82F6";
                      const total     = detections.filter((d) => d.label === det.label).length;
                      const inst      = (countMap.get(det.label) ?? 0) + 1;
                      countMap.set(det.label, inst);
                      const chip      = total > 1 ? `${det.label} ${inst}` : det.label;
                      const pct       = Math.round(det.score * 100);
                      const isClicked = clicked?.index === i;

                      return (
                        <button
                          key={i}
                          onClick={() => setClicked(isClicked ? null : { label: chip, index: i })}
                          className="absolute rounded-md cursor-pointer transition-all duration-150"
                          style={{
                            left:            `${x * 100}%`,
                            top:             `${y * 100}%`,
                            width:           `${width * 100}%`,
                            height:          `${height * 100}%`,
                            border:          `${isClicked ? "3px" : "2px"} solid ${color}`,
                            backgroundColor: isClicked ? `${color}35` : `${color}18`,
                            outline:         isClicked ? `2px solid ${color}` : "none",
                            outlineOffset:   "2px",
                          }}
                        >
                          <span
                            className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow"
                            style={{ backgroundColor: color }}
                          >
                            {chip} {pct}%
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Clicked label banner */}
                <AnimatePresence mode="wait">
                  {clicked ? (
                    <motion.div
                      key={clicked.label}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-growth-green/30 bg-growth-green/10"
                    >
                      <span className="text-lg">👆</span>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">You tapped</p>
                        <p className="text-sm font-bold text-foreground">{clicked.label}</p>
                      </div>
                      <button
                        onClick={() => setClicked(null)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] text-muted-foreground/60 px-1 text-center"
                    >
                      Tap any box to see its label
                    </motion.p>
                  )}
                </AnimatePresence>


                {/* Candidate pills */}
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Claude candidates
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidates.map((c) => {
                      const isConfirmed = confirmed.includes(c);
                      return (
                        <span
                          key={c}
                          className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                            isConfirmed
                              ? "bg-growth-green/10 border-growth-green/30 text-growth-green"
                              : "bg-muted/40 border-border/40 text-muted-foreground line-through"
                          }`}
                        >
                          {c}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    <span className="text-growth-green font-semibold">Green</span> = detected ·{" "}
                    <span className="line-through">Strikethrough</span> = no box found
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}

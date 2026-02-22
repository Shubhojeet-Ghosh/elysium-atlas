"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Color utilities ───────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

/**
 * HSV → 6-digit hex  (all channels 0-255 via the compact formula)
 * h: 0-360  s: 0-1  v: 0-1
 */
function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

/** Normalise any 3- or 6-digit hex string → lowercase 6-digit with `#` */
function normalizeHex(hex: string): string {
  let h = hex.replace(/^#/, "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return "#000000";
  return `#${h.toLowerCase()}`;
}

/** 6-digit hex → { h: 0-360, s: 0-1, v: 0-1 } */
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const full = normalizeHex(hex);
  const r = parseInt(full.slice(1, 3), 16) / 255;
  const g = parseInt(full.slice(3, 5), 16) / 255;
  const b = parseInt(full.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  return {
    h: Math.round(hue),
    s: max === 0 ? 0 : d / max,
    v: max,
  };
}

// ─── Component ─────────────────────────────────────────────────────

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPickerRow({
  label,
  value,
  onChange,
}: ColorPickerRowProps) {
  const normalized = normalizeHex(value);

  const [hsv, setHsv] = useState(() => hexToHsv(normalized));
  const [hexInput, setHexInput] = useState(normalized);

  // Sync inbound value changes (e.g. Redux hydration)
  const prevNormalized = useRef(normalized);
  useEffect(() => {
    if (normalized !== prevNormalized.current) {
      prevNormalized.current = normalized;
      setHsv(hexToHsv(normalized));
      setHexInput(normalized);
    }
  }, [normalized]);

  // Drag refs
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSV = useRef(false);
  const draggingHue = useRef(false);

  // Keep HSV ref current so pointer-move callbacks don't go stale
  const hsvRef = useRef(hsv);
  useEffect(() => {
    hsvRef.current = hsv;
  });

  const commit = useCallback(
    (h: number, s: number, v: number) => {
      const hex = hsvToHex(h, s, v);
      setHsv({ h, s, v });
      setHexInput(hex);
      onChange(hex);
    },
    [onChange],
  );

  // ── Saturation / Value square ──
  const readSV = (e: React.PointerEvent) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    commit(hsvRef.current.h, s, v);
  };

  const onSVDown = (e: React.PointerEvent) => {
    draggingSV.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    readSV(e);
  };
  const onSVMove = (e: React.PointerEvent) => {
    if (draggingSV.current) readSV(e);
  };
  const onSVUp = () => {
    draggingSV.current = false;
  };

  // ── Hue slider ──
  const readHue = (e: React.PointerEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const h = clamp((e.clientX - rect.left) / rect.width, 0, 1) * 360;
    commit(h, hsvRef.current.s, hsvRef.current.v);
  };

  const onHueDown = (e: React.PointerEvent) => {
    draggingHue.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    readHue(e);
  };
  const onHueMove = (e: React.PointerEvent) => {
    if (draggingHue.current) readHue(e);
  };
  const onHueUp = () => {
    draggingHue.current = false;
  };

  // ── Hex text input ──
  const onHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    const isShort = /^#[0-9a-fA-F]{3}$/.test(withHash);
    const isFull = /^#[0-9a-fA-F]{6}$/.test(withHash);
    if (isShort || isFull) {
      const full = normalizeHex(withHash);
      const newHsv = hexToHsv(full);
      setHsv(newHsv);
      onChange(full);
    }
  };

  const hueOnlyColor = hsvToHex(hsv.h, 1, 1);
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-[13px] font-medium text-muted-foreground shrink-0 w-[120px]">
        {label}
      </p>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 flex items-center gap-3 border border-border rounded-[10px] px-3 py-2.5 bg-background hover:bg-muted/40 transition-colors cursor-pointer text-left"
          >
            {/* Color swatch circle */}
            <div
              className="w-5 h-5 rounded-full border border-border shadow-sm shrink-0"
              style={{ backgroundColor: currentHex }}
            />
            {/* Hex value */}
            <span className="text-[13px] font-mono font-medium text-foreground">
              {currentHex}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="p-3.5 w-[260px] rounded-2xl border border-border bg-background shadow-xl"
        >
          {/* ── Saturation / Value gradient ── */}
          <div
            ref={svRef}
            className="w-full h-[180px] rounded-[10px] cursor-crosshair relative select-none mb-3 overflow-hidden"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueOnlyColor})`,
            }}
            onPointerDown={onSVDown}
            onPointerMove={onSVMove}
            onPointerUp={onSVUp}
          >
            {/* Cursor dot */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: currentHex,
              }}
            />
          </div>

          {/* ── Hue rainbow slider ── */}
          <div
            ref={hueRef}
            className="w-full h-3 rounded-full cursor-pointer relative select-none mb-3.5"
            style={{
              background:
                "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
            onPointerDown={onHueDown}
            onPointerMove={onHueMove}
            onPointerUp={onHueUp}
          >
            {/* Hue cursor */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none top-1/2"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: hueOnlyColor,
              }}
            />
          </div>

          {/* ── Hex input row ── */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full border border-border shrink-0 shadow-sm"
              style={{ backgroundColor: currentHex }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={onHexChange}
              maxLength={7}
              spellCheck={false}
              className="flex-1 text-[12px] font-mono font-medium border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:border-serene-purple transition-colors"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

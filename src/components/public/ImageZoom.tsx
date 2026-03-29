"use client";
import { useState, useRef, useCallback, type ReactNode } from "react";
import { UI_CONFIG } from "@/config/ui.config";

interface ImageZoomProps {
  children: ReactNode;
  active?: boolean;
}

export default function ImageZoom({ children, active = true }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const initialDistRef = useRef(0);
  const initialScaleRef = useRef(1);

  const { maxScale, minScale, doubleTapDelay } = UI_CONFIG.imageZoom;

  const getDistance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getOriginFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 50, y: 50 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    },
    []
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!active) return;

      if (e.touches.length === 2) {
        initialDistRef.current = getDistance(e.touches[0], e.touches[1]);
        initialScaleRef.current = scale;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        setOrigin(getOriginFromEvent(midX, midY));
        return;
      }

      const now = Date.now();
      if (now - lastTapRef.current < doubleTapDelay) {
        if (scale > minScale) {
          setScale(minScale);
        } else {
          setOrigin(
            getOriginFromEvent(e.touches[0].clientX, e.touches[0].clientY)
          );
          setScale(maxScale / 1.5);
        }
      }
      lastTapRef.current = now;
    },
    [active, scale, minScale, maxScale, doubleTapDelay, getOriginFromEvent]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!active || e.touches.length !== 2) return;
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, initialScaleRef.current * (dist / initialDistRef.current))
      );
      setScale(newScale);
    },
    [active, maxScale, minScale]
  );

  const handleTouchEnd = useCallback(() => {
    if (scale < 1.1) setScale(minScale);
  }, [scale, minScale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      setOrigin(getOriginFromEvent(e.clientX, e.clientY));
    },
    [active, getOriginFromEvent]
  );

  return (
    <div
      ref={containerRef}
      className="overflow-hidden touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => active && setScale(1.5)}
      onMouseLeave={() => { setScale(minScale); setOrigin({ x: 50, y: 50 }); }}
      onMouseMove={handleMouseMove}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: scale === minScale ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

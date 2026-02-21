"use client";

import { useRef, useState, useCallback, useMemo } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  swiping: boolean;
  deltaX: number;
  direction: "left" | "right" | null;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true,
}: SwipeGestureOptions) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    swiping: false,
    deltaX: 0,
    direction: null,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"horizontal" | "vertical" | null>(null);
  const DEAD_ZONE = 10;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      locked.current = null;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      if (!locked.current) {
        if (Math.abs(deltaX) < DEAD_ZONE && Math.abs(deltaY) < DEAD_ZONE) return;
        locked.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (locked.current === "vertical") return;

      setSwipeState({
        swiping: true,
        deltaX,
        direction: deltaX > 0 ? "right" : "left",
      });
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swipeState.swiping) {
      setSwipeState({ swiping: false, deltaX: 0, direction: null });
      return;
    }

    if (swipeState.deltaX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (swipeState.deltaX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setSwipeState({ swiping: false, deltaX: 0, direction: null });
  }, [enabled, swipeState, threshold, onSwipeLeft, onSwipeRight]);

  const swipeHandlers = useMemo(
    () =>
      enabled
        ? {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
          }
        : {},
    [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return { swipeHandlers, swipeState };
}

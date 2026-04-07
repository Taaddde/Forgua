/**
 * StrokeAnimator — SVG-based stroke order animation.
 * Receives an array of SVG path strings and animates them sequentially.
 * 100% generic: works for kanji, hanzi, hangul, Arabic, etc.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface StrokeAnimatorProps {
  strokes: string[];
  width?: number;
  height?: number;
  strokeColor?: string;
  animationSpeed?: number;
  className?: string;
}

export function StrokeAnimator({
  strokes,
  width = 200,
  height = 200,
  strokeColor = '#e2e8f0',
  animationSpeed = 500,
  className = '',
}: StrokeAnimatorProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalStrokes = strokes.length;

  const stopAnimation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    stopAnimation();
    setIsPlaying(true);
    setVisibleCount(0);
    setAnimatingIndex(0);
  }, [stopAnimation]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || animatingIndex < 0) return;

    timerRef.current = setTimeout(() => {
      if (animatingIndex >= totalStrokes) {
        setIsPlaying(false);
        setAnimatingIndex(-1);
        setVisibleCount(totalStrokes);
      } else {
        setVisibleCount(animatingIndex + 1);
        setAnimatingIndex((prev) => prev + 1);
      }
    }, animatingIndex >= totalStrokes ? 0 : animationSpeed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, animatingIndex, totalStrokes, animationSpeed]);

  const reset = useCallback(() => {
    stopAnimation();
    setVisibleCount(0);
    setAnimatingIndex(-1);
  }, [stopAnimation]);

  const stepForward = useCallback(() => {
    stopAnimation();
    setVisibleCount((prev) => Math.min(prev + 1, totalStrokes));
  }, [stopAnimation, totalStrokes]);

  const stepBack = useCallback(() => {
    stopAnimation();
    setVisibleCount((prev) => Math.max(prev - 1, 0));
  }, [stopAnimation]);

  if (totalStrokes === 0) return null;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="mx-auto"
      >
        {/* Ghost strokes */}
        {strokes.map((d, i) => (
          <path
            key={`ghost-${i}`}
            d={d}
            fill="none"
            stroke="#334155"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Visible strokes */}
        {strokes.slice(0, visibleCount).map((d, i) => (
          <path
            key={`visible-${i}`}
            d={d}
            fill="none"
            stroke={i === visibleCount - 1 && isPlaying ? '#6366f1' : strokeColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={stepBack}
          disabled={visibleCount === 0}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          title={t('common.previous')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={isPlaying ? stopAnimation : play}
          className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          title={isPlaying ? t('audio.stop') : t('audio.play')}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={reset}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
          title={t('audio.replay')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={stepForward}
          disabled={visibleCount >= totalStrokes}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          title={t('common.next')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-xs text-slate-500 ml-2">
          {visibleCount}/{totalStrokes}
        </span>
      </div>
    </div>
  );
}

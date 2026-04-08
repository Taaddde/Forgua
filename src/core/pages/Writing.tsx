/**
 * Writing page — practice drawing characters from any writing system.
 * Uses an HTML5 canvas for freehand drawing with self-grading.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser, Eye } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { createInitialSRSState } from '../engine/srs';
import { calculateNextReview } from '../engine/srs';
import { ReviewGrade } from '../types/models';
import { Button } from '../components/common/Button';
import type { SRSState } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

export function Writing() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  // Get drawable writing systems from the active pack
  const drawableSystems = (activePack?.writingSystems ?? []).filter((ws) => ws.hasDrawing);

  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Derive effective systemId: if selectedSystemId is not in current pack's systems, fall back to first
  const systemId = drawableSystems.find((ws) => ws.id === selectedSystemId)
    ? selectedSystemId
    : (drawableSystems[0]?.id ?? '');
  const setSystemId = setSelectedSystemId;

  // Load character cards matching selected writing system
  const cards = useLiveQuery(async () => {
    if (!packId || !systemId) return [];
    const allChars = await db.cards.where('[packId+category]').equals([packId, 'characters']).toArray();
    return allChars.filter((c) => c.tags.includes(systemId));
  }, [packId, systemId]);

  const currentCard = cards?.[currentIndex];

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Draw grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 0);
    ctx.lineTo(rect.width / 2, rect.height);
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
  }, []);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctxRef.current = ctx;
    clearCanvas();
  }, [currentIndex, systemId, clearCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const handleGrade = async (grade: ReviewGradeValue) => {
    if (!currentCard?.id || !packId) return;

    let state: SRSState | undefined = await db.srsState.get(currentCard.id);
    if (!state) {
      state = createInitialSRSState(currentCard.id, packId);
    }
    const newState = calculateNextReview(state, grade);
    await db.srsState.put(newState);

    // Move to next
    setShowAnswer(false);
    clearCanvas();
    if (cards && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  if (drawableSystems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('writing.noSystems')}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('writing.title')}</h1>

      {/* System tabs */}
      <div className="flex gap-2 mb-6">
        {drawableSystems.map((ws) => (
          <button
            key={ws.id}
            onClick={() => { setSystemId(ws.id); setCurrentIndex(0); setShowAnswer(false); clearCanvas(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              systemId === ws.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {ws.name}
          </button>
        ))}
      </div>

      {(!cards || cards.length === 0) ? (
        <p className="text-slate-500 text-center py-12">{t('learn.noContent')}</p>
      ) : (
        <>
          {/* Prompt */}
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">
              {currentIndex + 1} / {cards.length}
            </p>
            <p className="text-lg text-slate-200">
              {currentCard?.reading} — {currentCard?.back}
            </p>
          </div>

          {/* Canvas + answer */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4 aspect-square">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {showAnswer && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 pointer-events-none">
                <span className="text-8xl text-slate-100">{currentCard?.front}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <Button variant="secondary" size="sm" onClick={() => { clearCanvas(); setShowAnswer(false); }}>
              <Eraser className="w-4 h-4" />
              {t('writing.clear')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAnswer(!showAnswer)}>
              <Eye className="w-4 h-4" />
              {t('writing.showAnswer')}
            </Button>
          </div>

          {/* Grade buttons */}
          <div>
            <p className="text-xs text-slate-500 mb-2">{t('writing.howDidYouDo')}</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleGrade(ReviewGrade.Again)} className="py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                {t('study.buttons.again')}
              </button>
              <button onClick={() => handleGrade(ReviewGrade.Good)} className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                {t('study.buttons.good')}
              </button>
              <button onClick={() => handleGrade(ReviewGrade.Easy)} className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                {t('study.buttons.easy')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Writing;

/**
 * ProsodyDiagram — generic visualization of prosodic patterns.
 * Supports pitch-accent (Japanese), tones (Chinese), and stress (European languages).
 * The `type` prop determines rendering style; data comes from the pack.
 */

interface ProsodyDiagramProps {
  type: 'pitch-accent' | 'tone' | 'stress';
  pattern: number[];
  morae: string[];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SizeConfig {
  w: number;
  h: number;
  fontSize: number;
  dotR: number;
  textY: number;
}

const sizeConfig: Record<string, SizeConfig> = {
  sm: { w: 120, h: 40, fontSize: 10, dotR: 3, textY: 36 },
  md: { w: 200, h: 60, fontSize: 12, dotR: 4, textY: 54 },
  lg: { w: 280, h: 80, fontSize: 14, dotR: 5, textY: 72 },
};

export function ProsodyDiagram({
  type,
  pattern,
  morae,
  label,
  size = 'md',
  className = '',
}: ProsodyDiagramProps) {
  const cfg = sizeConfig[size];

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg viewBox={`0 0 ${cfg.w} ${cfg.h}`} width={cfg.w} height={cfg.h}>
        {type === 'pitch-accent' && (
          <PitchAccentPath pattern={pattern} morae={morae} cfg={cfg} />
        )}
        {type === 'tone' && (
          <ToneContour pattern={pattern} morae={morae} cfg={cfg} />
        )}
        {type === 'stress' && (
          <StressMarkers pattern={pattern} morae={morae} cfg={cfg} />
        )}
      </svg>
      {label && (
        <span className="text-[10px] text-slate-500 mt-0.5">{label}</span>
      )}
    </div>
  );
}

// --- Pitch Accent (Japanese) ---

function PitchAccentPath({
  pattern,
  morae,
  cfg,
}: {
  pattern: number[];
  morae: string[];
  cfg: SizeConfig;
}) {
  const count = Math.max(morae.length, pattern.length);
  if (count === 0) return null;

  const padding = 15;
  const stepX = count > 1 ? (cfg.w - padding * 2) / (count - 1) : 0;
  const highY = 8;
  const lowY = cfg.h - 20;

  const points = pattern.slice(0, count).map((val, i) => ({
    x: padding + i * stepX,
    y: val === 1 ? highY : lowY,
  }));

  // Line connecting dots
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Find drop point (where pitch goes from high to low)
  let dropIndex = -1;
  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i - 1] === 1 && pattern[i] === 0) {
      dropIndex = i - 1;
      break;
    }
  }

  return (
    <>
      <path d={pathD} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={cfg.dotR}
          fill={i === dropIndex ? '#ef4444' : '#e2e8f0'}
        />
      ))}
      {morae.slice(0, count).map((m, i) => (
        <text
          key={i}
          x={padding + i * stepX}
          y={cfg.textY}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={cfg.fontSize}
        >
          {m}
        </text>
      ))}
    </>
  );
}

// --- Tone Contour (Chinese/Vietnamese) ---

const toneContours: Record<number, [number, number, number, number]> = {
  1: [5, 5, 5, 5],    // High flat
  2: [3, 3, 4, 5],    // Rising
  3: [2, 1, 2, 4],    // Dipping
  4: [5, 3, 2, 1],    // Falling
  5: [3, 3, 3, 3],    // Neutral (light tone)
};

function ToneContour({
  pattern,
  morae,
  cfg,
}: {
  pattern: number[];
  morae: string[];
  cfg: SizeConfig;
}) {
  const toneNumber = pattern[0] ?? 1;
  const contour = toneContours[toneNumber] ?? toneContours[1];

  const padding = 20;
  const usableW = cfg.w - padding * 2;
  const usableH = cfg.h - 24;

  const points = contour.map((level, i) => ({
    x: padding + (i / (contour.length - 1)) * usableW,
    y: 4 + usableH - (level / 5) * usableH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <>
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />
      {morae.length > 0 && (
        <text
          x={cfg.w / 2}
          y={cfg.textY}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={cfg.fontSize}
        >
          {morae.join('')}
        </text>
      )}
    </>
  );
}

// --- Stress Markers (European) ---

function StressMarkers({
  pattern,
  morae,
  cfg,
}: {
  pattern: number[];
  morae: string[];
  cfg: SizeConfig;
}) {
  const count = morae.length;
  if (count === 0) return null;

  const padding = 10;
  const stepX = count > 1 ? (cfg.w - padding * 2) / (count - 1) : (cfg.w - padding * 2) / 2;

  return (
    <>
      {morae.map((m, i) => {
        const isStressed = pattern[i] === 1;
        const x = count === 1 ? cfg.w / 2 : padding + i * stepX;
        return (
          <g key={i}>
            <text
              x={x}
              y={cfg.h - 8}
              textAnchor="middle"
              fill={isStressed ? '#f1f5f9' : '#64748b'}
              fontSize={isStressed ? cfg.fontSize + 3 : cfg.fontSize}
              fontWeight={isStressed ? 'bold' : 'normal'}
            >
              {m}
            </text>
            {isStressed && (
              <text
                x={x}
                y={cfg.h - 24}
                textAnchor="middle"
                fill="#6366f1"
                fontSize={cfg.fontSize + 2}
              >
                ´
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

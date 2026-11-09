import React, { useState, useId } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Info,
  Ruler,
  Cpu
} from 'lucide-react';
import {
  calculateVisualFit,
  formatModelConfidence,
  GarmentMeasurementType,
  ProductSizeChart
} from '@/utils/visualFitMath';

export interface VisualFitMannequinProps {
  gender?: string;
  bodyType?: string;
  recommendedSize: string;
  alternativeSize?: string;
  confidence?: number; // ML prediction probability (0-100)
  clothingName?: string;
  clothingWidth?: number; // In centimeters
  clothingMeasurementType?: GarmentMeasurementType; // Explicit convention
  clothingLength?: number;
  sizeChart?: ProductSizeChart;
  className?: string;
  userChest?: number; // Full circumference in cm
  userWaist?: number; // Full circumference in cm
}

const VisualFitMannequin: React.FC<VisualFitMannequinProps> = ({
  gender = 'female',
  bodyType = 'medium',
  recommendedSize = 'M',
  alternativeSize,
  confidence,
  clothingName = 'Артикул FitVision',
  clothingWidth,
  clothingMeasurementType,
  clothingLength,
  sizeChart,
  className = '',
  userChest,
  userWaist
}) => {
  const [activeView, setActiveView] = useState<'recommended' | 'alternative'>('recommended');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const componentId = useId();

  const isAlt = activeView === 'alternative';
  const activeSize = isAlt && alternativeSize ? alternativeSize : recommendedSize;

  // Run transparent, honest 2D geometric calculation
  const fit = calculateVisualFit({
    userChest,
    userWaist,
    clothingWidth,
    clothingMeasurementType,
    clothingLength,
    gender,
    bodyType,
    activeSize,
    recommendedSize,
    isAlternative: isAlt,
    sizeChart
  });

  const isMale = gender === 'male';
  const cx = fit.canvasCenterPx;

  return (
    <div className={`bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs select-none transition-all ${className}`}>
      {/* 1. Хедър с честно етикетиране и разделение на ML модела */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              2D Геометрична проекция
            </span>

            {/* Статус на данните */}
            {fit.isSchematic ? (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono font-medium px-2 py-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Схематичен изглед
              </Badge>
            ) : (
              <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-mono font-medium px-2 py-0.5">
                ● Приблизителен визуален модел
              </Badge>
            )}

            {/* ML Увереност — ясно отделена от 2D чертежа */}
            {(() => {
              const formattedConfidence = formatModelConfidence(confidence);
              if (formattedConfidence === null) return null;
              return (
                <Badge variant="outline" className="border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-500" />
                  ML класификатор вероятност: {formattedConfidence}%
                </Badge>
              );
            })()}
          </div>

          <h3 className="font-bold text-base text-zinc-950 mt-1 line-clamp-1">
            {clothingName}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isMale ? 'Мъжки' : 'Дамски'} ориентировъчен силует • Не представлява физична 3D симулация на текстил
          </p>
        </div>

        {/* 2. Достъпен превключвател за препоръчан и алтернативен размер */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200/80 self-stretch sm:self-auto justify-center" role="group" aria-label="Избор на визуализиран размер">
          <button
            type="button"
            onClick={() => setActiveView('recommended')}
            aria-pressed={!isAlt}
            aria-label={`Препоръчан размер ${recommendedSize}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              !isAlt
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
            }`}
          >
            {!isAlt && <Check className="w-3 h-3 text-emerald-400" />}
            {recommendedSize} <span className="font-sans font-normal opacity-75">(Препоръчан)</span>
          </button>

          {alternativeSize && (
            <button
              type="button"
              onClick={() => setActiveView('alternative')}
              aria-pressed={isAlt}
              aria-label={`Алтернативен размер ${alternativeSize}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isAlt
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              {isAlt && <Check className="w-3 h-3 text-white" />}
              {alternativeSize} <span className="font-sans font-normal opacity-85">(Алтернативен)</span>
            </button>
          )}
        </div>
      </div>

      {/* Информационен банер при схематичен режим или липсващи данни */}
      {fit.isSchematic && (
        <div className="my-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-700 font-sans">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-zinc-900 block">Ограничение на наличните данни</span>
            <span className="text-zinc-600 text-[11px] leading-relaxed block">
              {fit.schematicReason} Липсващите параметри не се заместват с фиктивни данни; показва се неутрален ориентировъчен контур.
            </span>
          </div>
        </div>
      )}

      {/* 3. Централно SVG платно за 2D апроксимация */}
      <div className="relative w-full h-[360px] bg-gradient-to-b from-zinc-50 via-white to-zinc-50 rounded-2xl border border-zinc-200/90 my-4 flex items-center justify-center overflow-hidden">
        {/* Бутон за преглед на силует / прозрачност */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWireframe(!showWireframe)}
            aria-label="Превключване на запълването на плата"
            className="bg-white/95 hover:bg-white text-zinc-700 text-[10px] font-mono border border-zinc-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs backdrop-blur-xs transition-colors"
          >
            <Layers className="w-3 h-3 text-indigo-600" />
            {showWireframe ? 'Плътен силует' : 'Прозрачен слой'}
          </button>
        </div>

        {/* 2D Векторно SVG платно (320 × 380) */}
        <svg
          viewBox="0 0 320 380"
          className="h-full w-auto select-none transition-all duration-300 drop-shadow-xs"
          role="img"
          aria-label={`2D графична апроксимация на размер ${activeSize}`}
        >
          <defs>
            {/* Градиент за анатомичния силует */}
            <linearGradient id={`${componentId}-skinGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5ECE1" />
              <stop offset="50%" stopColor="#EADBCC" />
              <stop offset="100%" stopColor="#D8C2A7" />
            </linearGradient>

            {/* Градиент за облеклото */}
            <linearGradient id={`${componentId}-garmentGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(79, 70, 229, 0.20)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.10)" />
            </linearGradient>

            {/* Координатна мрежа */}
            <pattern id={`${componentId}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EDEDF2" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Фонова мрежа */}
          <rect width="320" height="380" fill={`url(#${componentId}-grid)`} opacity="0.75" />

          {/* 1. Глава & Врат на манекена */}
          <ellipse cx={cx} cy="46" rx="20" ry="26" fill={`url(#${componentId}-skinGrad)`} stroke="#CBB499" strokeWidth="1.2" />
          <path d="M 152 70 Q 160 82 168 70 Z" fill={`url(#${componentId}-skinGrad)`} stroke="#CBB499" strokeWidth="1" />

          {/* 2. Анатомичен торс на манекена */}
          <path
            d={`
              M ${cx - fit.bodyShoulderHalfPx} 92
              Q ${cx} 84 ${cx + fit.bodyShoulderHalfPx} 92
              Q ${cx + fit.bodyChestHalfPx} 132 ${cx + fit.bodyWaistHalfPx} 180
              Q ${cx + fit.bodyHipHalfPx} 226 ${cx} 250
              Q ${cx - fit.bodyHipHalfPx} 226 ${cx - fit.bodyWaistHalfPx} 180
              Q ${cx - fit.bodyChestHalfPx} 132 ${cx - fit.bodyShoulderHalfPx} 92
              Z
            `}
            fill={`url(#${componentId}-skinGrad)`}
            stroke="#CBB499"
            strokeWidth="1.5"
            strokeDasharray={fit.hasBodyMeasurements ? 'none' : '4 3'}
            opacity={fit.hasBodyMeasurements ? 1 : 0.65}
          />

          {/* Таз и бедра — синтактично коригиран SVG път */}
          <path
            d={`
              M ${cx - fit.bodyHipHalfPx + 6} 235
              L ${cx - fit.bodyHipHalfPx + 10} 340
              Q 150 345 156 265
              L ${cx} 250
              L 164 265
              Q 170 345 ${cx + fit.bodyHipHalfPx - 10} 340
              L ${cx + fit.bodyHipHalfPx - 6} 235
              Z
            `}
            fill="#EADBCC"
            stroke="#CBB499"
            strokeWidth="1"
            opacity={fit.hasBodyMeasurements ? 0.75 : 0.45}
          />

          {/* 3. Контур на облеклото */}
          <path
            d={`
              M ${cx - fit.garmentShoulderHalfPx} 88
              L ${cx - fit.garmentShoulderHalfPx - 24} 136
              L ${cx - fit.garmentShoulderHalfPx + 4} 144
              L ${cx - fit.garmentChestHalfPx} 142
              L ${cx - fit.garmentWaistHalfPx} ${214 + fit.garmentLengthOffsetPx}
              Q ${cx} ${222 + fit.garmentLengthOffsetPx} ${cx + fit.garmentWaistHalfPx} ${214 + fit.garmentLengthOffsetPx}
              L ${cx + fit.garmentChestHalfPx} 142
              L ${cx + fit.garmentShoulderHalfPx - 4} 144
              L ${cx + fit.garmentShoulderHalfPx + 24} 136
              L ${cx + fit.garmentShoulderHalfPx} 88
              Q ${cx} 98 ${cx - fit.garmentShoulderHalfPx} 88
              Z
            `}
            fill={showWireframe ? 'none' : `url(#${componentId}-garmentGrad)`}
            stroke={fit.isSchematic ? '#64748B' : '#4F46E5'}
            strokeWidth={isAlt ? '2.5' : '2'}
            strokeDasharray={fit.isSchematic ? '5 3' : isAlt ? '6 3' : 'none'}
            className="transition-all duration-300 ease-out"
          />

          {/* 4. Измервателни маркери — чертаят се САМО при реално налични данни */}
          {fit.hasBodyMeasurements && fit.userChestCm !== undefined && (
            <>
              {/* Линия на гръдната обиколка */}
              <line
                x1={cx - fit.bodyChestHalfPx - 10}
                y1="134"
                x2={cx + fit.bodyChestHalfPx + 10}
                y2="134"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle cx={cx - fit.bodyChestHalfPx - 10} cy="134" r="2" fill="#64748B" />
              <circle cx={cx + fit.bodyChestHalfPx + 10} cy="134" r="2" fill="#64748B" />
              <text x={cx} y="130" textAnchor="middle" fontSize="9" fill="#0F172A" fontWeight="bold" fontFamily="monospace">
                Гръдна мярка (тяло): {fit.userChestCm} см
              </text>
            </>
          )}

          {fit.hasBodyMeasurements && fit.userWaistCm !== undefined && (
            <>
              {/* Линия на талията */}
              <line
                x1={cx - fit.bodyWaistHalfPx - 8}
                y1="180"
                x2={cx + fit.bodyWaistHalfPx + 8}
                y2="180"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle cx={cx - fit.bodyWaistHalfPx - 8} cy="180" r="2" fill="#64748B" />
              <circle cx={cx + fit.bodyWaistHalfPx + 8} cy="180" r="2" fill="#64748B" />
              <text x={cx} y="176" textAnchor="middle" fontSize="9" fill="#0F172A" fontWeight="bold" fontFamily="monospace">
                Талия (тяло): {fit.userWaistCm} см
              </text>
            </>
          )}

          {/* Ако липсват мерки на тялото, показва се честен надпис в платното */}
          {!fit.hasBodyMeasurements && (
            <text x={cx} y="150" textAnchor="middle" fontSize="9.5" fill="#64748B" fontFamily="sans-serif">
              [Липсват въведени телесни мерки]
            </text>
          )}
        </svg>

        {/* Долна описателна лента за размерите */}
        <div className="absolute bottom-2.5 left-3 right-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-[11px] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs font-mono">
          <div className="text-zinc-700 font-sans text-xs">
            {fit.deltaDescription || (
              fit.isSchematic
                ? 'Схематично изображение без изчислена разлика в мерките.'
                : 'Мерките съвпадат в рамките на нормалния допуск.'
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-500 text-[10px] self-end sm:self-auto font-mono">
            {fit.garmentFlatWidthCm !== undefined && (
              <span>Ширина: {fit.garmentFlatWidthCm} см</span>
            )}
            {fit.garmentCircumferenceCm !== undefined && (
              <>
                <span>•</span>
                <span>Обиколка: {fit.garmentCircumferenceCm} см</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Забележка за техническата същност на визуализацията */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
        <span className="flex items-center gap-1">
          <Ruler className="w-3.5 h-3.5 text-indigo-600" />
          Разликите се изчисляват само при съвместими мерни конвенции
        </span>
        <span className="text-zinc-400">
          FitVision™ Approximate 2D Projection
        </span>
      </div>
    </div>
  );
};

export default VisualFitMannequin;

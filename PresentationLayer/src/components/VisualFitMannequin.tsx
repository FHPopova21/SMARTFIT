import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, User, Eye } from 'lucide-react';

interface VisualFitMannequinProps {
  gender?: string;
  bodyType?: string;
  recommendedSize: string;
  alternativeSize?: string;
  confidence: number;
  clothingName?: string;
  clothingWidth?: number;
  userChest?: number;
  userWaist?: number;
}

const VisualFitMannequin: React.FC<VisualFitMannequinProps> = ({
  gender = 'female',
  bodyType = 'medium',
  recommendedSize,
  alternativeSize,
  confidence,
  clothingName = 'Дреха',
  clothingWidth = 52,
  userChest = 92,
  userWaist = 76,
}) => {
  const [activeView, setActiveView] = useState<'recommended' | 'alternative'>('recommended');

  const isAlt = activeView === 'alternative';
  const currentSize = isAlt && alternativeSize ? alternativeSize : recommendedSize;

  // Изчисляване на визуалните ширини на силуета според типа тяло
  const isMale = gender === 'male';
  let shoulderWidth = isMale ? 120 : 100;
  let chestWidth = isMale ? 104 : 96;
  let waistWidth = isMale ? 88 : 78;
  let hipWidth = isMale ? 94 : 108;

  if (bodyType === 'slim') {
    shoulderWidth -= 8;
    chestWidth -= 8;
    waistWidth -= 8;
    hipWidth -= 8;
  } else if (bodyType === 'large') {
    shoulderWidth += 12;
    chestWidth += 14;
    waistWidth += 16;
    hipWidth += 14;
  }

  // Ширина на виртуалната дреха
  const drapeOffset = isAlt ? 14 : 6;

  return (
    <div className="bg-white rounded-2xl border border-beige-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-[#3A2E2B] flex items-center">
              <Eye className="w-4 h-4 mr-1.5 text-[#B8956A]" />
              FitVision™ 2D Визуален Манекен
            </h4>
            <Badge variant="outline" className="text-[10px] bg-beige-50 text-gray-700">
              {gender === 'male' ? 'Мъжки силует' : 'Дамски силует'} ({bodyType})
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Сравнение на прилепването на дрехата спрямо раменете и талията
          </p>
        </div>

        {/* Бутони за превключване на размера */}
        <div className="flex items-center gap-1.5 bg-beige-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('recommended')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              !isAlt
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {recommendedSize} (Препоръчан)
          </button>
          {alternativeSize && (
            <button
              type="button"
              onClick={() => setActiveView('alternative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isAlt
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {alternativeSize} (Алтернативен)
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas с анатомичен силует и облекло */}
      <div className="relative w-full h-72 bg-gradient-to-b from-[#FAF7F2] to-white rounded-xl border border-beige-100 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 300 360"
          className="h-full w-auto select-none transition-all duration-500"
        >
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EBDDC9" />
              <stop offset="100%" stopColor="#DEC6A6" />
            </linearGradient>

            <linearGradient id="recGarmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.25)" />
              <stop offset="100%" stopColor="rgba(5, 150, 105, 0.15)" />
            </linearGradient>

            <linearGradient id="altGarmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.25)" />
              <stop offset="100%" stopColor="rgba(2, 132, 199, 0.15)" />
            </linearGradient>
          </defs>

          {/* 1. Глава & Врат */}
          <ellipse cx="150" cy="45" rx="22" ry="28" fill="url(#skinGrad)" />
          <path d="M 143 70 Q 150 82 157 70 Z" fill="url(#skinGrad)" />

          {/* 2. Анатомично тяло (Торс) */}
          <path
            d={`
              M ${150 - shoulderWidth / 2} 90
              Q 150 82 ${150 + shoulderWidth / 2} 90
              Q ${150 + chestWidth / 2} 130 ${150 + waistWidth / 2} 175
              Q ${150 + hipWidth / 2} 220 150 240
              Q ${150 - hipWidth / 2} 220 ${150 - waistWidth / 2} 175
              Q ${150 - chestWidth / 2} 130 ${150 - shoulderWidth / 2} 90
              Z
            `}
            fill="url(#skinGrad)"
            stroke="#DEC6A6"
            strokeWidth="1.5"
          />

          {/* 3. Дреха (Контур и обем според избрания размер) */}
          <path
            d={`
              M ${150 - shoulderWidth / 2 - drapeOffset} 86
              L ${150 - shoulderWidth / 2 - drapeOffset - 25} 135
              L ${150 - shoulderWidth / 2 - 8} 145
              L ${150 - chestWidth / 2 - drapeOffset} 140
              L ${150 - waistWidth / 2 - drapeOffset} 210
              Q 150 216 ${150 + waistWidth / 2 + drapeOffset} 210
              L ${150 + chestWidth / 2 + drapeOffset} 140
              L ${150 + shoulderWidth / 2 + 8} 145
              L ${150 + shoulderWidth / 2 + drapeOffset + 25} 135
              L ${150 + shoulderWidth / 2 + drapeOffset} 86
              Q 150 96 ${150 - shoulderWidth / 2 - drapeOffset} 86
              Z
            `}
            fill={isAlt ? 'url(#altGarmentGrad)' : 'url(#recGarmentGrad)'}
            stroke={isAlt ? '#0284C7' : '#059669'}
            strokeWidth={isAlt ? '2.5' : '2'}
            strokeDasharray={isAlt ? '4 2' : 'none'}
            className="transition-all duration-300"
          />

          {/* Маркери за измерване */}
          <line
            x1={150 - chestWidth / 2 - 20}
            y1="130"
            x2={150 + chestWidth / 2 + 20}
            y2="130"
            stroke="#94754E"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <text x="150" y="127" textAnchor="middle" fontSize="9" fill="#5C4633" fontWeight="bold">
            Гръд: {userChest} см
          </text>

          <line
            x1={150 - waistWidth / 2 - 15}
            y1="175"
            x2={150 + waistWidth / 2 + 15}
            y2="175"
            stroke="#94754E"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <text x="150" y="172" textAnchor="middle" fontSize="9" fill="#5C4633" fontWeight="bold">
            Талия: {userWaist} см
          </text>
        </svg>

        {/* Описание на напасването в ъгъла */}
        <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-center text-[11px] bg-white/85 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-beige-200">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            {isAlt ? (
              <span className="text-sky-700 font-bold">
                Свободна кройка (+{drapeOffset * 2} мм толеранс)
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">
                Оптимално анатомично прилягане (Regular Fit)
              </span>
            )}
          </div>
          <span className="font-mono text-gray-500 text-[10px]">
            Мащаб: 1:10
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisualFitMannequin;


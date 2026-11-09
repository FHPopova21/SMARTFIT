import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ShoppingBag,
  Check,
  Ruler,
  Layers,
  ArrowRight,
  ShieldCheck,
  Star,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SizeOption {
  size: string;
  isRecommended: boolean;
  easeCm: number;
  label: string;
  description: string;
  badgeStyle: string;
}

const DEMO_SIZES: SizeOption[] = [
  {
    size: 'XS',
    isRecommended: false,
    easeCm: -4.0,
    label: 'Силно вталено',
    description: 'Обиколката на дрехата е с 4 см под гръдната мярка. Силно прилепнал контур.',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    size: 'S',
    isRecommended: false,
    easeCm: 0.5,
    label: 'Втален силует',
    description: 'Минимален луфт от +0.5 см. Елегантно прилепване по тялото с нисък толеранс.',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    size: 'M',
    isRecommended: true,
    easeCm: 4.5,
    label: 'Балансиран обем (Препоръчан)',
    description: 'Оптимален толеранс от +4.5 см за свобода на движение и комфортно носене.',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    size: 'L',
    isRecommended: false,
    easeCm: 9.0,
    label: 'Свободен обем',
    description: 'Щедър толеранс от +9.0 см. Свободен контур за оувърсайз стил.',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    size: 'XL',
    isRecommended: false,
    easeCm: 14.0,
    label: 'Широк / Relaxed',
    description: 'Широк обем с +14.0 см толеранс спрямо гръдната мярка.',
    badgeStyle: 'bg-zinc-100 text-zinc-700 border-zinc-200'
  }
];

export const EcommerceProductHeroDemo: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [activeTab, setActiveTab] = useState<'fit' | 'details'>('fit');

  const currentOption = DEMO_SIZES.find((s) => s.size === selectedSize) || DEMO_SIZES[2];

  return (
    <div
      className="relative w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#E9EAF3] shadow-[0_20px_60px_-15px_rgba(15,17,23,0.07)] overflow-hidden transition-all duration-300"
      role="region"
      aria-label="Интерактивна B2B демонстрация на вграден уиджет"
    >
      {/* 1. Браузърна симулационна лента на търговеца */}
      <div className="bg-[#F8F9FC] px-4 py-2.5 border-b border-[#E9EAF3] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
          <span className="ml-2 text-[11px] text-zinc-600 font-semibold truncate max-w-[210px] sm:max-w-none">
            store-demo.fitvision.io/atelier-linen-jacket
          </span>
        </div>
        <Badge className="bg-white text-indigo-600 border-[#E9EAF3] text-[10px] font-mono px-2 py-0.5 shadow-2xs font-bold hidden sm:inline-flex">
          Embeddable Widget
        </Badge>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* 2. Горна част: Артикул от онлайн магазин */}
        <div className="flex gap-4 items-start">
          <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-[#E9EAF3]">
            <img
              src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&auto=format&fit=crop&q=80"
              alt="Atelier Tailored Linen Jacket"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-1 left-1 bg-zinc-950/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
              SS25
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-0.5 font-sans">
              <span>Atelier & Co.</span>
              <span>•</span>
              <span className="text-zinc-600 font-medium">Дамско сако</span>
            </div>
            <h4 className="text-base font-bold text-[#0F1117] tracking-tight truncate font-sans">
              Структурирано ленено сако
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-[#0F1117] font-mono">
                189.00 лв
              </span>
              <span className="text-xs text-zinc-400 line-through font-mono">
                229.00 лв
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono px-1.5 py-0.2">
                -17%
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-1 font-mono">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-zinc-700">4.9</span>
              <span className="text-zinc-400">(42 отзива)</span>
            </div>
          </div>
        </div>

        {/* 3. ВГРАДЕН FITVISION УИДЖЕТ (Вграден директно в продуктовата карта) */}
        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-[#E9EAF3] space-y-3.5 transition-all">
          {/* Заглавна лента на уиджета */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4F46E5]">
                FitVision™ Size Assistant
              </span>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-[#E9EAF3]">
              Мерки на купувача: 92 см гърди
            </span>
          </div>

          {/* Превключвател на размери */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-zinc-800">Изберете размер:</span>
              <span className="text-[11px] text-indigo-600 font-medium">
                {currentOption.isRecommended ? '★ Препоръчан от модела' : 'Алтернативен обем'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Избор на размер в уиджета">
              {DEMO_SIZES.map((opt) => {
                const isSelected = selectedSize === opt.size;
                return (
                  <button
                    key={opt.size}
                    type="button"
                    onClick={() => setSelectedSize(opt.size)}
                    aria-pressed={isSelected}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border relative focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
                      isSelected
                        ? opt.isRecommended
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                        : 'bg-white text-zinc-700 border-[#E9EAF3] hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{opt.size}</span>
                    {opt.isRecommended && (
                      <span className="block text-[8px] font-sans font-normal opacity-90 text-emerald-300">
                        Match
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Динамично обяснение на прилягането за избрания размер */}
          <div className="bg-white p-3 rounded-xl border border-[#E9EAF3] space-y-1.5 transition-all duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F1117] flex items-center gap-1.5 font-mono">
                <Ruler className="w-3.5 h-3.5 text-[#4F46E5]" />
                Размер {currentOption.size}: {currentOption.label}
              </span>
              <Badge className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${currentOption.badgeStyle}`}>
                {currentOption.easeCm >= 0 ? `+${currentOption.easeCm} см` : `${currentOption.easeCm} см`} толеранс
              </Badge>
            </div>

            <p className="text-[11px] text-zinc-600 leading-relaxed font-sans">
              {currentOption.description}
            </p>

            <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Гръдна обиколка (дреха): {92 + currentOption.easeCm} см</span>
              <span className="text-[#4F46E5] font-semibold">2D Шублерна прецизност</span>
            </div>
          </div>
        </div>

        {/* 4. Финални бутони за покупка (симулиран онлайн магазин) */}
        <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
          <Button
            size="lg"
            className="flex-1 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            Добави размер {selectedSize} в кошницата
          </Button>

          <Link to="/recommendation" className="sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-[#E9EAF3] text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 text-xs font-semibold rounded-xl px-4 py-3"
            >
              Отвори цялата пробна
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* 5. Долна B2B бележка */}
        <div className="text-center text-[10px] font-mono text-zinc-600 pt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Интерактивна симулация на вграден FitVision уиджет в продуктова страница</span>
        </div>
      </div>
    </div>
  );
};

export default EcommerceProductHeroDemo;


import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types';
import { Sparkles, Star, Store, Heart, Eye } from 'lucide-react';

interface ClothingCardProps {
  item: ClothingItem;
  onRecommend?: () => void;
  showRecommendButton?: boolean;
  showSellerActions?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onQuickView?: () => void;
}

const getClothingTypeConfig = (type: string) => {
  switch (type) {
    case 't-shirt':
    case 'shirt':
      return { label: 'Риза / Тениска', fallbackIcon: '👔', bg: 'from-amber-50 to-orange-50' };
    case 'pants':
      return { label: 'Панталон / Дънки', fallbackIcon: '👖', bg: 'from-blue-50 to-indigo-50' };
    case 'dress':
      return { label: 'Рокля', fallbackIcon: '👗', bg: 'from-rose-50 to-pink-50' };
    case 'jacket':
      return { label: 'Яке / Връхно', fallbackIcon: '🧥', bg: 'from-stone-50 to-amber-50' };
    case 'skirt':
      return { label: 'Пола', fallbackIcon: '🩱', bg: 'from-purple-50 to-pink-50' };
    case 'sweater':
      return { label: 'Пуловер / Плетиво', fallbackIcon: '🧶', bg: 'from-emerald-50 to-teal-50' };
    default:
      return { label: type, fallbackIcon: '👕', bg: 'from-zinc-50 to-slate-100' };
  }
};

const getMaterialLabel = (material: string) => {
  const labels: Record<string, { label: string; badgeClass: string }> = {
    elastic: { label: 'Еластична', badgeClass: 'bg-emerald-500/90 text-white border-emerald-400/50' },
    'semi-elastic': { label: 'Полуеластична', badgeClass: 'bg-amber-500/90 text-white border-amber-400/50' },
    'non-elastic': { label: 'Нееластична', badgeClass: 'bg-stone-800/80 text-white border-stone-600/50' },
  };
  return labels[material] || { label: material, badgeClass: 'bg-gray-800/80 text-white border-gray-600/50' };
};

const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onRecommend,
  showRecommendButton = true,
  showSellerActions = false,
  onDelete,
  onEdit,
  onQuickView,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);

  const typeConfig = getClothingTypeConfig(item.type);
  const materialConfig = getMaterialLabel(item.material);

  return (
    <Card className="group relative bg-white rounded-3xl border border-zinc-200 hover:border-sky-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)] transition-all duration-500 overflow-hidden flex flex-col justify-between h-full">
      {/* Горна част: Снимка или Студийна витрина */}
      <div className="relative h-60 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden flex items-center justify-center">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="text-7xl group-hover:scale-110 transition-transform duration-500 select-none drop-shadow-xs">
            {typeConfig.fallbackIcon}
          </div>
        )}

        {/* Тъмен градиент в долния и горния край за висок контраст на бейджовете */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Горе вляво: Бейдж за размер и еластичност */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
          <Badge className="bg-zinc-950/95 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-xs backdrop-blur-xs border border-white/10">
            Размер {item.size}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs backdrop-blur-xs border ${materialConfig.badgeClass}`}>
            {materialConfig.label}
          </Badge>
        </div>

        {/* Горе вдясно: Бутони за бърз преглед и любими */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-700 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-90"
            title={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-600 hover:text-rose-500'
              }`}
            />
          </button>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-700 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-90"
              title="Преглед на детайли и отзиви"
            >
              <Eye className="w-4 h-4 text-sky-600" />
            </button>
          )}
        </div>

        {/* Долу вляво: Категория */}
        <div className="absolute bottom-3 left-3.5 z-10">
          <span className="text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-0.8 rounded-lg border border-white/15 tracking-wide">
            {typeConfig.label}
          </span>
        </div>
      </div>

      {/* Съдържание на картата */}
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Търговец и рейтинг */}
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <div className="flex items-center gap-1 text-zinc-600 font-medium">
              <Store className="w-3.5 h-3.5 text-sky-600" />
              <span className="truncate max-w-[130px] font-semibold">{item.merchantName || 'FitVision Boutique'}</span>
            </div>
            <div className="flex items-center text-amber-500 font-bold gap-1 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9</span>
              <span className="text-zinc-400 font-normal text-[10px]">(18)</span>
            </div>
          </div>

          {/* Име на артикула */}
          <h3 className="font-extrabold text-zinc-900 text-base group-hover:text-sky-600 transition-colors line-clamp-1 tracking-tight">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Анатомични мерки на дрехата (в сантиметри) */}
          <div className="mt-3.5 bg-zinc-50 rounded-2xl p-2.5 border border-zinc-200">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Ширина</span>
                <span className="font-extrabold text-zinc-900">{item.measurements.width} см</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Дължина</span>
                <span className="font-extrabold text-zinc-900">{item.measurements.length} см</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Ръкав</span>
                <span className="font-extrabold text-zinc-900">
                  {item.measurements.sleeves ? `${item.measurements.sleeves} см` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Долна лента: Цена и Главен бутон */}
        <div className="pt-3 border-t border-zinc-200 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-500 font-medium">Цена:</span>
            <div className="text-right">
              <span className="text-xl font-black text-zinc-900 tracking-tight">
                {item.price ? `${Number(item.price).toFixed(2)} лв` : '—'}
              </span>
            </div>
          </div>

          {showSellerActions ? (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-zinc-200"
                >
                  Редактирай
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  variant="destructive"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Изтрий
                </Button>
              )}
            </div>
          ) : (
            showRecommendButton && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRecommend) onRecommend();
                }}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                AI Препоръка за размер
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClothingCard;

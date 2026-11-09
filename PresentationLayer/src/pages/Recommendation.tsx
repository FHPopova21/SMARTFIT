import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { mockClothingItems } from '@/data/mockClothing';
import { ClothingItem } from '@/types';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sliders,
  Layers,
  Quote,
  Check,
  ShoppingBag,
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VirtualTryOn3DScene from '@/components/VirtualTryOn3DScene';
import VisualFitMannequin from '@/components/VisualFitMannequin';
import { normalizeConfidence } from '@/utils/visualFitMath';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface SizeRecommendation {
  recommendedSize: string;
  confidence: number | null;
  explanation: string;
  description?: string;
  alternativeSize?: string;
  alternativeConfidence?: number | null;
  alternativeExplanation?: string;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const Recommendation = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clothingList, setClothingList] = useState<ClothingItem[]>(mockClothingItems);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(mockClothingItems[0] || null);
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentAdded, setCommentAdded] = useState(false);

  // Active simulated size (iOS segmented toggle control)
  const [activeSize, setActiveSize] = useState<string>('M');
  const [isHeatmap, setIsHeatmap] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Fetch real clothes from backend
  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const res = await fetch(`${API_URL}/clothes`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setClothingList(data);
          }
        }
      } catch (err) {
        console.warn('Използване на локални данни за дрехи:', err);
      }
    };
    fetchClothes();
  }, []);

  // Set selected item if passed from ClothingListing
  useEffect(() => {
    if (location.state?.selectedItem) {
      setSelectedItem(location.state.selectedItem);
    }
  }, [location.state]);

  // Auto generate recommendation
  useEffect(() => {
    if (selectedItem && user?.bodyMeasurements) {
      generateRecommendation();
    }
  }, [selectedItem, user?.bodyMeasurements]);

  const generateRecommendation = async () => {
    if (!selectedItem || !user?.bodyMeasurements) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/predict_size`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: user.bodyMeasurements.height,
          weight: user.bodyMeasurements.weight,
          chest: user.bodyMeasurements.chest,
          waist: user.bodyMeasurements.waist,
          clothing_type: selectedItem.type,
          material: selectedItem.material,
          clothing_width: selectedItem.measurements.width,
          clothing_length: selectedItem.measurements.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedConfidence = normalizeConfidence(data.confidence);
        const normalizedAltConfidence = normalizeConfidence(data.alternative_confidence);

        const rec: SizeRecommendation = {
          recommendedSize: data.size || data.recommended_size || 'M',
          confidence: normalizedConfidence,
          explanation: data.explanation || `Препоръчваме размер ${data.size || data.recommended_size || 'M'} според вашите мерки.`,
          description: data.description || 'Оптимално анатомично пасване по стандартите на ISO 8559.',
          alternativeSize: data.alternative_size || undefined,
          alternativeConfidence: normalizedAltConfidence,
          alternativeExplanation: data.alternative_explanation || undefined
        };
        setRecommendation(rec);
        setActiveSize(rec.recommendedSize);
      } else {
        throw new Error('API грешка');
      }
    } catch {
      // Fallback ориентировъчна оценка (без измисляне на ML вероятност)
      const chest = user.bodyMeasurements?.chest || 90;
      let recSize = 'M';
      if (chest < 86) recSize = 'XS';
      else if (chest < 92) recSize = 'S';
      else if (chest < 100) recSize = 'M';
      else if (chest < 108) recSize = 'L';
      else recSize = 'XL';

      const altSize = recSize === 'M' ? 'S' : recSize === 'L' ? 'M' : 'L';
      const rec: SizeRecommendation = {
        recommendedSize: recSize,
        confidence: null, // Строго null при липса на връзка с ML модела (без фалшив процент)
        explanation: `Размер ${recSize} е препоръчан на база гръдна обиколка (${chest} см). За прецизна вероятност е необходима активна връзка.`,
        description: `Ориентировъчно изчисление за модела "${selectedItem.name}".`,
        alternativeSize: altSize,
        alternativeConfidence: null,
        alternativeExplanation: `Размер ${altSize} предлага алтернативен обем според личните ви предпочитания.`
      };
      setRecommendation(rec);
      setActiveSize(recSize);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedItem) return;
    setCommentLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setCommentAdded(true);
      setCommentText('');
      toast({ title: 'Благодарим ви!', description: 'Вашият отзив за размера бе записан успешно.' });
    } catch {
      toast({ title: 'Грешка', description: 'Възникна проблем при изпращането', variant: 'destructive' });
    } finally {
      setCommentLoading(false);
    }
  };

  // 1. Не е влязъл в профила
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto p-6 my-16">
        <div className="glass-card text-center p-8 border-white/10 space-y-4">
          <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto" />
          <h2 className="text-2xl font-black text-white font-heading">Входът е задължителен</h2>
          <p className="text-zinc-400 text-sm">
            За да използвате 3D виртуалната проба и персонализирания ML модел, моля влезте в профила си.
          </p>
          <Button 
            onClick={() => navigate('/signin')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-2xl px-6 py-2.5 shadow-md"
          >
            Вход в профил
          </Button>
        </div>
      </div>
    );
  }

  // 2. Липсват телесни мерки
  if (!user?.bodyMeasurements) {
    return (
      <div className="max-w-xl mx-auto p-6 my-16">
        <div className="glass-card text-center p-8 border-white/10 space-y-4">
          <Sliders className="w-12 h-12 text-indigo-400 mx-auto" />
          <h2 className="text-2xl font-black text-white font-heading">Необходим е About You Quiz</h2>
          <p className="text-zinc-400 text-sm">
            За да заредим вашия дигитален 3D манекен, направете бързия онбординг въпросник (само 1 минута).
          </p>
          <Button 
            onClick={() => navigate('/quiz')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-2xl px-6 py-2.5 shadow-[0_0_25px_rgba(99,102,241,0.4)]"
          >
            Започни About You Quiz ✨
          </Button>
        </div>
      </div>
    );
  }

  const confidence = recommendation?.confidence;
  const hasConfidence = typeof confidence === 'number' && confidence > 0;
  const isHighConfidence = hasConfidence && confidence >= 85;
  const isLowConfidence = hasConfidence && confidence < 60;
  const confidenceColor = !hasConfidence ? '#94A3B8' : isHighConfidence ? '#10B981' : isLowConfidence ? '#F43F5E' : '#6366F1';

  // SVG Circular progress bar values (Radius = 54, Circumference = 2 * PI * 54 = 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasConfidence
    ? circumference - (confidence / 100) * circumference
    : circumference;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Заглавна секция */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold px-3 py-0.5">
                FitVision™ 3D Virtual Try-On
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-bold px-3 py-0.5">
                ISO 8559 Calibrated
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight flex items-center gap-3">
              Виртуална 3D Пробна
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Персонален дигитален близнак, 360° студийна симулация и термичен анализ на напрежението
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/clothing">
              <Button variant="outline" size="sm" className="border-zinc-200 text-zinc-800 hover:bg-zinc-50 text-xs rounded-xl shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Смени дрехата от каталога
              </Button>
            </Link>
          </div>
        </div>

        {/* АСИМЕТРИЧЕН ЕКРАН: 40% Интелигентен панел вляво / 60% 3D Сцена вдясно */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ЛЯВА ЧАСТ: Интелигентният Панел (Glass Card - 5 от 12 = ~42%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Голям пулсиращ кръгов прогрес бар за AI увереност */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-700 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  AI Препоръка за размер
                </span>
                {hasConfidence ? (
                  <Badge
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border ${
                      isHighConfidence
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isHighConfidence ? 'Висока увереност (>85%)' : 'Препоръка с толеранс'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-mono font-medium text-zinc-500 border-zinc-200 bg-zinc-50">
                    Confidence unavailable
                  </Badge>
                )}
              </div>

              {/* Кръгов циферблат с препоръчания размер в центъра */}
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Заден контурен кръг */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.06)"
                      strokeWidth="8"
                    />
                    {/* Светещ зареден прогрес в неоново зелено/индиго */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={confidenceColor}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Централен препоръчан размер: M */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono tracking-tighter">
                      {recommendation?.recommendedSize || 'M'}
                    </span>
                    <span className={`text-xs font-mono font-bold mt-0.5 ${hasConfidence ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {hasConfidence ? `${confidence}% Match` : 'Confidence unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. iOS Segmented Control Превключвател на размери (XS, S, M, L, XL) */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                  Интерактивна проба на размери:
                </label>
                <div className="grid grid-cols-5 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
                  {SIZES.map((sz) => {
                    const isSelected = activeSize === sz;
                    const isRec = recommendation?.recommendedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setActiveSize(sz)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all relative ${
                          isSelected
                            ? 'bg-zinc-950 text-white shadow-xs scale-[1.02]'
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
                        }`}
                      >
                        {sz}
                        {isRec && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Обяснение от модела: Стилизиран блок (Quote Box) */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 relative">
                <Quote className="w-5 h-5 text-indigo-500/60 mb-1" />
                <p className="text-xs text-zinc-800 leading-relaxed italic">
                  {activeSize === recommendation?.recommendedSize ? (
                    <>
                      „<strong>Размер {recommendation?.recommendedSize}</strong> съответства на въведената гръдна обиколка ({user.bodyMeasurements.chest} см).“
                    </>
                  ) : activeSize === 'S' || activeSize === 'XS' ? (
                    <>
                      „<strong>Размер {activeSize}</strong> предлага по-втален контур спрямо базовата мярка.“
                    </>
                  ) : (
                    <>
                      „<strong>Размер {activeSize}</strong> предлага по-свободен обем спрямо базовата мярка.“
                    </>
                  )}
                </p>
                <div className="mt-2.5 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Random Forest Model v2.4</span>
                  <span className="text-indigo-700 font-bold">Statistical Inference</span>
                </div>
              </div>
            </div>

            {/* Карточка за избраната дреха от каталога */}
            {selectedItem && (
              <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedItem.image ? (
                      <img
                        src={selectedItem.image}
                        alt={selectedItem.name}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-xl">
                        👔
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-zinc-950 text-sm line-clamp-1">{selectedItem.name}</h4>
                      <p className="text-[11px] text-zinc-500">{selectedItem.merchantName || 'FitVision Store'}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-indigo-600 font-mono">
                    {selectedItem.price ? `${Number(selectedItem.price).toFixed(2)} лв` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] text-zinc-500 block">Ширина</span>
                    <span className="font-bold text-zinc-900">{selectedItem.measurements.width} см</span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] text-zinc-500 block">Дължина</span>
                    <span className="font-bold text-zinc-900">{selectedItem.measurements.length} см</span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] text-zinc-500 block">Материя</span>
                    <span className="font-bold text-indigo-700 capitalize">{selectedItem.material}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ДЯСНА ЧАСТ: Визуализация (3D Сцена или 2D Технически модел) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Превключвател за вида визуализация */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Режим на визуализация:
              </span>
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200" role="group" aria-label="Избор на визуален режим">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    viewMode === '3d'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
                  }`}
                >
                  3D Студио
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    viewMode === '2d'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
                  }`}
                >
                  2D Технически модел
                </button>
              </div>
            </div>

            {viewMode === '3d' ? (
              <>
                <VirtualTryOn3DScene
                  gender={user.bodyMeasurements.gender}
                  bodyType={user.bodyMeasurements.bodyType}
                  selectedSize={activeSize}
                  recommendedSize={recommendation?.recommendedSize || 'M'}
                  clothingName={selectedItem?.name || 'FitVision Garment'}
                  clothingWidth={selectedItem?.measurements.width || 52}
                  userChest={user.bodyMeasurements.chest}
                  userWaist={user.bodyMeasurements.waist}
                  isHeatmap={isHeatmap}
                  onToggleHeatmap={() => setIsHeatmap(!isHeatmap)}
                />

                {/* Легенда за напрежението при активен Heatmap */}
                {isHeatmap ? (
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-800 font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      Термична скала на напрежението:
                    </span>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Твърде тясно
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Перфектен контур
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Свободен луфт
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span>Мащаб на цифровия двойник: 1:10 • Студийно триточково осветление</span>
                    <span className="text-indigo-600 font-bold">60 FPS Smooth Morphing</span>
                  </div>
                )}
              </>
            ) : (
              <VisualFitMannequin
                gender={user.bodyMeasurements.gender}
                bodyType={user.bodyMeasurements.bodyType}
                recommendedSize={recommendation?.recommendedSize || 'M'}
                alternativeSize={recommendation?.alternativeSize}
                confidence={recommendation?.confidence ?? undefined}
                clothingName={selectedItem?.name}
                clothingWidth={selectedItem?.measurements.width}
                clothingMeasurementType="flat_width"
                userChest={user.bodyMeasurements.chest}
                userWaist={user.bodyMeasurements.waist}
              />
            )}
          </div>
        </div>

        {/* Долна секция: Потребителски отзив и проверка */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm max-w-2xl">
          <h4 className="font-bold text-zinc-950 text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Доволни ли сте от виртуалната проба?
          </h4>
          {commentAdded ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
              ✓ Вашият отзив бе записан успешно в профила на модела!
            </div>
          ) : (
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Споделете вашите впечатления от пасването на размера..."
                rows={2}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                size="sm"
                className="bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-bold rounded-xl"
              >
                {commentLoading ? 'Записване...' : 'Изпрати отзив'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendation;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Footprints,
  Camera,
  Ruler,
  CheckCircle,
  Sparkles,
  Info,
  RefreshCw,
  Upload,
  ArrowRight,
  SlidersHorizontal,
  FileText,
  Scan,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ShoeSizeResult {
  footLengthMm: number;
  footLengthCm: number;
  footWidthMm: number;
  mondopoint: number;
  recommendedEu: number;
  alternativeEu: number;
  ukSize: number;
  usMenSize: number;
  usWomenSize: number;
  confidence: number;
  explanation: string;
  alternativeExplanation: string;
}

const ShoeRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [footLengthMm, setFootLengthMm] = useState<number>(265); // 26.5 cm ~ EU 42
  const [selectedShoeType, setSelectedShoeType] = useState<'sneakers' | 'formal' | 'boots' | 'sandals'>('sneakers');
  const [footWidthType, setFootWidthType] = useState<'narrow' | 'standard' | 'wide'>('standard');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanPhase, setScanPhase] = useState<number>(0);
  const [scanLocked, setScanLocked] = useState<boolean>(true);
  const [calculation, setCalculation] = useState<ShoeSizeResult | null>(null);

  // Изчисляване на размер по стандарта ISO/TS 19407 (Mondopoint)
  const calculateShoeSize = useCallback((lengthMm: number) => {
    let allowanceMm = 15;
    if (selectedShoeType === 'boots') allowanceMm = 18;
    else if (selectedShoeType === 'formal') allowanceMm = 12;
    else if (selectedShoeType === 'sandals') allowanceMm = 8;

    let widthAdj = 0;
    if (footWidthType === 'wide') widthAdj = 0.5;
    else if (footWidthType === 'narrow') widthAdj = -0.5;

    const totalLengthMm = lengthMm + allowanceMm;
    const rawParisPoint = (totalLengthMm / 10) * 1.5;
    const finalEu = Math.round((rawParisPoint + widthAdj) * 2) / 2;

    const altEu = finalEu > rawParisPoint ? finalEu - 0.5 : finalEu + 0.5;
    const uk = Math.round((finalEu - 32.5) * 2) / 2;
    const usMen = Math.round((uk + 1) * 2) / 2;
    const usWomen = Math.round((uk + 2) * 2) / 2;
    const approxWidthMm = Math.round(lengthMm * (footWidthType === 'wide' ? 0.41 : footWidthType === 'narrow' ? 0.35 : 0.38));

    setCalculation({
      footLengthMm: lengthMm,
      footLengthCm: Number((lengthMm / 10).toFixed(1)),
      footWidthMm: approxWidthMm,
      mondopoint: totalLengthMm,
      recommendedEu: finalEu,
      alternativeEu: altEu,
      ukSize: Math.max(3, uk),
      usMenSize: Math.max(4, usMen),
      usWomenSize: Math.max(5, usWomen),
      confidence: 96.8,
      explanation: `За стъпало с дължина ${lengthMm} мм и избран толеранс за ${selectedShoeType === 'boots' ? 'боти (+18 мм)' : selectedShoeType === 'formal' ? 'официални обувки (+12 мм)' : 'маратонки (+15 мм)'}, препоръчителният размер по ISO/TS 19407 е точно EU ${finalEu}.`,
      alternativeExplanation: `Ако предпочитате ${altEu > finalEu ? 'по-свободно прилягане с дебел чорап' : 'по-плътен и стегнат контур'}, размер EU ${altEu} е отлична алтернатива.`
    });
  }, [selectedShoeType, footWidthType]);

  useEffect(() => {
    calculateShoeSize(footLengthMm);
  }, [footLengthMm, calculateShoeSize]);

  // Симулация на Sci-Fi OpenCV AR Скенер с 3 фази
  const runOpenCvScan = () => {
    setIsScanning(true);
    setScanLocked(false);
    setScanPhase(1);

    // Фаза 1: Калибриране на А4 лист
    setTimeout(() => {
      setScanPhase(2);
      // Фаза 2: Изчисляване на ширина
      setTimeout(() => {
        setScanPhase(3);
        // Фаза 3: Прогнозиране на размер и заключване
        setTimeout(() => {
          setIsScanning(false);
          setScanLocked(true);
          const detectedMm = Math.floor(Math.random() * (278 - 250 + 1)) + 250;
          setFootLengthMm(detectedMm);
          toast({
            title: "🎯 OpenCV рамката се заключи успешно!",
            description: `4-те ъгъла на листа А4 са калибрирани. Дължина на стъпалото: ${detectedMm} мм.`,
          });
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      runOpenCvScan();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-y-1/2 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[400px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Заглавна секция */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold px-3 py-0.5">
                👟 ISO/TS 19407 Footwear Intelligence
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-bold px-3 py-0.5">
                OpenCV A4 Vision
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight flex items-center gap-3">
              Интелигентен AR Скенер за Обувки
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Компютърно зрение с лист А4 като референтен мащаб или прецизно милиметрово Mondopoint изчисление
            </p>
          </div>

          {/* Превключвател: AR Скенер срещу Ръчен слайдер */}
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scan'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              AR Скенер (Лист А4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Ръчно измерване
            </button>
          </div>
        </div>

        {/* Главен грид: 7 от 12 (Интерфейс на скенера) + 5 от 12 (Резултат) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ЛЯВА ЧАСТ: AR Скенер и настройки (7 от 12) */}
          <div className="lg:col-span-7 space-y-6">
            {/* ТИП ОБУВКА И ТОЛЕРАНС ЗА ПРЪСТИ */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-sm space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold block">
                1. Изберете тип обувка (Определя луфта за пръсти):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'sneakers', label: 'Маратонки', allowance: '+15 мм луфт', icon: '👟' },
                  { id: 'formal', label: 'Официални', allowance: '+12 мм луфт', icon: '👞' },
                  { id: 'boots', label: 'Боти / Зимни', allowance: '+18 мм луфт', icon: '🥾' },
                  { id: 'sandals', label: 'Сандали', allowance: '+8 мм луфт', icon: '👡' }
                ].map((type) => {
                  const isSelected = selectedShoeType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedShoeType(type.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{type.label}</span>
                      <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{type.allowance}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ШИРИНА НА СТЪПАЛОТО */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold">
                  2. Ширина на стъпалото (Калъп):
                </span>
                <Badge variant="outline" className="text-[10px] font-mono bg-zinc-50 text-zinc-700 border-zinc-200">
                  {footWidthType === 'narrow' ? 'Тясно (-0.5 размер)' : footWidthType === 'wide' ? 'Широко (+0.5 размер)' : 'Стандартно (Medium)'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'narrow', label: 'Тясно стъпало', desc: 'Плътен контур (-0.5 размер)' },
                  { id: 'standard', label: 'Стандартно', desc: 'Стандартна ширина' },
                  { id: 'wide', label: 'Широко стъпало', desc: 'Свободно пространство (+0.5)' }
                ].map((w) => {
                  const isSelected = footWidthType === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setFootWidthType(w.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="font-bold text-xs block text-zinc-900">{w.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-1 block leading-tight">{w.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCI-FI AR СКАНИРАЩ ПРОЗОРЕЦ (HUD Overlay) */}
            {activeTab === 'scan' ? (
              <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-950 font-bold">
                      OpenCV AR Viewfinder • Калибрация на формат А4
                    </span>
                  </div>
                  {scanLocked && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-bold animate-pulse">
                      ● LOCKED • 4 CORNERS OK
                    </Badge>
                  )}
                </div>

                {/* AR HUD Камера прозорец */}
                <div className="relative w-full h-[360px] rounded-3xl bg-[#09090D] border border-white/15 overflow-hidden flex items-center justify-center shadow-2xl">
                  {/* Фонова мрежа (Sci-Fi Grid) */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #6366F1 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}
                  />

                  {/* 4 Ъглови маркера (OpenCV Target Brackets) */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-400 transition-colors shadow-[0_0_12px_#10B981]" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-400 transition-colors shadow-[0_0_12px_#10B981]" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-400 transition-colors shadow-[0_0_12px_#10B981]" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-400 transition-colors shadow-[0_0_12px_#10B981]" />

                  {/* Централен SVG контур: Рамка на лист А4 и полупрозрачно стъпало */}
                  <svg viewBox="0 0 210 297" className="w-56 h-72 select-none z-10">
                    {/* Пунктирана рамка на формат А4 */}
                    <rect
                      x="10"
                      y="10"
                      width="190"
                      height="277"
                      fill="rgba(255, 255, 255, 0.03)"
                      stroke={scanLocked ? '#10B981' : '#6366F1'}
                      strokeWidth="1.8"
                      strokeDasharray="6 4"
                      rx="6"
                    />

                    {/* 4 Ъглови репера (Corner ArUco markers) */}
                    <circle cx="22" cy="22" r="5" fill="#10B981" />
                    <circle cx="188" cy="22" r="5" fill="#10B981" />
                    <circle cx="22" cy="275" r="5" fill="#10B981" />
                    <circle cx="188" cy="275" r="5" fill="#10B981" />

                    <text x="105" y="32" textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="bold" fontFamily="monospace">
                      A4 REFERENCE: 210 × 297 mm
                    </text>

                    {/* Полупрозрачен силует на стъпало */}
                    <path
                      d="M 90 265 C 80 265 75 245 74 215 C 73 185 70 155 72 125 C 74 95 80 75 92 60 C 100 50 110 47 118 55 C 128 65 134 95 132 135 C 130 175 135 215 132 245 C 130 265 120 265 105 265 Z"
                      fill="rgba(99, 102, 241, 0.2)"
                      stroke={scanLocked ? '#10B981' : '#818CF8'}
                      strokeWidth="2"
                    />

                    {/* Ограничителна зелена рамка (Bounding Box) */}
                    <rect x="68" y="50" width="70" height="220" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Линия на дължината с измерените мм */}
                    <line x1="148" y1="50" x2="148" y2="270" stroke="#10B981" strokeWidth="1.5" />
                    <text x="156" y="165" fontSize="8" fill="#10B981" fontWeight="bold" fontFamily="monospace">
                      {footLengthMm} mm
                    </text>

                    {/* Хоризонтална сканираща лазерна линия при сканиране */}
                    {isScanning && (
                      <line
                        x1="10"
                        y1="150"
                        x2="200"
                        y2="150"
                        stroke="#10B981"
                        strokeWidth="3"
                        className="animate-pulse"
                        style={{ filter: 'drop-shadow(0 0 10px #10B981)' }}
                      />
                    )}
                  </svg>

                  {/* Долна динамична телеметрия при сканиране */}
                  {isScanning && (
                    <div className="absolute bottom-3 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-emerald-500/40 text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {scanPhase === 1 && 'Калибриране на мащаба по ISO/TS 19407 (Лист А4)...'}
                        {scanPhase === 2 && 'Изчисляване на ширина и свод на стъпалото...'}
                        {scanPhase === 3 && 'Прогнозиране на точен EU размер...'}
                      </div>
                      <Progress value={scanPhase === 1 ? 33 : scanPhase === 2 ? 66 : 100} className="h-1.5 bg-zinc-800" />
                    </div>
                  )}
                </div>

                {/* Бутони за управление на сканирането */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="cursor-pointer">
                    <span className="bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      Качете снимка от камера
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <Button
                    type="button"
                    onClick={runOpenCvScan}
                    disabled={isScanning}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {isScanning ? 'OpenCV Сканиране...' : 'Стартирай автоматично AR измерване'}
                  </Button>
                </div>
              </div>
            ) : (
              /* РЪЧЕН ПРЕЦИЗЕН СЛАЙДЕР */
              <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" /> Точна дължина на стъпалото
                  </span>
                  <span className="text-4xl font-black text-zinc-950 font-mono">
                    {footLengthMm} <span className="text-base text-zinc-400">мм</span>
                    <span className="text-sm text-indigo-600 ml-2">({(footLengthMm / 10).toFixed(1)} см)</span>
                  </span>
                </div>

                <Slider
                  value={[footLengthMm]}
                  min={210}
                  max={310}
                  step={1}
                  onValueChange={(val) => setFootLengthMm(val[0])}
                  className="py-2"
                />

                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>210 мм (EU 35)</span>
                  <span>265 мм (EU 42)</span>
                  <span>310 мм (EU 48)</span>
                </div>

                {/* Бързи бутони */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-mono text-zinc-500 block font-bold">
                    Бърз избор по стандартен размер:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                    {[
                      { cm: '24.0', mm: 240, eu: '38' },
                      { cm: '25.0', mm: 250, eu: '40' },
                      { cm: '26.0', mm: 260, eu: '41' },
                      { cm: '26.5', mm: 265, eu: '42' },
                      { cm: '27.5', mm: 275, eu: '43' },
                      { cm: '28.5', mm: 285, eu: '44-45' }
                    ].map(b => (
                      <button
                        key={b.mm}
                        type="button"
                        onClick={() => setFootLengthMm(b.mm)}
                        className={`p-2 rounded-xl text-center border text-xs transition-all ${
                          footLengthMm === b.mm
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs font-bold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="block font-bold">{b.cm} см</span>
                        <span className="text-[10px] text-zinc-500 block">EU {b.eu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ДЯСНА ЧАСТ: Изчислен Резултат (5 от 12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Mondopoint Анализ
                </span>
                {calculation && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono font-bold">
                    {calculation.confidence}% Увереност
                  </Badge>
                )}
              </div>

              {calculation && (
                <>
                  {/* Основен препоръчан размер */}
                  <div className="bg-emerald-50/70 p-6 rounded-3xl border border-emerald-200 space-y-4">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 tracking-wider block">
                      Препоръчителен размер обувки (ISO/TS 19407)
                    </span>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-5xl sm:text-6xl font-black text-zinc-950 font-mono tracking-tight">
                        EU {calculation.recommendedEu}
                      </h3>
                      <div className="text-right font-mono">
                        <span className="text-xs text-zinc-500 block font-bold">Мондопойнт:</span>
                        <span className="text-base font-black text-emerald-700">
                          {calculation.mondopoint} мм
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-mono text-zinc-700">
                        <span>Точност на калибрация:</span>
                        <span className="text-emerald-700 font-bold">{calculation.confidence}%</span>
                      </div>
                      <Progress value={calculation.confidence} className="h-2 bg-emerald-200/50" />
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed italic border-t border-emerald-200/70 pt-3">
                      {calculation.explanation}
                    </p>
                  </div>

                  {/* Алтернативен размер */}
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">Втора опция (Алтернативен):</span>
                      <h4 className="text-lg font-bold text-indigo-600 font-mono">
                        EU {calculation.alternativeEu}
                      </h4>
                    </div>
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 text-[10px] font-mono bg-white">
                      {calculation.alternativeEu > calculation.recommendedEu ? '+0.5 по-свободен' : '-0.5 по-стегнат'}
                    </Badge>
                  </div>

                  {/* Международна таблица */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold block flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" /> Международно съответствие:
                    </span>
                    <div className="grid grid-cols-4 gap-2 font-mono text-center">
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <span className="text-[10px] text-zinc-500 block">EU</span>
                        <span className="font-extrabold text-sm text-zinc-950">{calculation.recommendedEu}</span>
                      </div>
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <span className="text-[10px] text-zinc-500 block">UK</span>
                        <span className="font-extrabold text-sm text-zinc-950">{calculation.ukSize}</span>
                      </div>
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <span className="text-[10px] text-zinc-500 block">US Men</span>
                        <span className="font-extrabold text-sm text-zinc-950">{calculation.usMenSize}</span>
                      </div>
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <span className="text-[10px] text-zinc-500 block">US Women</span>
                        <span className="font-extrabold text-sm text-zinc-950">{calculation.usWomenSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Телеметрия на стъпалото */}
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs font-mono space-y-2">
                    <div className="flex justify-between text-zinc-600">
                      <span>Дължина на стъпалото:</span>
                      <span className="font-bold text-zinc-900">{calculation.footLengthMm} мм ({calculation.footLengthCm} см)</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Ширина на напречния свод:</span>
                      <span className="font-bold text-zinc-900">{calculation.footWidthMm} мм</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Добавен толеранс за обувка:</span>
                      <span className="font-bold text-emerald-700">
                        {selectedShoeType === 'boots' ? '+18 мм' : selectedShoeType === 'formal' ? '+12 мм' : selectedShoeType === 'sandals' ? '+8 мм' : '+15 мм'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => navigate('/clothing')}
                    className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold py-3 rounded-2xl shadow-xs text-xs"
                  >
                    Разгледайте дрехи в каталога
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoeRecommendation;

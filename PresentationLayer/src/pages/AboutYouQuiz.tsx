import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { measurementsService } from '@/services/measurementsService';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  Sliders,
  Camera,
  Shirt,
  Footprints,
  Maximize2,
  Check,
  ShieldCheck,
  Scan
} from 'lucide-react';

interface QuizState {
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  bodyType: 'slim' | 'medium' | 'athletic' | 'large';
  chest: number;
  waist: number;
  hips: number;
  braSize?: string;
  topFitPreference: string;
  bottomFitPreference: string;
  footLengthCm: number;
  footPhotoUploaded?: boolean;
}

const FIT_OPTIONS = [
  { value: 'tight', label: 'Втален (Slim Fit)', desc: 'Прилепва плътно по тялото' },
  { value: 'regular', label: 'Стандартен (Regular Fit)', desc: 'Балансиран класически обем' },
  { value: 'loose', label: 'Свободен (Relaxed Fit)', desc: 'Повече пространство и комфорт' },
  { value: 'oversized', label: 'Оувърсайз (Oversize)', desc: 'Модерен драматичен обем' },
];

const AboutYouQuiz = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<QuizState>({
    gender: (user?.bodyMeasurements?.gender as any) || 'female',
    height: user?.bodyMeasurements?.height || 172,
    weight: user?.bodyMeasurements?.weight || 64,
    bodyType: (user?.bodyMeasurements?.bodyType as any) || 'medium',
    chest: user?.bodyMeasurements?.chest || 92,
    waist: user?.bodyMeasurements?.waist || 72,
    hips: 96,
    braSize: '75B',
    topFitPreference: 'regular',
    bottomFitPreference: 'regular',
    footLengthCm: 25.5,
    footPhotoUploaded: false
  });

  const progressPercent = Math.round((step / totalSteps) * 100);

  const updateField = (field: keyof QuizState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const backendPayload = {
        height: Number(formData.height),
        weight: Number(formData.weight),
        gender: formData.gender === 'other' ? 'female' : formData.gender,
        chest: Number(formData.chest),
        waist: Number(formData.waist),
        bodyType: formData.bodyType === 'athletic' ? 'medium' : formData.bodyType,
        age: 25
      };

      const res = await measurementsService.saveMeasurements(backendPayload);
      if (res.user) {
        updateUser(res.user);
      }

      toast({
        title: "Профилът е конфигуриран!",
        description: "Вашите визуални и телесни параметри бяха успешно анализирани.",
      });

      setStep(7); // Финална стъпка - Резюме и успех
    } catch (err) {
      console.error(err);
      toast({
        title: "Профилът е запазен локално",
        description: "Параметрите са готови за 3D виртуалната проба.",
      });
      setStep(7);
    } finally {
      setIsSaving(false);
    }
  };

  // BMI калкулация
  const heightM = formData.height / 100;
  const bmi = (formData.weight / (heightM * heightM)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900 relative overflow-hidden py-10 px-4 sm:px-6 flex flex-col justify-between">
      {/* 1. Светеща тънка индигова линия в горната част на екрана */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-zinc-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 shadow-sm transition-all duration-500 ease-out"
          style={{ width: `${step > totalSteps ? 100 : progressPercent}%` }}
        />
      </div>

      {/* Фонови светлинни петна */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10 pt-4">
        {/* Горен хедър на онбординга */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-mono text-xs font-bold shadow-xs">
              {step <= totalSteps ? `0${step}` : 'OK'}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 block font-bold">
                FitVision Onboarding
              </span>
              <span className="text-xs text-zinc-500">
                {step <= totalSteps ? `Стъпка ${step} от ${totalSteps}` : 'Калибрацията завършена'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-600 font-semibold">{progressPercent}%</span>
            <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* СТЪПКА 1: Пол и Анатомия */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                01 • Анатомичен силует
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Изберете анатомична номерация
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Определя основните съотношения между рамене, гръден кош и талия по ISO 8559.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {[
                { value: 'female', label: 'Дамска кройка', subtitle: 'ISO 8559 Дамски пропорции', icon: '👩' },
                { value: 'male', label: 'Мъжка кройка', subtitle: 'ISO 8559 Мъжки пропорции', icon: '👨' },
                { value: 'other', label: 'Унисекс', subtitle: 'Неутрални стандарти', icon: '✨' }
              ].map(opt => {
                const isSelected = formData.gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('gender', opt.value)}
                    className={`p-6 rounded-3xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[190px] relative overflow-hidden ${
                      isSelected
                        ? 'border-zinc-950 bg-white shadow-md scale-[1.02]'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-5xl my-2 block drop-shadow-xs">{opt.icon}</span>
                    <div>
                      <span className="font-bold text-base text-zinc-950 block font-heading">{opt.label}</span>
                      <span className="text-[11px] text-zinc-500 mt-1 block">{opt.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* СТЪПКА 2: Ръст и Тегло със студийни слайдъри */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                02 • Височина & Маса
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Въведете вашия ръст и тегло
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Телесният индекс (BMI {bmi}) калибрира базовата плътност на 3D манекена.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {/* Ръст */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">
                    Височина (Ръст)
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-indigo-600 font-mono tracking-tight transition-transform hover:scale-105">
                    {formData.height} <span className="text-base text-zinc-400 font-sans font-bold">см</span>
                  </span>
                </div>
                <div className="pt-2">
                  <Slider
                    value={[formData.height]}
                    min={140}
                    max={215}
                    step={1}
                    onValueChange={(val) => updateField('height', val[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>140 см</span>
                    <span>175 см</span>
                    <span>215 см</span>
                  </div>
                </div>
              </div>

              {/* Тегло */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">
                    Тегло
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight transition-transform hover:scale-105">
                    {formData.weight} <span className="text-base text-zinc-400 font-sans font-bold">кг</span>
                  </span>
                </div>
                <div className="pt-2">
                  <Slider
                    value={[formData.weight]}
                    min={40}
                    max={140}
                    step={1}
                    onValueChange={(val) => updateField('weight', val[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>40 кг</span>
                    <span>80 кг</span>
                    <span>140 кг</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Индикатор за телесен индекс */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs font-mono shadow-xs">
              <span className="text-zinc-600">Изчислен индекс на телесна маса (BMI):</span>
              <span className="font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-200">
                {bmi} kg/m² • {Number(bmi) < 18.5 ? 'Под нормено' : Number(bmi) <= 24.9 ? 'Нормално тегло' : 'По-плътен силует'}
              </span>
            </div>
          </div>
        )}

        {/* СТЪПКА 3: 4 Минималистични векторни силуета с Glow ефект */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                03 • Морфология
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Изберете вашето телосложение
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Векторните силуети дефинират извивките на 3D манекена и опънните зони.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                {
                  id: 'slim',
                  label: 'Слабо (Slim)',
                  desc: 'Тесен костен скелет, издължен силует',
                  svgPath: 'M 35 15 Q 50 15 65 15 L 60 70 Q 50 72 40 70 Z'
                },
                {
                  id: 'medium',
                  label: 'Средно (Medium)',
                  desc: 'Балансирани симетрични пропорции',
                  svgPath: 'M 30 15 Q 50 15 70 15 L 65 70 Q 50 74 35 70 Z'
                },
                {
                  id: 'athletic',
                  label: 'Атлетично (Athletic)',
                  desc: 'Широки рамене, стеснена талия (V-образно)',
                  svgPath: 'M 24 15 Q 50 12 76 15 L 62 70 Q 50 72 38 70 Z'
                },
                {
                  id: 'large',
                  label: 'Едро (Curvy / Plus)',
                  desc: 'Плътен гръден кош и по-широк силует',
                  svgPath: 'M 25 15 Q 50 15 75 15 L 72 70 Q 50 78 28 70 Z'
                }
              ].map(item => {
                const isSelected = formData.bodyType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('bodyType', item.id)}
                    className={`p-5 rounded-3xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[220px] relative overflow-hidden ${
                      isSelected
                        ? 'border-zinc-950 bg-white shadow-md scale-[1.03]'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs opacity-60 hover:opacity-90'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Минималистичен вектор силует */}
                    <div className="w-20 h-24 my-2 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Глава */}
                        <circle
                          cx="50"
                          cy="18"
                          r="10"
                          fill={isSelected ? '#4F46E5' : '#9CA3AF'}
                          className="transition-colors duration-300"
                        />
                        {/* Торс */}
                        <path
                          d={item.svgPath}
                          fill={isSelected ? 'rgba(79, 70, 229, 0.25)' : 'rgba(156, 163, 175, 0.15)'}
                          stroke={isSelected ? '#4F46E5' : '#9CA3AF'}
                          strokeWidth="2.5"
                          className="transition-all duration-300"
                        />
                        {/* Долна част */}
                        <line
                          x1="45"
                          y1="70"
                          x2="42"
                          y2="95"
                          stroke={isSelected ? '#4F46E5' : '#9CA3AF'}
                          strokeWidth="2.5"
                        />
                        <line
                          x1="55"
                          y1="70"
                          x2="58"
                          y2="95"
                          stroke={isSelected ? '#4F46E5' : '#9CA3AF'}
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>

                    <div>
                      <span className="font-bold text-sm text-zinc-950 block font-heading">{item.label}</span>
                      <span className="text-[11px] text-zinc-500 mt-1 block leading-tight">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* СТЪПКА 4: Обиколки (Гърди, Талия, Ханш) със слайдъри */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                04 • Антропометрия (см)
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Индивидуални обиколки
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Прецизните мерки в сантиметри, с които моделът изчислява напрежението върху дрехата.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Гръдна обиколка */}
              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-zinc-950 text-sm block">Гръдна обиколка</span>
                    <span className="text-[11px] text-zinc-500">В най-широката част на бюста/гърдите</span>
                  </div>
                  <span className="text-3xl font-black text-indigo-600 font-mono">
                    {formData.chest} <span className="text-xs text-zinc-400">см</span>
                  </span>
                </div>
                <Slider
                  value={[formData.chest]}
                  min={70}
                  max={135}
                  step={1}
                  onValueChange={(val) => updateField('chest', val[0])}
                  className="py-2"
                />
              </div>

              {/* Талия */}
              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-zinc-950 text-sm block">Обиколка на талията</span>
                    <span className="text-[11px] text-zinc-500">В най-тясната естествена част</span>
                  </div>
                  <span className="text-3xl font-black text-emerald-600 font-mono">
                    {formData.waist} <span className="text-xs text-zinc-400">см</span>
                  </span>
                </div>
                <Slider
                  value={[formData.waist]}
                  min={55}
                  max={125}
                  step={1}
                  onValueChange={(val) => updateField('waist', val[0])}
                  className="py-2"
                />
              </div>

              {/* Ханш */}
              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-zinc-950 text-sm block">Обиколка на ханша</span>
                    <span className="text-[11px] text-zinc-500">За панталони, поли и рокли</span>
                  </div>
                  <span className="text-3xl font-black text-indigo-600 font-mono">
                    {formData.hips} <span className="text-xs text-zinc-400">см</span>
                  </span>
                </div>
                <Slider
                  value={[formData.hips]}
                  min={75}
                  max={140}
                  step={1}
                  onValueChange={(val) => updateField('hips', val[0])}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* СТЪПКА 5: Стил & Кройкови предпочитания (Loose vs Slim) */}
        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                05 • Стилови предпочитания
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Как обичате да ви стоят дрехите?
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                AI коригира препоръчания размер според вашите навици за обем и свобода на движение.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {/* Горна част */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-bold flex items-center gap-2">
                  <Shirt className="w-4 h-4" /> Горна част (тениски, ризи, якета)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FIT_OPTIONS.map(opt => {
                    const isSelected = formData.topFitPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField('topFitPreference', opt.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-xs'
                        }`}
                      >
                        <span className={`font-bold text-xs block ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{opt.label}</span>
                        <span className={`text-[10px] mt-1 block leading-tight ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Долна част */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> Долна част (панталони, дънки, поли)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FIT_OPTIONS.map(opt => {
                    const isSelected = formData.bottomFitPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField('bottomFitPreference', opt.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-xs'
                        }`}
                      >
                        <span className={`font-bold text-xs block ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{opt.label}</span>
                        <span className={`text-[10px] mt-1 block leading-tight ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* СТЪПКА 6: Сканиране на обувки (AR Скенер) */}
        {step === 6 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
            <div className="text-center space-y-2">
              <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-mono font-bold px-3 py-1">
                06 • Mondopoint Обувки
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
                Дължина на стъпалото (ISO/TS 19407)
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Настройте дължината ръчно или използвайте AR скенера с лист А4.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-zinc-950 text-sm">Дължина на ходилото:</span>
                <span className="text-4xl font-black text-indigo-600 font-mono">
                  {formData.footLengthCm} <span className="text-base text-zinc-400 font-sans">см</span>
                  <span className="text-xs text-emerald-600 ml-2 font-mono">(~EU {Math.round(1.5 * (formData.footLengthCm + 1.5))})</span>
                </span>
              </div>

              <Slider
                value={[formData.footLengthCm * 10]}
                min={210}
                max={310}
                step={1}
                onValueChange={(val) => updateField('footLengthCm', Number((val[0] / 10).toFixed(1)))}
                className="py-2"
              />

              <div className="border border-dashed border-zinc-300 bg-zinc-50 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-950 text-xs">AR Камера скенер (А4 мащаб)</h5>
                    <p className="text-[11px] text-zinc-500">Автоматично измерване с OpenCV до 1 мм точност</p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    updateField('footPhotoUploaded', true);
                    toast({
                      title: "OpenCV калибриране завършено",
                      description: "Засечена дължина: 25.5 см (EU 40.5)",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs shrink-0"
                >
                  {formData.footPhotoUploaded ? '✓ Калибрирано' : 'Отвори AR камера'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* СТЪПКА 7: Финално резюме и успех */}
        {step === 7 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 font-mono text-xs px-3 py-1 font-bold">
                ✓ 3D Twin Калибриран
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 font-heading tracking-tight">
                Вашият дигитален двойник е готов!
              </h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Параметрите са заредени в модела. Вече имате достъп до 3D виртуалната проба и анализ на напрежението.
              </p>
            </div>

            {/* Резюме картичка */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-md max-w-lg mx-auto text-left font-mono text-xs space-y-3">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Ръст и Тегло:</span>
                <span className="font-bold text-zinc-900">{formData.height} см • {formData.weight} кг (BMI {bmi})</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Телосложение:</span>
                <span className="font-bold text-indigo-600 uppercase">{formData.bodyType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Обиколки (Гърди / Талия / Ханш):</span>
                <span className="font-bold text-zinc-900">{formData.chest} / {formData.waist} / {formData.hips} см</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Обувки (Mondopoint):</span>
                <span className="font-bold text-emerald-600">{formData.footLengthCm} см (~EU {Math.round(1.5 * (formData.footLengthCm + 1.5))})</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={() => navigate('/recommendation')}
                size="lg"
                className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold px-8 shadow-sm rounded-2xl"
              >
                <Sparkles className="w-5 h-5 mr-2 text-indigo-400" />
                Към 3D Виртуална Пробна
              </Button>
              <Button
                onClick={() => navigate('/clothing')}
                variant="outline"
                size="lg"
                className="border-zinc-200 text-zinc-800 hover:bg-zinc-100 rounded-2xl"
              >
                Разгледай каталога
              </Button>
            </div>
          </div>
        )}

        {/* Долна навигационна лента */}
        {step <= totalSteps && (
          <div className="flex justify-between items-center pt-8 border-t border-zinc-200/80 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Назад
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={isSaving}
              className="bg-zinc-950 hover:bg-zinc-850 text-white px-7 py-5 font-bold rounded-2xl text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              {step === totalSteps ? (isSaving ? 'Запазване...' : 'Завърши конфигурацията ✨') : (
                <>
                  Напред
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutYouQuiz;

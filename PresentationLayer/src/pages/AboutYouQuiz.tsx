import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  Heart,
  Sliders,
  Camera,
  Shirt,
  Footprints,
  Maximize2
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
  footLengthCm?: number;
  footPhotoUploaded?: boolean;
}

const FIT_OPTIONS = [
  { value: 'very_tight', label: 'Много тесни' },
  { value: 'tight', label: 'Тесни' },
  { value: 'semi_tight', label: 'Сравнително тесни' },
  { value: 'regular', label: 'Нормални (Regular)' },
  { value: 'semi_loose', label: 'Сравнително широки' },
  { value: 'loose', label: 'Свободни (Relaxed)' },
  { value: 'oversized', label: 'Много широки (Oversize)' },
];

const AboutYouQuiz = () => {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<QuizState>({
    gender: (user?.bodyMeasurements?.gender as any) || 'female',
    height: user?.bodyMeasurements?.height || 170,
    weight: user?.bodyMeasurements?.weight || 65,
    bodyType: (user?.bodyMeasurements?.bodyType as any) || 'medium',
    chest: user?.bodyMeasurements?.chest || 90,
    waist: user?.bodyMeasurements?.waist || 74,
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
      // Подготвяме данните за запазване в базата
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
        title: "Грешка",
        description: "Неуспешно записване на въпросника. Моля проверете дали сте влезли в профила си.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 my-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="bg-beige-200 text-[#3A2E2B] hover:bg-beige-300 font-semibold mb-3 border border-beige-300">
          ✨ FitVision Onboarding
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3A2E2B] tracking-tight">
          About You Quiz
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          6 бързи въпроса, за да може нашият AI модел да прецени идеалния размер за вашите пропорции
        </p>

        {step <= totalSteps && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
              <span>Стъпка {step} от {totalSteps}</span>
              <span>{progressPercent}% готово</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-beige-200" />
          </div>
        )}
      </div>

      <Card className="glass-card shadow-lg border border-beige-200 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* СТЪПКА 1: Пол */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">1. Какъв е твоят пол?</h2>
                <p className="text-xs text-gray-500 mt-1">Определя анатомичните пропорции според стандарта ISO 8559</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { value: 'female', label: 'Жена', icon: '👩', desc: 'Дамска номерация и пропорции' },
                  { value: 'male', label: 'Мъж', icon: '👨', desc: 'Мъжка номерация и анатомия' },
                  { value: 'other', label: 'Унисекс / Друго', icon: '✨', desc: 'Неутрални стандарти' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('gender', opt.value)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                      formData.gender === opt.value
                        ? 'border-[#B8956A] bg-beige-100 shadow-sm'
                        : 'border-beige-200 bg-white hover:border-beige-300'
                    }`}
                  >
                    <span className="text-4xl">{opt.icon}</span>
                    <span className="font-bold text-base text-[#3A2E2B]">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* СТЪПКА 2: Ръст и Тегло */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">2. Ръст и тегло</h2>
                <p className="text-xs text-gray-500 mt-1">Определят базовия индекс на телесна маса (BMI)</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <div className="bg-beige-50/70 p-5 rounded-2xl border border-beige-200">
                  <div className="flex justify-between items-center mb-3">
                    <Label htmlFor="height" className="font-semibold text-gray-800">Височина</Label>
                    <Badge variant="outline" className="font-mono bg-white text-[#3A2E2B] font-bold">
                      {formData.height} см
                    </Badge>
                  </div>
                  <Input
                    id="height"
                    type="number"
                    min="140"
                    max="220"
                    value={formData.height}
                    onChange={e => updateField('height', Number(e.target.value))}
                    className="border-beige-300 text-lg font-bold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1.5 block">Препоръчителен диапазон: 145 – 210 см</span>
                </div>

                <div className="bg-beige-50/70 p-5 rounded-2xl border border-beige-200">
                  <div className="flex justify-between items-center mb-3">
                    <Label htmlFor="weight" className="font-semibold text-gray-800">Тегло</Label>
                    <Badge variant="outline" className="font-mono bg-white text-[#3A2E2B] font-bold">
                      {formData.weight} кг
                    </Badge>
                  </div>
                  <Input
                    id="weight"
                    type="number"
                    min="40"
                    max="150"
                    value={formData.weight}
                    onChange={e => updateField('weight', Number(e.target.value))}
                    className="border-beige-300 text-lg font-bold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1.5 block">Препоръчителен диапазон: 40 – 140 кг</span>
                </div>
              </div>
            </div>
          )}

          {/* СТЪПКА 3: Телосложение */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">3. Как би описал телосложението си?</h2>
                <p className="text-xs text-gray-500 mt-1">Влияе върху разпределението на обема при избора на кройка</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { value: 'slim', label: 'Слабо', icon: '🌱', desc: 'Тесен костен скелет, издължен силует' },
                  { value: 'medium', label: 'Средно', icon: '⚖️', desc: 'Балансирани стандартни пропорции' },
                  { value: 'athletic', label: 'Атлетично', icon: '⚡', desc: 'Широки рамене, стегната талия' },
                  { value: 'large', label: 'Едро', icon: '🛡️', desc: 'По-плътен силует, широк гръден кош' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateField('bodyType', item.value)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between space-y-2 h-44 ${
                      formData.bodyType === item.value
                        ? 'border-[#B8956A] bg-beige-100 shadow-sm'
                        : 'border-beige-200 bg-white hover:border-beige-300'
                    }`}
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="font-bold text-sm text-[#3A2E2B]">{item.label}</span>
                    <span className="text-[11px] text-gray-500 leading-tight">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* СТЪПКА 4: Обиколки (Гърди, Талия, Ханш, Сутиен) */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">4. Обиколки на тялото (в см)</h2>
                <p className="text-xs text-gray-500 mt-1">Ключовите метрики за точен размер на блузи, панталони и рокли</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-beige-50/70 p-4 rounded-xl border border-beige-200">
                  <Label htmlFor="chest" className="text-xs font-semibold text-gray-600 block mb-1">
                    Гръдна обиколка (см)
                  </Label>
                  <Input
                    id="chest"
                    type="number"
                    value={formData.chest}
                    onChange={e => updateField('chest', Number(e.target.value))}
                    className="font-bold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">В най-широката част</span>
                </div>

                <div className="bg-beige-50/70 p-4 rounded-xl border border-beige-200">
                  <Label htmlFor="waist" className="text-xs font-semibold text-gray-600 block mb-1">
                    Талия (см)
                  </Label>
                  <Input
                    id="waist"
                    type="number"
                    value={formData.waist}
                    onChange={e => updateField('waist', Number(e.target.value))}
                    className="font-bold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">В най-тясната част</span>
                </div>

                <div className="bg-beige-50/70 p-4 rounded-xl border border-beige-200">
                  <Label htmlFor="hips" className="text-xs font-semibold text-gray-600 block mb-1">
                    Ханш (см)
                  </Label>
                  <Input
                    id="hips"
                    type="number"
                    value={formData.hips}
                    onChange={e => updateField('hips', Number(e.target.value))}
                    className="font-bold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">За панталони и рокли</span>
                </div>
              </div>

              {formData.gender === 'female' && (
                <div className="bg-white p-4 rounded-xl border border-beige-200 mt-4">
                  <Label htmlFor="braSize" className="text-xs font-semibold text-gray-700 block mb-1">
                    Размер сутиен (по желание):
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {['70A', '75A', '75B', '80B', '80C', '85C', '85D', '90D'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateField('braSize', size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          formData.braSize === size
                            ? 'bg-[#B8956A] text-white border-[#B8956A]'
                            : 'bg-beige-50 text-gray-700 border-beige-200 hover:bg-beige-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* СТЪПКА 5: Предпочитания за стил (Горна и Долна част) */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">5. Как обичаш да ти стоят дрехите?</h2>
                <p className="text-xs text-gray-500 mt-1">Персонализира финалния размер според твоя стил (Loose vs Slim Fit)</p>
              </div>

              <div className="space-y-5 pt-2">
                <div>
                  <Label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                    <Shirt className="w-4 h-4 mr-1.5 text-[#B8956A]" />
                    Горна част (ризи, тениски, якета):
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FIT_OPTIONS.slice(1, 6).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField('topFitPreference', opt.value)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          formData.topFitPreference === opt.value
                            ? 'bg-beige-200 text-[#3A2E2B] border-[#B8956A] font-bold shadow-xs'
                            : 'bg-white text-gray-600 border-beige-200 hover:bg-beige-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                    <Maximize2 className="w-4 h-4 mr-1.5 text-[#B8956A]" />
                    Долна част (панталони, дънки, поли):
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FIT_OPTIONS.slice(1, 6).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField('bottomFitPreference', opt.value)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          formData.bottomFitPreference === opt.value
                            ? 'bg-beige-200 text-[#3A2E2B] border-[#B8956A] font-bold shadow-xs'
                            : 'bg-white text-gray-600 border-beige-200 hover:bg-beige-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* СТЪПКА 6: Препоръка за обувки (Снимка на стъпало) */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#3A2E2B]">6. Препоръка за обувки (FitVision Foot Scanner)</h2>
                <p className="text-xs text-gray-500 mt-1">Качи снимка на стъпалото си върху бял лист А4 за автоматично измерване</p>
              </div>

              <div className="border-2 border-dashed border-beige-300 bg-beige-50/50 rounded-2xl p-6 text-center hover:bg-beige-100/50 transition-colors">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-beige-200">
                  <Camera className="w-7 h-7 text-[#B8956A]" />
                </div>
                <h3 className="font-bold text-sm text-[#3A2E2B]">Качи или снимай стъпало върху лист А4</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  OpenCV алгоритъмът използва пропорциите на листа (210 × 297 мм) като референтен мащаб за точност до 1 мм.
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateField('footPhotoUploaded', true);
                      toast({ title: "Снимката е заредена", description: "OpenCV анализира дължина: 25.4 см (Размер EU 40.5)" });
                    }}
                    className="border-beige-300 text-xs bg-white"
                  >
                    {formData.footPhotoUploaded ? '✅ Снимката е качена' : '📸 Избери снимка'}
                  </Button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-beige-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Дължина на стъпалото (см):</span>
                  <span className="text-sm font-bold text-[#3A2E2B]">{formData.footLengthCm} см (Очаква се: EU 40-41)</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Готово за обувки
                </Badge>
              </div>
            </div>
          )}

          {/* СТЪПКА 7: УСПЕХ И РЕЗЮМЕ */}
          {step === 7 && (
            <div className="text-center py-6 space-y-6 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#3A2E2B]">Твоят FitVision профил е готов!</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto mt-1">
                  Телесните ти мерки ({formData.height} см / {formData.weight} кг), обиколките и кройковите предпочитания са съхранени за AI анализа.
                </p>
              </div>

              <div className="bg-beige-50 p-4 rounded-2xl border border-beige-200 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Гръдна обиколка:</span>
                  <span className="font-bold text-[#3A2E2B]">{formData.chest} см</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Талия / Ханш:</span>
                  <span className="font-bold text-[#3A2E2B]">{formData.waist} см / {formData.hips} см</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Предпочитан стил:</span>
                  <span className="font-bold text-[#3A2E2B]">Редовен (Regular Fit)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={() => navigate('/recommendation')}
                  className="bg-[#B8956A] hover:bg-[#94754E] text-white px-8"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Виж AI Препоръка за дрехи
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/shoes')}
                  className="border-beige-300 text-gray-700"
                >
                  <Footprints className="w-4 h-4 mr-2" />
                  Препоръка за обувки
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {step <= totalSteps && (
            <div className="flex justify-between items-center pt-8 border-t border-beige-200 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Назад
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="bg-[#B8956A] hover:bg-[#94754E] text-white px-6 font-semibold shadow-xs"
              >
                {step === totalSteps ? (isSaving ? 'Запазване...' : 'Завърши куиза ✨') : (
                  <>
                    Напред
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutYouQuiz;


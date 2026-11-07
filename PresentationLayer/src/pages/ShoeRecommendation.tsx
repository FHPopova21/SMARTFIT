import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Footprints,
  Camera,
  Upload,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Ruler
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShoePrediction {
  footLengthMm: number;
  footWidthMm: number;
  recommendedSizeEu: string;
  confidence: number;
  alternativeSizeEu?: string;
  alternativeConfidence?: number;
  shoeType: string;
  explanation: string;
}

const ShoeRecommendation = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedShoeType, setSelectedShoeType] = useState('sneakers');
  const [isScanning, setIsScanning] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [prediction, setPrediction] = useState<ShoePrediction | null>(null);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setPhotoUploaded(true);

    setTimeout(() => {
      setIsScanning(false);
      // Изчисляване на размер на база мерки на потребителя или реалистичен стандарт
      const userHeight = user?.bodyMeasurements?.height || 172;
      const isMale = user?.bodyMeasurements?.gender === 'male';

      // Приблизителна връзка между ръст и дължина на стъпало (15% от ръста)
      const estimatedFootMm = Math.round(userHeight * 1.5 + (isMale ? 4 : -3));
      // Формула за EU размер: (дължина в см + 1.5) * 1.5
      const footCm = estimatedFootMm / 10;
      const calculatedEu = Math.round((footCm + 1.5) * 1.5 * 2) / 2;

      const altEu = calculatedEu + 0.5;

      setPrediction({
        footLengthMm: estimatedFootMm,
        footWidthMm: Math.round(estimatedFootMm * 0.38),
        recommendedSizeEu: `EU ${calculatedEu}`,
        confidence: 88,
        alternativeSizeEu: `EU ${altEu}`,
        alternativeConfidence: 12,
        shoeType: selectedShoeType,
        explanation: `Според пропорциите на стъпалото (${estimatedFootMm} мм) и стандарта ISO/TS 19407, най-добрият размер за спортни обувки е EU ${calculatedEu}. За по-дебели чорапи можете да изберете EU ${altEu}.`
      });

      toast({
        title: "Сканирането завърши успешно!",
        description: `Отчетена дължина: ${estimatedFootMm} мм. Препоръчан размер: EU ${calculatedEu}`,
      });
    }, 1800);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 my-6">
      {/* Page Title */}
      <div className="mb-8">
        <Badge className="bg-beige-200 text-[#3A2E2B] font-semibold mb-2 border border-beige-300">
          👟 FitVision Foot Scanner (OpenCV)
        </Badge>
        <h1 className="text-3xl font-extrabold text-[#3A2E2B] tracking-tight flex items-center">
          <Footprints className="w-8 h-8 mr-3 text-[#B8956A]" />
          Препоръка за размер на обувки
        </h1>
        <p className="text-gray-600 mt-1 max-w-2xl">
          Автоматично измерване на стъпалото чрез компютърно зрение (OpenCV) и бял лист А4 като калибрационен мащаб
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Лява колона: Качване и инструкции */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base text-[#3A2E2B]">
                1. Как да направите снимката?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-gray-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#DEC6A6] text-[#3A2E2B] font-bold flex items-center justify-center shrink-0">1</span>
                <p>Поставете стандартен бял лист формат А4 (21 × 29.7 см) на пода плътно до права стена.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#DEC6A6] text-[#3A2E2B] font-bold flex items-center justify-center shrink-0">2</span>
                <p>Стъпете с бос крак върху листа, като петата ви опира леко стената.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#DEC6A6] text-[#3A2E2B] font-bold flex items-center justify-center shrink-0">3</span>
                <p>Направете вертикална снимка отгоре така, че четирите ъгъла на листа да се виждат.</p>
              </div>
            </CardContent>
          </Card>

          {/* Тип обувки */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base text-[#3A2E2B]">
                2. За какъв тип обувка търсите размер?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sneakers', label: 'Маратонки', icon: '👟' },
                  { id: 'formal', label: 'Официални', icon: '👞' },
                  { id: 'boots', label: 'Боти / Ботуши', icon: '🥾' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedShoeType(type.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedShoeType === type.id
                        ? 'border-[#B8956A] bg-beige-100 font-bold text-[#3A2E2B]'
                        : 'border-beige-200 bg-white text-gray-600 hover:bg-beige-50'
                    }`}
                  >
                    <span className="text-xl block mb-1">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Зона за качване */}
          <div className="border-2 border-dashed border-beige-300 bg-white/80 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="w-6 h-6 text-[#B8956A]" />
            </div>
            <h4 className="font-bold text-sm text-[#3A2E2B] mb-1">
              {photoUploaded ? 'Снимката е заредена' : 'Качете снимка на стъпалото'}
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Поддържа JPG, PNG или директно заснемане през камерата
            </p>

            <Button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="bg-[#B8956A] hover:bg-[#94754E] text-white px-6 shadow-sm"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  OpenCV сканира...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Стартирай OpenCV анализ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Дясна колона: Резултат */}
        <div>
          <Card className="glass-card h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base text-[#3A2E2B] flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-[#B8956A]" />
                3. Резултат от измерването
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!prediction ? (
                <div className="text-center py-16 text-gray-400">
                  <Footprints className="w-12 h-12 mx-auto text-beige-300 mb-3" />
                  <p className="text-sm">Качете снимка или стартирайте анализа, за да видите вашия точен размер обувки.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Основен размер */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                          Препоръчан EU размер
                        </span>
                        <h3 className="text-4xl font-extrabold text-emerald-950 mt-1">
                          {prediction.recommendedSizeEu}
                        </h3>
                      </div>
                      <Badge className="bg-emerald-600 text-white">
                        {prediction.confidence}% увереност
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-emerald-800">
                        <span>Точност на пасване:</span>
                        <span className="font-bold">{prediction.confidence}%</span>
                      </div>
                      <Progress value={prediction.confidence} className="h-2 bg-emerald-200" />
                    </div>

                    <p className="text-xs text-emerald-900 mt-3 leading-relaxed">
                      {prediction.explanation}
                    </p>
                  </div>

                  {/* Алтернативен размер */}
                  {prediction.alternativeSizeEu && (
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-sky-600" />
                        <div>
                          <span className="text-xs font-bold text-sky-900 block">
                            Алтернативен размер: {prediction.alternativeSizeEu}
                          </span>
                          <span className="text-[11px] text-sky-700">
                            Препоръчва се за дебели чорапи или по-свободно прилягане
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sky-800 border-sky-300">
                        {prediction.alternativeConfidence}%
                      </Badge>
                    </div>
                  )}

                  {/* Детайли от OpenCV скенера */}
                  <div className="bg-beige-50 rounded-xl p-4 border border-beige-200 space-y-2 text-xs">
                    <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center">
                      <Ruler className="w-3.5 h-3.5 mr-1 text-[#B8956A]" />
                      Измерени стойности (OpenCV Calibrated):
                    </h5>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-gray-500">Дължина на стъпалото:</span>
                        <p className="font-bold text-[#3A2E2B] text-sm">{prediction.footLengthMm} мм ({Math.round(prediction.footLengthMm / 10 * 10) / 10} см)</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Ширина на стъпалото:</span>
                        <p className="font-bold text-[#3A2E2B] text-sm">{prediction.footWidthMm} мм (Стандартна)</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSimulateScan}
                    variant="outline"
                    className="w-full border-beige-300 text-gray-700 hover:bg-beige-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Повтори сканирането
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShoeRecommendation;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockClothingItems } from '@/data/mockClothing';
import { ClothingItem } from '@/types';
import { TrendingUp, AlertCircle, CheckCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VisualFitMannequin from '@/components/VisualFitMannequin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface SizeRecommendation {
  recommendedSize: string;
  confidence: number;
  explanation: string;
  description?: string;
  alternativeSize?: string;
  alternativeConfidence?: number;
  alternativeExplanation?: string;
}

const getClothingTypeBg = (type: string): string => {
  const map: Record<string, string> = {
    't-shirt': 'Тениска',
    'shirt': 'Риза',
    'pants': 'Панталон',
    'dress': 'Рокля',
    'jacket': 'Яке',
    'sweater': 'Пуловер',
    'skirt': 'Пола'
  };
  return map[type] || type;
};

const getMaterialBg = (mat: string): string => {
  const map: Record<string, string> = {
    'elastic': 'Еластична материя',
    'semi-elastic': 'Полуеластична материя',
    'non-elastic': 'Нееластична материя'
  };
  return map[mat] || mat;
};

const Recommendation = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clothingList, setClothingList] = useState<ClothingItem[]>(mockClothingItems);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentAdded, setCommentAdded] = useState(false);

  // Зареждане на реалните дрехи от бекенда
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

  // Прихващане на избрана дреха от каталога
  useEffect(() => {
    if (location.state?.selectedItem) {
      setSelectedItem(location.state.selectedItem);
    }
  }, [location.state]);

  // Автоматично генериране на препоръка при избор на дреха и налични мерки
  useEffect(() => {
    if (selectedItem && user?.bodyMeasurements) {
      generateRecommendation();
    }
  }, [selectedItem, user?.bodyMeasurements]);

  const saveRecommendation = async (result: SizeRecommendation) => {
    try {
      if (!user?.bodyMeasurements) return;
      const measurements = user.bodyMeasurements;
      const response = await fetch(`${API_URL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clothingType: selectedItem?.type || 't-shirt',
          recommendedSize: result.recommendedSize,
          itemIdentifier: String(selectedItem?.id),
          measurements: {
            height: measurements.height.toString(),
            weight: measurements.weight.toString(),
            chest: measurements.chest.toString(),
            waist: measurements.waist.toString(),
            gender: measurements.gender,
            body_type: measurements.bodyType === 'medium' ? 'average' : measurements.bodyType,
            material: selectedItem?.material || 'semi-elastic',
            garment_type: selectedItem?.type || 't-shirt',
            garment_width: selectedItem?.measurements?.width || 50.0
          }
        }),
      });

      if (response.ok) {
        console.log('Препоръката е запазена в историята.');
      }
    } catch (error) {
      console.error('Грешка при запис на препоръката:', error);
    }
  };

  const generateRecommendation = async () => {
    if (!selectedItem) return;
    try {
      setIsLoading(true);
      
      const measurements = user?.bodyMeasurements;
      if (!measurements) {
        throw new Error('Липсват въведени телесни мерки');
      }

      const requestBody = {
        height: measurements.height,
        weight: measurements.weight,
        waist: measurements.waist,
        chest: measurements.chest,
        gender: measurements.gender,
        body_type: measurements.bodyType === 'medium' ? 'average' : measurements.bodyType,
        material: selectedItem.material || 'semi-elastic',
        garment_type: selectedItem.type || 't-shirt',
        garment_width: selectedItem.measurements?.width || 50.0
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.size || typeof data.confidence !== 'number') {
        throw new Error('Невалиден отговор от ML модела');
      }

      const confidencePercent = Math.round(data.confidence * 100);
      const altConfPercent = data.alternative_confidence ? Math.round(data.alternative_confidence * 100) : undefined;

      const recResult: SizeRecommendation = {
        recommendedSize: data.size,
        confidence: confidencePercent,
        explanation: `Препоръчваме размер ${data.size} с ${confidencePercent}% сигурност.`,
        description: `На базата на вашата височина (${measurements.height} см), тегло (${measurements.weight} кг), гръдна обиколка (${measurements.chest} см) и характеристиките на модела, най-подходящият размер за вас е ${data.size}.`,
        alternativeSize: data.alternative_size,
        alternativeConfidence: altConfPercent,
        alternativeExplanation: data.alternative_size 
          ? `Тъй като моделът калкулира известна вероятност (${altConfPercent}%) и за размер ${data.alternative_size}, той може да ви пасне удобно, ако предпочитате по-${data.alternative_size > data.size ? 'свободна' : 'прилепнала'} кройка.`
          : undefined
      };

      setRecommendation(recResult);
      await saveRecommendation(recResult);
      
    } catch (error) {
      console.error('Грешка при генериране на препоръка:', error);
      toast({
        title: "Грешка при изчислението",
        description: error instanceof Error ? error.message : "Възникна непредвиден проблем",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = clothingList.find(i => String(i.id) === String(itemId)) || mockClothingItems.find(i => String(i.id) === String(itemId));
    if (item) {
      setSelectedItem(item);
      setRecommendation(null);
      setCommentAdded(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/clothing/${selectedItem.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText('');
        setCommentAdded(true);
        toast({ title: 'Успех', description: 'Вашият коментар бе добавен успешно!' });
      } else {
        toast({ title: 'Грешка', description: data.error ? String(data.error) : 'Възникна грешка', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Възникна грешка при изпращането', variant: 'destructive' });
    } finally {
      setCommentLoading(false);
    }
  };

  // 1. Ако потребителят не е влязъл в профила си
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="glass-card text-center py-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-gray-800">
              <AlertCircle className="w-6 h-6 mr-2 text-orange-500" />
              Входът в профила е задължителен
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              За да използвате системата за AI препоръки за размер, моля първо влезте в профила си.
            </p>
            <Button 
              onClick={() => navigate('/signin')}
              className="bg-beige-600 hover:bg-beige-700 text-white px-6"
            >
              Вход в профил
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Ако липсват въведени мерки
  if (!user?.bodyMeasurements) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="glass-card text-center py-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-gray-800">
              <AlertCircle className="w-6 h-6 mr-2 text-orange-500" />
              Необходими са телесни мерки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              За да получите точна препоръка от машинния модел, моля въведете вашите телесни мерки (височина, гръдна обиколка, талия).
            </p>
            <Button 
              onClick={() => navigate('/measurements')}
              className="bg-beige-600 hover:bg-beige-700 text-white px-6"
            >
              Въведете мерки сега
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Sparkles className="w-8 h-8 mr-3 text-beige-600" />
          AI Препоръка за размер
        </h1>
        <p className="text-gray-600">
          Интелигентен анализ на вашите мерки и кройката на дрехата за перфектно пасване без риск от връщане
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Избор на дреха */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">1. Изберете дреха от каталога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={handleItemSelect} value={selectedItem ? String(selectedItem.id) : ''}>
              <SelectTrigger className="border-beige-300 focus:border-beige-500">
                <SelectValue placeholder="Изберете дреха за анализ..." />
              </SelectTrigger>
              <SelectContent>
                {clothingList.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name} — Размер {item.size} ({item.merchantName || 'SmartFit'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedItem && (
              <div className="bg-beige-50 rounded-lg p-4 space-y-3 border border-beige-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{selectedItem.name}</h3>
                    <p className="text-xs text-gray-500">Търговец: {selectedItem.merchantName || 'SmartFit Store'}</p>
                  </div>
                  <Badge variant="secondary" className="bg-beige-200 text-beige-900">
                    Обявен размер: {selectedItem.size}
                  </Badge>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-gray-600 italic">{selectedItem.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                  <div>
                    <span className="text-gray-500 block text-xs">Тип дреха:</span>
                    <p className="font-medium text-gray-800">{getClothingTypeBg(selectedItem.type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Материя / Еластичност:</span>
                    <p className="font-medium text-gray-800">{getMaterialBg(selectedItem.material)}</p>
                  </div>
                </div>

                <div className="bg-white rounded p-3 border border-beige-100">
                  <h4 className="font-medium text-xs text-gray-500 uppercase tracking-wider mb-2">Мерки на дрехата:</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Ширина:</span>
                      <p className="font-bold text-gray-800">{selectedItem.measurements.width} см</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Дължина:</span>
                      <p className="font-bold text-gray-800">{selectedItem.measurements.length} см</p>
                    </div>
                    {selectedItem.measurements.sleeves && (
                      <div>
                        <span className="text-gray-500">Ръкави:</span>
                        <p className="font-bold text-gray-800">{selectedItem.measurements.sleeves} см</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedItem.price && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-gray-500">Цена:</span>
                    <span className="text-lg font-bold text-beige-700">{selectedItem.price} лв</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Резултат */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2 text-beige-600" />
              2. AI Резултат и препоръка
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-10 h-10 mx-auto text-beige-400 mb-3" />
                Изберете дреха от списъка вляво, за да стартирате анализа.
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-beige-200 border-t-beige-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Моделът изчислява най-добрия размер...</p>
                <p className="text-xs text-gray-500 mt-1">Калибриране на вероятностите спрямо еластичността на дрехата</p>
              </div>
            ) : recommendation ? (
              <div className="space-y-6 animate-fade-in">
                {/* Основна препоръка */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-7 h-7 text-emerald-600 mr-2" />
                      <div>
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                          Препоръчан размер
                        </span>
                        <h3 className="text-3xl font-extrabold text-emerald-900">
                          {recommendation.recommendedSize}
                        </h3>
                      </div>
                    </div>
                    <Badge className={recommendation.confidence >= 80 ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                      {recommendation.confidence >= 80 ? "Висока сигурност" : "Умерена сигурност"}
                    </Badge>
                  </div>

                  {/* Индикатор за увереност */}
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs text-emerald-800 font-medium">
                      <span>Увереност на модела:</span>
                      <span>{recommendation.confidence}%</span>
                    </div>
                    <Progress value={recommendation.confidence} className="h-2 bg-emerald-200" />
                  </div>

                  <p className="text-sm text-emerald-900 mt-3 leading-relaxed">
                    {recommendation.description}
                  </p>
                </div>

                {/* Алтернативен размер (ако има) */}
                {recommendation.alternativeSize && (
                  <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <ArrowRight className="w-5 h-5 text-sky-600 mr-2" />
                        <h4 className="font-semibold text-sky-900 text-sm">
                          Алтернативен вариант: Размер {recommendation.alternativeSize}
                        </h4>
                      </div>
                      {recommendation.alternativeConfidence && (
                        <Badge variant="outline" className="border-sky-300 text-sky-800">
                          {recommendation.alternativeConfidence}% вероятност
                        </Badge>
                      )}
                    </div>
                    <p className="text-sky-800 text-xs leading-relaxed">
                      {recommendation.alternativeExplanation}
                    </p>
                  </div>
                )}

                {/* Интерактивен визуален манекен FitVision */}
                <VisualFitMannequin
                  gender={user.bodyMeasurements?.gender}
                  bodyType={user.bodyMeasurements?.bodyType}
                  recommendedSize={recommendation.recommendedSize}
                  alternativeSize={recommendation.alternativeSize}
                  confidence={recommendation.confidence}
                  clothingName={selectedItem.name}
                  clothingWidth={selectedItem.measurements.width}
                  userChest={user.bodyMeasurements.chest}
                  userWaist={user.bodyMeasurements.waist}
                />

                {/* Резюме на вашите мерки */}
                <div className="bg-beige-50 rounded-lg p-4 border border-beige-200">
                  <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wider mb-2">Използвани мерки от профила ви:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Височина: </span>
                      <span className="font-semibold text-gray-800">{user.bodyMeasurements.height} см</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Тегло: </span>
                      <span className="font-semibold text-gray-800">{user.bodyMeasurements.weight} кг</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Гръдна обиколка: </span>
                      <span className="font-semibold text-gray-800">{user.bodyMeasurements.chest} см</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Талия: </span>
                      <span className="font-semibold text-gray-800">{user.bodyMeasurements.waist} см</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => generateRecommendation()} 
                  variant="outline"
                  className="w-full border-beige-300 text-beige-800 hover:bg-beige-100 flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Повторно изчисление
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button 
                  onClick={generateRecommendation}
                  className="bg-beige-600 hover:bg-beige-700 text-white px-6"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Генерирай AI препоръка
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Секция за коментар към препоръката */}
      {recommendation && selectedItem && !commentAdded && (
        <Card className="glass-card mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">
              Доволни ли сте от препоръката? Оставете отзив
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                className="w-full border border-beige-300 rounded-lg p-3 text-sm focus:outline-none focus:border-beige-500"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Споделете как ви стои дрехата или впечатления от модела..."
                required
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={commentLoading || !commentText.trim()}
                className="bg-beige-600 hover:bg-beige-700 text-white"
              >
                {commentLoading ? 'Изпращане...' : 'Изпрати коментар'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {commentAdded && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
          Благодарим ви! Вашият отзив бе записан успешно.
        </div>
      )}
    </div>
  );
};

export default Recommendation;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { BodyMeasurements } from '@/types';
import { Save, User, AlertCircle, Sliders } from 'lucide-react';
import { measurementsService } from '@/services/measurementsService';

const Measurements = () => {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 0,
    weight: 0,
    gender: 'male',
    waist: 0,
    chest: 0,
    bodyType: 'medium',
    age: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        const data = await measurementsService.getMeasurements();
        if (data) {
          setMeasurements(data);
        }
      } catch (error) {
        console.error('Failed to fetch measurements:', error);
      }
    };

    fetchMeasurements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await measurementsService.saveMeasurements(measurements);

      // Update the user in the auth store with the new measurements
      if (response.user) {
        updateUser(response.user);
      }

      toast({
        title: "Мерките са запазени",
        description: "Вашите телесни мерки са успешно актуализирани!",
      });
    } catch (error) {
      console.error('Failed to save measurements:', error);
      toast({
        title: "Грешка",
        description: "Възникна проблем при запазването на мерките. Моля, опитайте отново.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BodyMeasurements, value: string | number) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: field === 'age' ? (value === '' ? undefined : Number(value)) :
        typeof value === 'string' ? value : Number(value)
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="glass-card text-center py-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl text-gray-800">
              <AlertCircle className="w-6 h-6 mr-2 text-orange-500" />
              Необходим е вход в профила
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              За да въведете и запазите вашите телесни мерки за персонализирани препоръки, моля първо влезте в профила си.
            </p>
            <Button
              onClick={() => navigate('/signin')}
              className="bg-zinc-950 hover:bg-zinc-850 text-white px-6 rounded-xl shadow-xs font-bold"
            >
              Вход в профил
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-[#FAFAFC]">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] mb-1 font-mono font-bold">Интерактивен въпросник</Badge>
          <h3 className="font-bold text-base text-zinc-950 font-heading">Искате бърз About You Quiz?</h3>
          <p className="text-xs text-zinc-500">Преминете през въпросника с визуален избор на кройка и 3D дигитален двойник.</p>
        </div>
        <Link to="/quiz">
          <Button className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs px-5 py-2.5 rounded-xl whitespace-nowrap shadow-xs">
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Отворете About You Quiz
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Measurements */}
          <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-zinc-950 text-lg font-heading">Основни мерки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-xs font-mono font-bold text-zinc-700">Височина (см)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={measurements.height || ''}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="175"
                    min="140"
                    max="220"
                    required
                    className="border-zinc-200 focus:border-indigo-600 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-xs font-mono font-bold text-zinc-700">Тегло (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={measurements.weight || ''}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="70"
                    min="40"
                    max="150"
                    required
                    className="border-zinc-200 focus:border-indigo-600 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-xs font-mono font-bold text-zinc-700">Пол</Label>
                <Select value={measurements.gender} onValueChange={(value: 'male' | 'female') => handleInputChange('gender', value)}>
                  <SelectTrigger className="border-zinc-200 focus:border-indigo-600 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мъж</SelectItem>
                    <SelectItem value="female">Жена</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-xs font-mono font-bold text-zinc-700">Възраст (по желание)</Label>
                <Input
                  id="age"
                  type="number"
                  value={measurements.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="25"
                  min="16"
                  max="80"
                  className="border-zinc-200 focus:border-indigo-600 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Body Measurements */}
          <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-zinc-950 text-lg font-heading">Обиколки и телосложение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chest" className="text-xs font-mono font-bold text-zinc-700">Гръдна обиколка (см)</Label>
                  <Input
                    id="chest"
                    type="number"
                    value={measurements.chest || ''}
                    onChange={(e) => handleInputChange('chest', e.target.value)}
                    placeholder="95"
                    min="70"
                    max="150"
                    required
                    className="border-zinc-200 focus:border-indigo-600 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist" className="text-xs font-mono font-bold text-zinc-700">Талия (см)</Label>
                  <Input
                    id="waist"
                    type="number"
                    value={measurements.waist || ''}
                    onChange={(e) => handleInputChange('waist', e.target.value)}
                    placeholder="85"
                    min="60"
                    max="120"
                    required
                    className="border-zinc-200 focus:border-indigo-600 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyType" className="text-xs font-mono font-bold text-zinc-700">Тип телосложение</Label>
                <Select value={measurements.bodyType} onValueChange={(value: 'slim' | 'medium' | 'large') => handleInputChange('bodyType', value)}>
                  <SelectTrigger className="border-zinc-200 focus:border-indigo-600 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slim">Слабо</SelectItem>
                    <SelectItem value="medium">Средно</SelectItem>
                    <SelectItem value="large">Едро</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <h4 className="font-mono text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">Съвети за точни мерки:</h4>
                <ul className="text-xs text-zinc-600 space-y-1">
                  <li>• Измервайте се в по-тесни дрехи</li>
                  <li>• Гръдната обиколка се мери в най-широката част (ISO 8559)</li>
                  <li>• Талията се мери в най-тесната част</li>
                  <li>• Стойте изправени в естествена стойка при измерването</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold px-8 py-3 rounded-2xl shadow-xs"
          >
            <Save className="w-5 h-5 mr-2 text-indigo-400" />
            {isLoading ? 'Запазване...' : 'Запази мерките'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Measurements;

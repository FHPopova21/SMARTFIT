import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  History,
  Ruler,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  AlertTriangle,
  Lock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface RecommendationHistory {
  id: number;
  date: string;
  clothingType: string;
  recommendedSize: string;
  measurements: {
    height: string;
    weight: string;
    chest: string;
    waist: string;
    bodyType: string;
  };
  relatedRecommendations?: RecommendationHistory[];
}

const Profile = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationHistory[]>([]);
  const { toast } = useToast();
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const navigate = useNavigate();

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await authService.getUserRecommendations();
        setRecommendationHistory(data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchHistory();
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null;
  }

  const handleExportData = () => {
    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      anthropometrics: user.bodyMeasurements,
      history: recommendationHistory,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitvision-data-${user.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'GDPR Експортът е готов', description: 'Вашите данни бяха изтеглени като JSON файл.' });
  };

  const renderRecommendationDetails = (recommendation: RecommendationHistory) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Препоръчан размер</label>
        <p className="text-xl font-black text-indigo-600 mt-0.5">{recommendation.recommendedSize}</p>
      </div>
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Височина</label>
        <p className="text-zinc-900 font-bold text-sm mt-1">{recommendation.measurements.height} см</p>
      </div>
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Тегло</label>
        <p className="text-zinc-900 font-bold text-sm mt-1">{recommendation.measurements.weight} кг</p>
      </div>
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Гръдна обиколка</label>
        <p className="text-zinc-900 font-bold text-sm mt-1">{recommendation.measurements.chest} см</p>
      </div>
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Талия</label>
        <p className="text-zinc-900 font-bold text-sm mt-1">{recommendation.measurements.waist} см</p>
      </div>
      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Телосложение</label>
        <p className="text-zinc-900 font-bold text-sm mt-1 uppercase">{recommendation.measurements.bodyType}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80">
          <h1 className="text-3xl font-black text-zinc-950 font-heading tracking-tight flex items-center">
            <User className="w-8 h-8 mr-3 text-indigo-600" />
            Моят FitVision Профил
          </h1>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono font-bold px-3 py-1">
            {user.role === 'seller' ? 'Търговски акаунт' : 'Потребителски профил'}
          </Badge>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-zinc-100 border border-zinc-200 p-1 rounded-2xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="info" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
              Информация
            </TabsTrigger>
            <TabsTrigger value="measurements" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
              Телесни мерки
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
              История
            </TabsTrigger>
            <TabsTrigger value="password" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs">
              Смяна на парола
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-zinc-950 font-heading">Лична информация</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                  <label className="text-xs font-mono text-zinc-500 block font-bold">Потребителско име</label>
                  <p className="text-base font-bold text-zinc-950 mt-1">{user.username}</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                  <label className="text-xs font-mono text-zinc-500 block font-bold">Имейл адрес</label>
                  <p className="text-base font-bold text-zinc-950 mt-1">{user.email || '—'}</p>
                </div>
              </div>

              {/* GDPR Експорт */}
              <div className="pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Право на преносимост (GDPR Article 20)</h4>
                  <p className="text-xs text-zinc-500">Изтеглете копие на цялата съхранявана за вас информация като структуриран JSON файл.</p>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 bg-white text-zinc-800 hover:text-zinc-950 hover:bg-zinc-50 text-xs font-bold rounded-xl shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Експорт на данни (JSON)
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="measurements">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-950 font-heading flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-indigo-600" />
                  Телесни мерки (ISO 8559-1)
                </h2>
                <Link to="/quiz">
                  <Button size="sm" className="bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-bold rounded-xl shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                    Рекалибрирай чрез Quiz
                  </Button>
                </Link>
              </div>

              {user.bodyMeasurements ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                      <span className="text-zinc-500 block">Височина:</span>
                      <p className="text-lg font-black text-zinc-950 mt-0.5">{user.bodyMeasurements.height} см</p>
                    </div>
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                      <span className="text-zinc-500 block">Тегло:</span>
                      <p className="text-lg font-black text-emerald-600 mt-0.5">{user.bodyMeasurements.weight} кг</p>
                    </div>
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                      <span className="text-zinc-500 block">Гръдна обиколка:</span>
                      <p className="text-lg font-black text-indigo-600 mt-0.5">{user.bodyMeasurements.chest} см</p>
                    </div>
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                      <span className="text-zinc-500 block">Талия:</span>
                      <p className="text-lg font-black text-zinc-950 mt-0.5">{user.bodyMeasurements.waist} см</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-zinc-500 text-sm">Все още не сте въвели вашите телесни мерки</p>
                  <Link to="/quiz">
                    <Button className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold rounded-xl text-xs shadow-xs">
                      Стартирай About You Quiz
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {recommendationHistory.length > 0 ? (
                recommendationHistory.map((rec) => (
                  <Collapsible
                    key={rec.id}
                    open={expandedItems.includes(rec.id)}
                    onOpenChange={() => toggleExpand(rec.id)}
                  >
                    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-950 text-base font-heading">{rec.clothingType}</span>
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono font-bold">
                            {rec.recommendedSize}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-zinc-400 font-mono">
                            {new Date(rec.date).toLocaleDateString('bg-BG')}
                          </span>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 p-1 rounded-lg">
                              {expandedItems.includes(rec.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      {renderRecommendationDetails(rec)}
                    </div>
                  </Collapsible>
                ))
              ) : (
                <div className="bg-white border border-zinc-200/80 rounded-2xl text-center py-12 shadow-xs">
                  <p className="text-zinc-400 text-sm font-medium">Все още нямате запазени предишни препоръки.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="password">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-6 max-w-lg">
              <h2 className="text-lg font-bold text-zinc-950 font-heading">Смяна на парола</h2>
              <ChangePasswordForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Успех', description: data.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast({ title: 'Грешка', description: data.error || 'Възникна грешка', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Възникна грешка при връзка със сървъра', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-zinc-700 font-bold">Стара парола</label>
        <Input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          required
          className="bg-white border-zinc-200 text-zinc-900 rounded-xl text-xs h-10 focus:border-indigo-600"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-zinc-700 font-bold">Нова парола</label>
        <Input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          className="bg-white border-zinc-200 text-zinc-900 rounded-xl text-xs h-10 focus:border-indigo-600"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-zinc-700 font-bold">Потвърди новата парола</label>
        <Input
          type="password"
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
          required
          className="bg-white border-zinc-200 text-zinc-900 rounded-xl text-xs h-10 focus:border-indigo-600"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
        disabled={loading}
      >
        {loading ? 'Смяна...' : 'Смени паролата'}
      </Button>
    </form>
  );
};

export default Profile;

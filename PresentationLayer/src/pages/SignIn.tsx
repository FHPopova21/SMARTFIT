import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Lock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ username, password });
      toast({
        title: "Успешен вход",
        description: "Добре дошли във FitVision!",
      });
      // Role-based redirect
      const user = useAuthStore.getState().user;
      if (user?.role === 'seller') {
        navigate('/seller', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast({
        title: "Грешка при вход",
        description: "Невалидно потребителско име или парола",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAFAFC]">
      <div className="w-full max-w-4xl grid md:grid-cols-12 bg-white rounded-3xl border border-zinc-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Лява половина: Моден визуален бранд банер (5 от 12) */}
        <div className="hidden md:flex md:col-span-5 relative bg-zinc-950 text-white p-8 flex-col justify-between overflow-hidden">
          {/* Фоново изображение с тъмен филтър */}
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
            alt="Fashion Editorial"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

          {/* Горен бранд акцент */}
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/20 text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              AI Fashion Fitting
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white pt-2 font-heading">
              Fit<span className="text-indigo-400">Vision</span>
            </h2>
          </div>

          {/* Долно послание */}
          <div className="relative z-10 space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              „Интелигентната мода започва с перфектното прилягане. Без връщане на поръчки, без съмнения.“
            </p>
            <div className="pt-2 border-t border-white/15 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Калибрирана ISO 8559 антропометрия</span>
            </div>
          </div>
        </div>

        {/* Дясна половина: Форма за вход (7 от 12) */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-6">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold mb-1.5">
                Клиентски & Партньорски достъп
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight font-heading">
                Вход във FitVision
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Въведете вашите данни за достъп до профила и 3D размерните анализи
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-mono font-bold text-zinc-700">
                  Потребителско име
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-9 bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl"
                    placeholder="Въведете потребителско име"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-mono font-bold text-zinc-700">
                    Парола
                  </Label>
                  <Link to="/auth/forgot-password" className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold font-mono">
                    Забравена парола?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl"
                    placeholder="Въведете парола"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Влизане...' : 'Вход в профила'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Бързи демо профили за презентация */}
            <div className="mt-5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5 font-mono">
                Демо профили за бърз тест (1 клик):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('testuser', 'password123')}
                  className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-mono font-medium transition-colors shadow-2xs"
                >
                  👤 Купувач: testuser
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('fashion_store_bg', 'password123')}
                  className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-mono font-medium transition-colors shadow-2xs"
                >
                  🧵 Търговец: fashion_store_bg
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'Admin123!')}
                  className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-mono font-medium transition-colors shadow-2xs"
                >
                  🛡️ Админ: admin
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-600">
              Нямате акаунт?{' '}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold font-mono">
                Регистрирайте се безплатно
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

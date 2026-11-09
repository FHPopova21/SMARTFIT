import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, User, Mail, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password.length < 6) {
        throw new Error('Паролата трябва да е поне 6 символа');
      }
      
      if (!email.includes('@')) {
        throw new Error('Моля въведете валиден имейл адрес');
      }
      
      if (username.length < 3) {
        throw new Error('Потребителското име трябва да е поне 3 символа');
      }

      await register({ username, email, password, role });
      toast({
        title: "Успешна регистрация",
        description: "Добре дошли във FitVision!",
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Грешка при регистрация",
        description: error.message || "Възникна проблем при създаването на акаунта",
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
          <img
            src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80"
            alt="Men Tailoring"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

          {/* Горен бранд акцент */}
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/20 text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Станете част от FitVision
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white pt-2 font-heading">
              Fit<span className="text-indigo-400">Vision</span>
            </h2>
          </div>

          {/* Долно послание */}
          <div className="relative z-10 space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              „Създайте безплатен акаунт и отключете персонализиран 3D манекен, OpenCV скенер и точни размери за хиляди артикули.“
            </p>
            <div className="pt-2 border-t border-white/15 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>0% върнати поръчки • ISO 8559 стандарти</span>
            </div>
          </div>
        </div>

        {/* Дясна половина: Форма за регистрация (7 от 12) */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-6">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold mb-1.5">
                Нов профил
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight font-heading">
                Регистрация във FitVision
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Попълнете формата за бързо създаване на вашия клиентски или търговски акаунт
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
                    minLength={3}
                    className="pl-9 bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl"
                    placeholder="Поне 3 символа"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-mono font-bold text-zinc-700">
                  Имейл адрес
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-mono font-bold text-zinc-700">
                  Парола
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl"
                    placeholder="Поне 6 символа"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-mono font-bold text-zinc-700">
                  Тип акаунт
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-zinc-50 border-zinc-200 focus:border-indigo-600 text-xs h-10 rounded-xl">
                    <SelectValue placeholder="Изберете тип акаунт" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 Купувач (за размерни препоръки)</SelectItem>
                    <SelectItem value="seller">🧵 Търговец / Бутик (за качване на обяви)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Регистриране...' : 'Създай акаунт'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="pt-4 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-600">
              Вече имате акаунт?{' '}
              <Link to="/signin" className="text-indigo-600 hover:text-indigo-700 font-bold font-mono">
                Влезте в профила
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Mail,
  Lock,
  Globe,
  Sliders,
  Footprints,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      toast({
        title: 'Успешен абонамент!',
        description: 'Благодарим ви, че се присъединихте към бюлетина на FitVision.',
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-white text-zinc-600 pt-16 pb-12 border-t border-zinc-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Горна лента: Гаранции и доверие (Trust Bar) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-zinc-200/80 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h5 className="font-bold text-zinc-950 text-xs">Calibrated ML</h5>
              <p className="text-[11px] text-zinc-500">Вероятностна класификация</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h5 className="font-bold text-zinc-950 text-xs">Точни конвенции</h5>
              <p className="text-[11px] text-zinc-500">Flat width vs. Circumference</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h5 className="font-bold text-zinc-950 text-xs">Mondopoint скенер</h5>
              <p className="text-[11px] text-zinc-500">Милиметрично измерване</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h5 className="font-bold text-zinc-950 text-xs">Поверителност</h5>
              <p className="text-[11px] text-zinc-500">Защитени телесни мерки</p>
            </div>
          </div>
        </div>

        {/* Главна част на футъра (4 колони) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-12 border-b border-zinc-200/80">
          {/* Колона 1: Бранд & Мисия (4 от 12) */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
                FV
              </div>
              <span className="text-xl font-black tracking-tight text-zinc-950 font-heading">
                Fit<span className="text-indigo-600">Vision</span>
              </span>
            </Link>

            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              Интелигентна модна платформа от следващо поколение, съчетаваща машинно обучение, 3D визуален дигитален двойник и компютърно зрение за безупречен избор на размер при всяка покупка.
            </p>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider block mb-2">
                Технологични стандарти:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono font-medium">
                  CRISP-DM
                </span>
                <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono font-medium">
                  ISO 8559-1
                </span>
                <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono font-medium">
                  ISO/TS 19407
                </span>
                <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono font-medium">
                  OpenCV A4
                </span>
              </div>
            </div>
          </div>

          {/* Колона 2: Продукти & Модули (2 от 12) */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-bold text-xs text-zinc-950 uppercase tracking-widest">
              Функционалности
            </h5>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>
                <Link to="/quiz" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  About You Quiz
                </Link>
              </li>
              <li>
                <Link to="/recommendation" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Препоръка
                </Link>
              </li>
              <li>
                <Link to="/shoes" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-indigo-600" />
                  Скенер за обувки
                </Link>
              </li>
              <li>
                <Link to="/clothing" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  Каталог дрехи
                </Link>
              </li>
            </ul>
          </div>

          {/* Колона 3: Архитектура & За нас (2 от 12) */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-bold text-xs text-zinc-950 uppercase tracking-widest">
              Платформа
            </h5>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>
                <Link to="/about" className="hover:text-indigo-600 transition-colors">
                  За проекта & Автор
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-indigo-600 transition-colors">
                  CRISP-DM Архитектура
                </Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-indigo-600 transition-colors">
                  Панел за търговци
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-600 transition-colors">
                  Администрация
                </Link>
              </li>
            </ul>
          </div>

          {/* Колона 4: Бюлетин (4 от 12) */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-xs text-zinc-950 uppercase tracking-widest">
              Бъдете информирани
            </h5>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Абонирайте се за нови размерни модели, актуализации на машинното обучение и нови колекции.
            </p>

            {subscribed ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                Вие сте абониран за FitVision бюлетина!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Въведете вашия имейл..."
                    className="pl-9 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 text-xs h-10 rounded-xl focus:border-indigo-600 focus:ring-indigo-600/20"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition-all"
                >
                  Абонирай се
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Долна правна лента */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} FitVision™ AI Inc. Всички права запазени.</p>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Поверителност (GDPR)</span>
            <span>•</span>
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Условия за ползване</span>
            <span>•</span>
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Бисквитки</span>
            <span>•</span>
            <span className="text-indigo-600 font-semibold">Филипа Попова, 11б клас</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

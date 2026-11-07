import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { Link, Navigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sliders,
  Sparkles,
  Footprints,
  Eye,
  CheckCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    switch (user?.role) {
      case 'user':
        return <Navigate to="/dashboard" replace />;
      case 'seller':
        return <Navigate to="/seller/profile" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        break;
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="bg-beige-200 text-[#3A2E2B] hover:bg-beige-300 font-semibold mb-4 px-4 py-1 text-xs border border-beige-300 shadow-2xs">
            ✨ FitVision AI Size Intelligence
          </Badge>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#3A2E2B] tracking-tight leading-tight mb-6">
            Перфектният размер.<br />
            <span className="gradient-text">За дрехи и обувки.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Сбогом на грешните размери и връщането на поръчки. FitVision съпоставя вашите мерки с кройката и еластичността на дрехата чрез калибрирано машинно обучение и 2D виртуален манекен.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Link to="/quiz">
              <Button size="lg" className="bg-[#B8956A] hover:bg-[#94754E] text-white px-8 py-3.5 text-base font-bold shadow-md rounded-xl">
                <Sliders className="w-5 h-5 mr-2" />
                Започнете с About You Quiz
              </Button>
            </Link>
            <Link to="/clothing">
              <Button variant="outline" size="lg" className="border-beige-300 text-[#3A2E2B] hover:bg-beige-100 px-8 py-3.5 text-base font-semibold rounded-xl bg-white/80">
                <ShoppingBag className="w-5 h-5 mr-2 text-[#B8956A]" />
                Разгледайте каталога
              </Button>
            </Link>
            <Link to="/shoes">
              <Button variant="ghost" size="lg" className="text-gray-700 hover:text-[#3A2E2B] hover:bg-beige-100 text-sm font-semibold">
                <Footprints className="w-4 h-4 mr-1.5 text-[#B8956A]" />
                Скенер за обувки
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/70 border-y border-beige-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3A2E2B]">
              Как работи FitVision?
            </h2>
            <p className="text-gray-600 mt-2 text-sm max-w-lg mx-auto">
              Интелигентна система в три лесни стъпки, създадена за уверено онлайн пазаруване
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card text-center p-6 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="w-16 h-16 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-beige-200">
                  <Sliders className="w-8 h-8 text-[#B8956A]" />
                </div>
                <CardTitle className="text-xl text-[#3A2E2B]">1. About You Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Попълнете 6 бързи въпроса за вашия ръст, тегло, обиколки и лични предпочитания за кройка (вталена или свободна).
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card text-center p-6 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="w-16 h-16 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-beige-200">
                  <Sparkles className="w-8 h-8 text-[#B8956A]" />
                </div>
                <CardTitle className="text-xl text-[#3A2E2B]">2. ML Анализ и калибрация</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Моделът съпоставя вашите мерки с реалната ширина и еластичност на дрехата, изчислявайки точен процент на увереност.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card text-center p-6 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="w-16 h-16 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-beige-200">
                  <Eye className="w-8 h-8 text-[#B8956A]" />
                </div>
                <CardTitle className="text-xl text-[#3A2E2B]">3. Визуален Манекен</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Вижте препоръчания и алтернативния размер, наложени визуално върху виртуален манекен за директно визуално сравнение.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-2xl border border-beige-200 shadow-2xs">
              <h3 className="text-4xl font-extrabold text-[#3A2E2B] mb-1">85%+</h3>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Калибрирана увереност</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-beige-200 shadow-2xs">
              <h3 className="text-4xl font-extrabold text-[#3A2E2B] mb-1">6,000</h3>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Обучени профила (ISO 8559)</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-beige-200 shadow-2xs">
              <h3 className="text-4xl font-extrabold text-[#3A2E2B] mb-1">0%</h3>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Сгрешени поръчки</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-beige-100 via-beige-200 to-beige-100 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-4">
            Готови ли сте да пазарувате уверено?
          </h2>
          <p className="text-gray-700 text-base mb-8 max-w-xl mx-auto">
            Преминете през About You Quiz и намерете идеалния размер за секунди.
          </p>
          <Link to="/quiz">
            <Button size="lg" className="bg-[#B8956A] hover:bg-[#94754E] text-white px-8 py-3.5 font-bold shadow-md">
              Започнете сега
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;

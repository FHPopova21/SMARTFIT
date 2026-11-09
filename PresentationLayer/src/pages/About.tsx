import React from 'react';
import { CheckCircle, Users, BarChart2, Mail, Star, Info, UserCheck, Sparkles, Sliders, Footprints, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => (
  <div className="max-w-5xl mx-auto p-4 sm:p-6 my-6 space-y-10">
    {/* Page Header */}
    <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
      <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-md shrink-0 font-heading">
        FV
      </div>
      <div>
        <Badge className="bg-indigo-50 text-indigo-700 font-semibold mb-1 border border-indigo-200 text-xs font-mono">
          Fashion-Tech AI • ISO 8559 Anthropometrics
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight font-heading">
          За технологията <span className="text-indigo-600">FitVision</span>
        </h1>
        <p className="text-zinc-600 text-sm mt-0.5">
          Автор: <b>Филипа Попова</b> (fhpopova21@codingburgas.bg)
        </p>
      </div>
    </div>

    {/* Mission & Problem */}
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-zinc-950 flex items-center gap-2 font-heading">
            <Star className="h-5 w-5 text-indigo-600" />
            Нашата мисия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 text-sm leading-relaxed">
            Вярваме, че онлайн пазаруването на дрехи и обувки трябва да бъде лесно, точно и без разочарования. Затова създадохме <b>FitVision</b> — интелигентна платформа, която препоръчва най-подходящия размер според индивидуалните антропометрични мерки на потребителя, физическите размери на дрехата и нейната еластичност.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-zinc-950 flex items-center gap-2 font-heading">
            <BarChart2 className="h-5 w-5 text-zinc-950" />
            Какъв проблем решаваме?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 text-sm leading-relaxed">
            В модната електронна търговия <b>над 30% от поръчките се връщат</b> поради несъответствие в размера. Това причинява логистични разходи, въглероден отпечатък и загуба на време за клиентите.<br />
            <b>FitVision</b> използва машинно обучение и компютърно зрение за минимизиране на тези грешки до 0%.
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Key Innovations */}
    <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-zinc-950 flex items-center gap-2 font-heading">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          Основни иновации във FitVision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
            <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-950 mb-1">
              <Sliders className="w-4 h-4 text-indigo-600" />
              About You Quiz
            </div>
            <p className="text-zinc-600">
              Интерактивен 7-стъпков въпросник, събиращ ръст, тегло, обиколки и стилови предпочитания с векторни силуети.
            </p>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
            <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-950 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Калибриран ML Модел
            </div>
            <p className="text-zinc-600">
              Обучен върху 6,000 антропометрични профила (ISO 8559) с математически изчислена вероятност и алтернативен размер.
            </p>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
            <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-950 mb-1">
              <Footprints className="w-4 h-4 text-emerald-600" />
              OpenCV Скенер за обувки
            </div>
            <p className="text-zinc-600">
              Автоматично измерване на дължината и ширината на стъпалото чрез референтен лист А4 и изчисление на точен EU размер.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Technologies & ML Architecture */}
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-950 flex items-center gap-2 font-heading">
            <CheckCircle className="h-5 w-5 text-indigo-600" />
            Технологичен стек
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-zinc-600">
            <li>• <b>Frontend:</b> React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI</li>
            <li>• <b>Backend:</b> Python 3.12/3.13, Flask (Application Factory), RESTful API</li>
            <li>• <b>Машинно обучение:</b> Scikit-learn, CalibratedClassifierCV, Pandas, NumPy</li>
            <li>• <b>База данни:</b> SQLAlchemy ORM, SQLite</li>
            <li>• <b>Автентикация:</b> Flask-Login, PBKDF2/SHA256 криптографско хеширане</li>
            <li>• <b>Тестване & CI:</b> Python unittest (13 теста), GitHub Actions</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-950 flex items-center gap-2 font-heading">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Машинно обучение и метрики
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Моделът прилага принципа на <b>Zero Data Leakage</b> (скалирането се напасва единствено върху тренировъчния дял).
          </p>
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Дейтасет:</span>
              <span className="font-bold text-zinc-950">6,000 антропометрични записа</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Калибрация:</span>
              <span className="font-bold text-zinc-950">CalibratedClassifierCV (Sigmoid)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Тестова точност:</span>
              <span className="font-bold text-emerald-600">~83-85% (Реалистична генерализация)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Brier Score:</span>
              <span className="font-bold text-zinc-950">0.056 (Висока калибрация на вероятностите)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Contact & Conclusion */}
    <div className="p-8 bg-zinc-950 text-white rounded-3xl text-center shadow-md">
      <h3 className="text-xl font-black mb-2 font-heading text-white">
        💡 FitVision прави пазаруването интуитивно, точно и приятно
      </h3>
      <p className="text-zinc-300 text-sm max-w-xl mx-auto">
        С нашата технология правилният размер дрехи и обувки вече не е въпрос на късмет, а на математическа сигурност.
      </p>
    </div>
  </div>
);

export default About;

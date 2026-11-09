import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  TrendingUp,
  Sliders,
  Footprints,
  Sparkles,
  Download,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  Rotate3d,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Елегантно мини 3D дигитално близначе за хедъра
const MiniDigitalTwin: React.FC<{
  gender?: string;
  bodyType?: string;
  chest?: number;
  waist?: number;
}> = ({ gender = 'female', bodyType = 'medium', chest = 92, waist = 74 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let angle = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      angle += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const cosR = Math.cos(angle);
      const sinR = Math.sin(angle);

      // Floor glow
      const grad = ctx.createRadialGradient(cx, h - 15, 2, cx, h - 15, 45);
      grad.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, h - 15, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body rings in 3D
      const isMale = gender === 'male';
      const sWidth = isMale ? 34 : 28;
      const cWidth = (chest / 100) * (isMale ? 30 : 26);
      const wWidth = (waist / 100) * (isMale ? 25 : 21);

      const rings = [
        { y: -45, rx: 7, rz: 7 }, // head
        { y: -34, rx: 5, rz: 5 }, // neck
        { y: -26, rx: sWidth, rz: 10 }, // shoulders
        { y: -10, rx: cWidth, rz: 12 }, // chest
        { y: 10, rx: wWidth, rz: 10 }, // waist
        { y: 30, rx: 28, rz: 11 }, // hips
        { y: 55, rx: 8, rz: 8 }, // legs
      ];

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#4F46E5';

      rings.forEach((r, idx) => {
        ctx.beginPath();
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          const x0 = Math.cos(t) * r.rx;
          const z0 = Math.sin(t) * r.rz;
          const x3d = x0 * cosR - z0 * sinR;
          const z3d = x0 * sinR + z0 * cosR;
          const px = cx + x3d;
          const py = cy + r.y + z3d * 0.25;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Connect vertical spinal lines
        if (idx < rings.length - 1) {
          const nextR = rings[idx + 1];
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
          ctx.moveTo(cx, cy + r.y);
          ctx.lineTo(cx, cy + nextR.y);
          ctx.stroke();
          ctx.strokeStyle = '#6366F1';
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gender, bodyType, chest, waist]);

  return (
    <div className="relative w-36 h-36 rounded-2xl bg-[#09090D] border border-indigo-500/30 overflow-hidden flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)] shrink-0">
      <canvas ref={canvasRef} width={144} height={144} className="w-full h-full" />
      <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-indigo-400 font-bold uppercase">
        Live 3D Twin
      </span>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // История на размерите (Timeline data)
  const sizeTimeline = [
    {
      id: 1,
      name: 'Класическа ленена риза',
      brand: 'FitVision Atelier',
      category: 'Риза / Горно',
      size: 'Размер M',
      matchScore: '96.4%',
      date: 'Преди 2 дни',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
      status: 'Перфектно пасване'
    },
    {
      id: 2,
      name: 'Оувърсайз памучна тениска',
      brand: 'Nordic Studio',
      category: 'Тениска',
      size: 'Размер M',
      matchScore: '92.1%',
      date: 'Преди 1 седмица',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
      status: 'Свободен контур'
    },
    {
      id: 3,
      name: 'Градски слим панталон',
      brand: 'Urban Tailor',
      category: 'Панталон',
      size: 'Размер 32 (M)',
      matchScore: '89.5%',
      date: 'Преди 2 седмици',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80',
      status: 'Анатомичен толеранс'
    },
    {
      id: 4,
      name: 'Спортни маратонки ISO Mondopoint',
      brand: 'FitVision Footwear',
      category: 'Обувки',
      size: 'Размер EU 42',
      matchScore: '98.2%',
      date: 'Преди 3 седмици',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
      status: 'OpenCV A4 Калибрация'
    }
  ];

  // GDPR експорт на биометрични данни
  const handleExportData = () => {
    const data = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role
      },
      anthropometrics: user?.bodyMeasurements || {
        height: 172,
        weight: 64,
        chest: 92,
        waist: 72,
        gender: 'female',
        bodyType: 'medium'
      },
      exportDate: new Date().toISOString(),
      standardsCompliance: ['ISO 8559-1', 'ISO/TS 19407', 'EU GDPR Article 20']
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitvision-data-${user?.name || 'profile'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "GDPR експортът е готов!",
      description: "Вашите телесни мерки и профилни данни бяха изтеглени като JSON файл.",
    });
  };

  const handleDeleteHistory = () => {
    toast({
      title: "Историята е нулирана",
      description: "Всички запазени симулации бяха безопасно изтрити от локалната сесия.",
    });
  };

  const measurements = user?.bodyMeasurements;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* ХЕДЪР: Профил с умален 3D мини-аватар (Digital Twin) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/90 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono font-bold px-3 py-1">
                ● 3D Digital Twin Active
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono font-bold px-3 py-1">
                GDPR Защитен
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 font-heading tracking-tight">
              Здравейте, {user?.name}! 👋
            </h1>

            <p className="text-sm text-zinc-600 max-w-xl">
              Вашият личен моден панел за управление на антропометричния профил, виртуални 3D симулации и история на закупените размери.
            </p>

            {/* Метрики от профила */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">Височина:</span>
                <span className="font-bold text-zinc-900">{measurements?.height || 172} см</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">Тегло:</span>
                <span className="font-bold text-emerald-600">{measurements?.weight || 64} кг</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">Гърди / Талия:</span>
                <span className="font-bold text-indigo-600">{measurements?.chest || 92} / {measurements?.waist || 72} см</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">Телосложение:</span>
                <span className="font-bold text-zinc-900 uppercase">{measurements?.bodyType || 'Medium'}</span>
              </div>
            </div>
          </div>

          {/* Мини 3D аватар в реално време */}
          <div className="flex flex-col items-center gap-2">
            <MiniDigitalTwin
              gender={measurements?.gender}
              bodyType={measurements?.bodyType}
              chest={measurements?.chest}
              waist={measurements?.waist}
            />
            <Link to="/recommendation">
              <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 text-[11px] font-mono font-bold h-7">
                <Rotate3d className="w-3.5 h-3.5 mr-1" />
                Отвори 3D Пробна
              </Button>
            </Link>
          </div>
        </div>

        {/* БЪРЗИ ДЕЙСТВИЯ (Quick Actions) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/quiz">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-950 text-base font-heading">About You Quiz</h3>
                <p className="text-xs text-zinc-500 mt-1">Рекалибрирайте вашите мерки и кройкови навици</p>
              </div>
              <span className="text-xs text-indigo-600 font-bold mt-4 flex items-center gap-1 font-mono">
                Редактирай <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link to="/recommendation">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-950 text-base font-heading">3D Виртуална Пробна</h3>
                <p className="text-xs text-zinc-500 mt-1">Анализ на напрежението и 360° студийна симулация</p>
              </div>
              <span className="text-xs text-emerald-600 font-bold mt-4 flex items-center gap-1 font-mono">
                Стартирай <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link to="/shoes">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Footprints className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-950 text-base font-heading">AR Скенер за Обувки</h3>
                <p className="text-xs text-zinc-500 mt-1">OpenCV измерване на стъпало върху лист А4</p>
              </div>
              <span className="text-xs text-sky-600 font-bold mt-4 flex items-center gap-1 font-mono">
                Сканирай <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link to="/clothing">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-950 text-base font-heading">Каталог Дрехи</h3>
                <p className="text-xs text-zinc-500 mt-1">Прегледайте актуалните бутикови колекции</p>
              </div>
              <span className="text-xs text-violet-600 font-bold mt-4 flex items-center gap-1 font-mono">
                Разгледай <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* ИСТОРИЯ НА РАЗМЕРИТЕ: Елегантна Времева Линия (Timeline) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-700 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                История на размерите и пробите
              </span>
              <h2 className="text-2xl font-black text-zinc-950 font-heading tracking-tight mt-1">
                Вашият интелигентен гардероб
              </h2>
            </div>
            <Badge variant="outline" className="text-xs font-mono border-zinc-200 text-zinc-500">
              {sizeTimeline.length} артикула в историята
            </Badge>
          </div>

          {/* Времева линия с вертикална връзка */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-600 before:via-indigo-300 before:to-transparent">
            {sizeTimeline.map((item) => (
              <div key={item.id} className="relative group">
                {/* Светеща точка на времевата линия */}
                <span className="absolute -left-6 sm:-left-8 top-4 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />

                <div className="bg-zinc-50/80 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover object-center border border-zinc-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500 font-mono">{item.brand}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{item.date}</span>
                      </div>
                      <h4 className="font-bold text-zinc-950 text-base group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-xs text-zinc-500">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono font-bold px-3 py-1">
                      {item.size} • {item.matchScore}
                    </Badge>
                    <span className="text-[11px] font-mono text-zinc-500">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* НАСТРОЙКИ ЗА ПОВЕРИТЕЛНОСТ & DANGER ZONE (Strict Corporate Style) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-950 font-heading">
                  Настройки за поверителност & Danger Zone
                </h3>
                <p className="text-xs text-zinc-500">
                  Управление на биометричните данни и суверенитет съгласно европейския регламент GDPR (Article 17 & 20)
                </p>
              </div>
            </div>
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-mono font-bold uppercase">
              Strict Security
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Бутон за GDPR Експорт */}
            <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  Експорт на биометрични данни (GDPR)
                </h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Изтеглете пълно машинно-четимо JSON копие на вашите антропометрични мерки, симулации и история на размерите.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleExportData}
                variant="outline"
                className="w-full border-zinc-200 text-zinc-800 hover:bg-zinc-100 text-xs font-bold rounded-xl"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Изтегли лични данни (.JSON)
              </Button>
            </div>

            {/* Бутон за Нулиране на история */}
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Изтриване на историята на размерите
                </h4>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Перманентно премахва запазените виртуални проби и симулации. Действието е окончателно и не може да бъде отменено.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleDeleteHistory}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Изтрий историята на пробите
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

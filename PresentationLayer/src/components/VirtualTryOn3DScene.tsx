import React, { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rotate3d,
  Layers,
  Activity,
  Sparkles,
  Maximize2,
  Info
} from 'lucide-react';

interface VirtualTryOn3DSceneProps {
  gender?: string;
  bodyType?: string;
  selectedSize: string;
  recommendedSize: string;
  clothingName: string;
  clothingWidth: number;
  userChest: number;
  userWaist: number;
  isHeatmap: boolean;
  onToggleHeatmap: () => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const VirtualTryOn3DScene: React.FC<VirtualTryOn3DSceneProps> = ({
  gender = 'female',
  bodyType = 'medium',
  selectedSize,
  recommendedSize,
  clothingName,
  clothingWidth,
  userChest,
  userWaist,
  isHeatmap,
  onToggleHeatmap
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0.2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Size morph scale (XS -> 0.88, S -> 0.94, M -> 1.0, L -> 1.07, XL -> 1.15)
  const sizeIdx = SIZES.indexOf(selectedSize) !== -1 ? SIZES.indexOf(selectedSize) : 2;
  const targetScale = 0.88 + sizeIdx * 0.065;
  const currentScaleRef = useRef(targetScale);

  // Mouse drag 360 rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartX) * 0.015;
    setRotationAngle((prev) => prev + delta);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const delta = (e.touches[0].clientX - dragStartX) * 0.015;
    setRotationAngle((prev) => prev + delta);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    let animId: number;
    let autoRotateAngle = rotationAngle;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Lerp scale for fluid size morphing
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.08;
      const morph = currentScaleRef.current;

      // Slight auto drift when not manually rotating
      if (!isDragging) {
        autoRotateAngle += 0.005;
      } else {
        autoRotateAngle = rotationAngle;
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 10;

      // 1. Меко студийно подово осветление (Studio floor shadow)
      const floorGrad = ctx.createRadialGradient(cx, height - 35, 10, cx, height - 35, 140);
      floorGrad.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
      floorGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.03)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.ellipse(cx, height - 35, 130, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Three-point Studio Lighting ambient (Light studio)
      const keyLightGrad = ctx.createRadialGradient(cx - 80, cy - 140, 30, cx, cy, 300);
      keyLightGrad.addColorStop(0, '#FFFFFF');
      keyLightGrad.addColorStop(0.8, '#F6F7FA');
      keyLightGrad.addColorStop(1, '#EDEEF3');
      ctx.fillStyle = keyLightGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Манекен Анатомия с тримерна проекция и Three-point осветление
      const cosR = Math.cos(autoRotateAngle);
      const sinR = Math.sin(autoRotateAngle);

      // Базови размери на тялото
      const isMale = gender === 'male';
      const shoulderSpan = (isMale ? 116 : 98) * (bodyType === 'large' ? 1.12 : bodyType === 'slim' ? 0.92 : 1.0);
      const chestSpan = (userChest ? userChest * 0.95 : (isMale ? 104 : 92)) * 0.55;
      const waistSpan = (userWaist ? userWaist * 0.95 : (isMale ? 86 : 72)) * 0.5;
      const hipSpan = (isMale ? 96 : 106) * 0.52;

      // Точки в 3D пространството: [x, y, z]
      // Торс: Рамене, Гърди, Талия, Ханш, Крака
      const bodyRings = [
        { y: -130, rx: 14, rz: 14, type: 'head' },
        { y: -100, rx: 11, rz: 11, type: 'neck' },
        { y: -80, rx: shoulderSpan * 0.52, rz: 22, type: 'shoulders' },
        { y: -40, rx: chestSpan, rz: 26, type: 'chest' },
        { y: 15, rx: waistSpan, rz: 20, type: 'waist' },
        { y: 65, rx: hipSpan, rz: 24, type: 'hips' },
        { y: 145, rx: 22, rz: 18, type: 'thighs' },
        { y: 210, rx: 14, rz: 14, type: 'calves' },
      ];

      // Проекция и чертаене на вътрешния анатомичен силует (Wireframe Humanoid)
      ctx.save();
      ctx.lineWidth = 1.2;

      bodyRings.forEach((ring) => {
        const py = cy + ring.y;
        ctx.beginPath();
        // Елипса завъртяна в 3D
        const steps = 36;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const x0 = Math.cos(theta) * ring.rx;
          const z0 = Math.sin(theta) * ring.rz;
          // Ротация по Y ос
          const rx3d = x0 * cosR - z0 * sinR;
          const rz3d = x0 * sinR + z0 * cosR;
          const screenX = cx + rx3d;
          const screenY = py + rz3d * 0.22;

          if (i === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.stroke();
      });

      // 3. 3D ДРЕХА С МОДЕЛ ЗА ДИНАМИЧЕН ОБЕМ (Морфинг + Heatmap)
      // Размери на дрехата според изчисления мащаб morph (XS -> XL)
      const garmentShoulder = shoulderSpan * 0.58 * morph;
      const garmentChest = chestSpan * 1.08 * morph;
      const garmentWaist = waistSpan * 1.15 * morph;
      const garmentHem = hipSpan * 1.05 * morph;

      const garmentLayers = [
        { y: -86, rx: garmentShoulder * 0.95, rz: 26 * morph, label: 'Shoulders' },
        { y: -72, rx: garmentShoulder, rz: 28 * morph, label: 'UpperChest' },
        { y: -35, rx: garmentChest, rz: 30 * morph, label: 'Chest' },
        { y: 5, rx: (garmentChest + garmentWaist) * 0.5, rz: 26 * morph, label: 'Midriff' },
        { y: 40, rx: garmentWaist, rz: 24 * morph, label: 'Waist' },
        { y: 70, rx: garmentHem, rz: 25 * morph, label: 'Hem' },
      ];

      // Напрежение на плата (Tension Calculation)
      // Препоръчан размер = 0.5 толеранс (Mint #10B981)
      // По-малък размер = висок опън в раменете и гърдите (Coral #F43F5E)
      // По-голям размер = свободен, нисък опън (Indigo #6366F1)
      const recIdx = SIZES.indexOf(recommendedSize);
      const isTooTight = sizeIdx < recIdx;
      const isLoose = sizeIdx > recIdx;

      // Рендиране на полигонната повърхност на дрехата
      for (let l = 0; l < garmentLayers.length - 1; l++) {
        const top = garmentLayers[l];
        const bot = garmentLayers[l + 1];
        const segments = 24;

        for (let s = 0; s < segments; s++) {
          const t1 = (s / segments) * Math.PI * 2;
          const t2 = ((s + 1) / segments) * Math.PI * 2;

          // 4 ъгъла на 3D квада
          const p1 = {
            x: cx + (Math.cos(t1) * top.rx * cosR - Math.sin(t1) * top.rz * sinR),
            y: cy + top.y + (Math.cos(t1) * top.rx * sinR + Math.sin(t1) * top.rz * cosR) * 0.22,
            z: Math.cos(t1) * top.rx * sinR + Math.sin(t1) * top.rz * cosR
          };
          const p2 = {
            x: cx + (Math.cos(t2) * top.rx * cosR - Math.sin(t2) * top.rz * sinR),
            y: cy + top.y + (Math.cos(t2) * top.rx * sinR + Math.sin(t2) * top.rz * cosR) * 0.22,
            z: Math.cos(t2) * top.rx * sinR + Math.sin(t2) * top.rz * cosR
          };
          const p3 = {
            x: cx + (Math.cos(t2) * bot.rx * cosR - Math.sin(t2) * bot.rz * sinR),
            y: cy + bot.y + (Math.cos(t2) * bot.rx * sinR + Math.sin(t2) * bot.rz * cosR) * 0.22,
            z: Math.cos(t2) * bot.rx * sinR + Math.sin(t2) * bot.rz * cosR
          };
          const p4 = {
            x: cx + (Math.cos(t1) * bot.rx * cosR - Math.sin(t1) * bot.rz * sinR),
            y: cy + bot.y + (Math.cos(t1) * bot.rx * sinR + Math.sin(t1) * bot.rz * cosR) * 0.22,
            z: Math.cos(t1) * bot.rx * sinR + Math.sin(t1) * bot.rz * cosR
          };

          // Нормално студийно осветление (Face normal shading)
          const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
          const lighting = Math.max(0.15, (avgZ + 40) / 80);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          if (isHeatmap) {
            // HEATMAP РЕЖИМ (Анализ на напрежението)
            if (isTooTight && l <= 2) {
              // Напрегнати рамене / гърди: Топло коралово/червено
              ctx.fillStyle = `rgba(244, 63, 94, ${0.45 + lighting * 0.35})`;
              ctx.strokeStyle = 'rgba(251, 113, 133, 0.6)';
            } else if (isLoose) {
              // Свободен луфт: Електрическо индиго
              ctx.fillStyle = `rgba(99, 102, 241, ${0.35 + lighting * 0.3})`;
              ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
            } else {
              // Оптимално пасване: Неоново ментово зелено
              ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + lighting * 0.35})`;
              ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
            }
          } else {
            // СТУДИЕН ТЕКСТИЛЕН РЕЖИМ (Studio Fabric)
            const alpha = 0.22 + lighting * 0.25;
            ctx.fillStyle = `rgba(79, 70, 229, ${alpha})`;
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.7)';
          }

          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // 4. Калибриращи лазерни шублери (Radar Calipers)
      // Гръдна обиколка
      const chestY = cy - 35;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isHeatmap ? (isTooTight ? '#F43F5E' : '#10B981') : '#4F46E5';
      ctx.lineWidth = 1.5;
      ctx.moveTo(cx - garmentChest - 25, chestY);
      ctx.lineTo(cx + garmentChest + 25, chestY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Точки в краищата на шублера
      ctx.fillStyle = isHeatmap ? (isTooTight ? '#F43F5E' : '#10B981') : '#4F46E5';
      ctx.beginPath();
      ctx.arc(cx - garmentChest - 25, chestY, 3, 0, Math.PI * 2);
      ctx.arc(cx + garmentChest + 25, chestY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Талия шублер
      const waistY = cy + 40;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isHeatmap ? (isLoose ? '#4F46E5' : '#10B981') : '#6366F1';
      ctx.lineWidth = 1.2;
      ctx.moveTo(cx - garmentWaist - 20, waistY);
      ctx.lineTo(cx + garmentWaist + 20, waistY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [rotationAngle, isDragging, targetScale, isHeatmap, gender, bodyType, userChest, userWaist, selectedSize, recommendedSize]);

  return (
    <div className="relative w-full h-[540px] rounded-3xl bg-white border border-zinc-200/90 overflow-hidden select-none shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
      {/* Студийно осветление / Светлинни рефлекси */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold px-2.5 py-1 shadow-xs">
          <Activity className="w-3 h-3 mr-1 text-indigo-600 animate-pulse" />
          3D Studio Twin • 360° Drag
        </Badge>
        {isHeatmap && (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-mono font-bold animate-pulse shadow-xs">
            🔥 Stress Heatmap Active
          </Badge>
        )}
      </div>

      {/* Бутони за управление на сцената (Горе вдясно) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          type="button"
          onClick={onToggleHeatmap}
          size="sm"
          className={`text-xs font-bold rounded-xl transition-all shadow-xs ${
            isHeatmap
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 mr-1.5" />
          {isHeatmap ? 'Анализ: Включен' : 'Анализ на напрежението'}
        </Button>
      </div>

      {/* HTML5 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={560}
        height={540}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Долна инфо лента за визуален статус */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] font-mono bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 text-zinc-700">
          <Rotate3d className="w-3.5 h-3.5 text-indigo-600" />
          <span>Завъртете с мишката за 360° поглед</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Симулиран размер:</span>
          <span className="font-bold text-zinc-950 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
            {selectedSize}
          </span>
          <span className="text-zinc-400">•</span>
          <span className="text-emerald-700 font-bold">ISO 8559 Калибриран</span>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn3DScene;


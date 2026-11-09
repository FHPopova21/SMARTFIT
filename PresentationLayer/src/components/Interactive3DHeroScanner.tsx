import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Scan,
  Maximize2,
  SlidersHorizontal,
  Flame,
  ArrowRight
} from 'lucide-react';

interface Interactive3DHeroScannerProps {
  onStartQuiz?: () => void;
}

export const Interactive3DHeroScanner: React.FC<Interactive3DHeroScannerProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedSize, setSelectedSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>('M');
  const [viewMode, setViewMode] = useState<'lidar' | 'tension' | 'wireframe'>('lidar');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D параметри
  const rotationRef = useRef(0);
  const scanLineRef = useRef(0);
  const scanDirRef = useRef(1);

  // Размерни фактори за морфинг
  const sizeMultipliers: Record<string, { chest: number; waist: number; drape: number; label: string; match: string; status: string; color: string }> = {
    XS: { chest: 0.88, waist: 0.86, drape: 0.82, label: 'Много вталено (Ultra Slim)', match: '81% Match', status: 'Силно прилепнало / опънато', color: '#F43F5E' },
    S:  { chest: 0.94, waist: 0.92, drape: 0.90, label: 'Вталено (Slim Fit)', match: '89% Match', status: 'Прилепнал силует (-2 см)', color: '#F59E0B' },
    M:  { chest: 1.00, waist: 1.00, drape: 1.00, label: 'Перфектен баланс (Regular Fit)', match: '98.4% Match', status: 'Препоръчан анатомичен размер', color: '#10B981' },
    L:  { chest: 1.08, waist: 1.08, drape: 1.15, label: 'Свободно (Relaxed Fit)', match: '88% Match', status: 'Свободен падеж (+3.5 см)', color: '#06B6D4' },
    XL: { chest: 1.16, waist: 1.16, drape: 1.28, label: 'Оувърсайз (Oversized Fit)', match: '79% Match', status: 'Широк свободен обем', color: '#6366F1' },
  };

  const currentSizeData = sizeMultipliers[selectedSize];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Дефиниране на 3D анатомични точки на цифров двойник (Mannequin 3D Node Mesh)
    const baseNodes: Array<{ x: number; y: number; z: number; type: 'head' | 'shoulder' | 'chest' | 'waist' | 'hip' | 'leg' }> = [
      // Глава
      { x: 0, y: -135, z: 0, type: 'head' },
      { x: 0, y: -160, z: 0, type: 'head' },
      { x: -14, y: -148, z: 0, type: 'head' },
      { x: 14, y: -148, z: 0, type: 'head' },
      { x: 0, y: -148, z: 14, type: 'head' },
      { x: 0, y: -148, z: -14, type: 'head' },

      // Врат & Рамене
      { x: 0, y: -115, z: 0, type: 'shoulder' },
      { x: -48, y: -98, z: 0, type: 'shoulder' },
      { x: 48, y: -98, z: 0, type: 'shoulder' },
      { x: -58, y: -80, z: -4, type: 'shoulder' },
      { x: 58, y: -80, z: -4, type: 'shoulder' },

      // Гърди (Chest Ring)
      { x: -42, y: -50, z: 12, type: 'chest' },
      { x: 0, y: -48, z: 20, type: 'chest' },
      { x: 42, y: -50, z: 12, type: 'chest' },
      { x: 42, y: -50, z: -12, type: 'chest' },
      { x: 0, y: -48, z: -18, type: 'chest' },
      { x: -42, y: -50, z: -12, type: 'chest' },

      // Талия (Waist Ring)
      { x: -32, y: 0, z: 10, type: 'waist' },
      { x: 0, y: 0, z: 15, type: 'waist' },
      { x: 32, y: 0, z: 10, type: 'waist' },
      { x: 30, y: 0, z: -10, type: 'waist' },
      { x: 0, y: 0, z: -14, type: 'waist' },
      { x: -30, y: 0, z: -10, type: 'waist' },

      // Ханш (Hip Ring)
      { x: -40, y: 45, z: 12, type: 'hip' },
      { x: 0, y: 46, z: 16, type: 'hip' },
      { x: 40, y: 45, z: 12, type: 'hip' },
      { x: 38, y: 45, z: -12, type: 'hip' },
      { x: 0, y: 46, z: -15, type: 'hip' },
      { x: -38, y: 45, z: -12, type: 'hip' },

      // Крака / Бедра
      { x: -24, y: 85, z: 5, type: 'leg' },
      { x: 24, y: 85, z: 5, type: 'leg' },
      { x: -22, y: 135, z: 0, type: 'leg' },
      { x: 22, y: 135, z: 0, type: 'leg' },
    ];

    // Ръбове (Edges) между възлите за изчертаване на 3D wireframe
    const meshEdges: Array<[number, number]> = [
      [1, 2], [1, 3], [1, 4], [1, 5],
      [0, 2], [0, 3], [0, 4], [0, 5],
      [0, 6], [6, 7], [6, 8], [7, 9], [8, 10],
      // Гръден ринг
      [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 11],
      [7, 11], [8, 13], [6, 12],
      // Талиен ринг
      [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 17],
      [11, 17], [12, 18], [13, 19], [14, 20], [15, 21], [16, 22],
      // Ханш ринг
      [23, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 23],
      [17, 23], [18, 24], [19, 25], [20, 26], [21, 27], [22, 28],
      // Крака
      [23, 29], [25, 30], [29, 31], [30, 32],
    ];

    // Анимационен цикъл
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Фон: Премиум светло фото студио (Studio Lighting)
      const cx = w / 2;
      const cy = h / 2 - 5;
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(w, h));
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(1, '#F4F5F8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Фон: фина дизайнерска координатна мрежа
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // Автоматично плавно 3D завъртане + реакция на курсора
      if (!isHovered) {
        rotationRef.current += 0.012;
      } else {
        const targetRot = (mousePos.x / w - 0.5) * 1.5;
        rotationRef.current += (targetRot - rotationRef.current) * 0.08;
      }

      const rot = rotationRef.current;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      // 3D център на екрана и зрително поле
      const fov = 340;

      // Изчисляване на проекциите на възлите
      const projectedNodes: Array<{ x: number; y: number; z: number; scale: number; type: string }> = [];

      baseNodes.forEach((node) => {
        let nx = node.x;
        let ny = node.y;
        let nz = node.z;

        // Динамичен морфинг според избрания размер
        if (node.type === 'chest') {
          nx *= currentSizeData.chest;
          nz *= currentSizeData.chest;
        } else if (node.type === 'waist') {
          nx *= currentSizeData.waist;
          nz *= currentSizeData.waist;
        }

        // 3D Y-осова ротация
        const rotX = nx * cosR - nz * sinR;
        const rotZ = nx * sinR + nz * cosR + 180;

        // Перспективно прожектиране
        const scale = fov / (fov + rotZ);
        const px = cx + rotX * scale;
        const py = cy + ny * scale;

        projectedNodes.push({ x: px, y: py, z: rotZ, scale, type: node.type });
      });

      // 1. Изчертаване на 3D обемния плат (Virtual Garment Silhouette)
      const drape = currentSizeData.drape;
      ctx.save();

      // Градиент за дрехата според viewMode
      const garmentGrad = ctx.createLinearGradient(0, cy - 100, 0, cy + 80);
      if (viewMode === 'tension') {
        garmentGrad.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
        garmentGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.16)');
        garmentGrad.addColorStop(1, 'rgba(16, 185, 129, 0.18)');
      } else {
        garmentGrad.addColorStop(0, 'rgba(99, 102, 241, 0.20)');
        garmentGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.12)');
        garmentGrad.addColorStop(1, 'rgba(79, 70, 229, 0.05)');
      }

      ctx.fillStyle = garmentGrad;
      ctx.strokeStyle = viewMode === 'tension' ? '#F43F5E' : '#4F46E5';
      ctx.lineWidth = 1.6;
      ctx.setLineDash(selectedSize === 'M' ? [] : [4, 2]);

      // Рисуване на крило/торс на дрехата
      const nShoulderL = projectedNodes[7];
      const nShoulderR = projectedNodes[8];
      const nChestL = projectedNodes[11];
      const nChestR = projectedNodes[13];
      const nWaistL = projectedNodes[17];
      const nWaistR = projectedNodes[19];
      const nWaistC = projectedNodes[18];

      if (nShoulderL && nShoulderR && nChestL && nChestR && nWaistL && nWaistR) {
        ctx.beginPath();
        // Врат
        ctx.moveTo(nShoulderL.x - 8 * drape, nShoulderL.y);
        // Ляв ръкав
        ctx.lineTo(nShoulderL.x - 24 * drape, nShoulderL.y + 36);
        ctx.lineTo(nShoulderL.x - 6, nShoulderL.y + 44);
        // Лява талия
        ctx.lineTo(nWaistL.x - 12 * drape, nWaistL.y + 20 * drape);
        // Долен подгъв
        ctx.quadraticCurveTo(nWaistC.x, nWaistC.y + 26 * drape, nWaistR.x + 12 * drape, nWaistR.y + 20 * drape);
        // Дясна талия
        ctx.lineTo(nShoulderR.x + 6, nShoulderR.y + 44);
        // Десен ръкав
        ctx.lineTo(nShoulderR.x + 24 * drape, nShoulderR.y + 36);
        ctx.lineTo(nShoulderR.x + 8 * drape, nShoulderR.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 2. Изчертаване на 3D жичните ребра (Wireframe Mesh Edges)
      ctx.save();
      ctx.lineWidth = 1;
      meshEdges.forEach(([i, j]) => {
        const p1 = projectedNodes[i];
        const p2 = projectedNodes[j];
        if (!p1 || !p2) return;

        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.15, Math.min(0.65, (300 - avgZ) / 240));

        if (viewMode === 'tension') {
          ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
        } else {
          ctx.strokeStyle = `rgba(79, 70, 229, ${alpha * 0.85})`;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
      ctx.restore();

      // 3. Изчертаване на възлите (Nodes)
      projectedNodes.forEach((p) => {
        const radius = Math.max(1.8, 3.0 * p.scale);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

        if (p.type === 'chest' || p.type === 'waist') {
          ctx.fillStyle = '#059669';
        } else {
          ctx.fillStyle = '#4F46E5';
        }
        ctx.fill();
        ctx.restore();
      });

      // 4. Движещ се вертикален лазерен скенер (Laser Scanner Beam)
      scanLineRef.current += 1.8 * scanDirRef.current;
      if (scanLineRef.current > h - 40) scanDirRef.current = -1;
      if (scanLineRef.current < 30) scanDirRef.current = 1;

      const scanY = scanLineRef.current;
      ctx.save();
      const laserGrad = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
      laserGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
      laserGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.22)');
      laserGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = laserGrad;
      ctx.fillRect(20, scanY - 12, w - 40, 24);

      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(25, scanY);
      ctx.lineTo(w - 25, scanY);
      ctx.stroke();

      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`LiDAR SLICE: Y=${Math.round(scanY)}mm`, 30, scanY - 5);
      ctx.restore();

      // 5. Обръчи за мерките (Chest & Waist Calipers)
      const nChest = projectedNodes[12];
      const nWaist = projectedNodes[18];

      if (nChest) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(nChest.x, nChest.y, 52 * drape, 14 * drape, rot * 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(`CHEST: ${Math.round(96 * currentSizeData.chest)} cm`, nChest.x + 58 * drape, nChest.y + 4);
        ctx.restore();
      }

      if (nWaist) {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(nWaist.x, nWaist.y, 44 * drape, 12 * drape, rot * 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4F46E5';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(`WAIST: ${Math.round(78 * currentSizeData.waist)} cm`, nWaist.x + 50 * drape, nWaist.y + 4);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedSize, viewMode, isHovered, mousePos, currentSizeData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full max-w-lg mx-auto bg-white text-zinc-900 rounded-3xl border border-zinc-200/90 shadow-[0_16px_48px_rgba(0,0,0,0.06)] overflow-hidden transition-all"
    >
      {/* Горен HUD панел */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <h4 className="text-xs font-black tracking-widest uppercase text-zinc-950 flex items-center gap-1.5 font-mono">
              <Scan className="w-3.5 h-3.5 text-indigo-600" />
              FitVision™ 3D LiDAR Engine
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">
              ISO 8559-1 Anthropometrics • 60 FPS
            </span>
          </div>
        </div>

        {/* Бейдж за увереност */}
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold px-2.5 py-1">
          {currentSizeData.match}
        </Badge>
      </div>

      {/* Селектор за режими на визуализация */}
      <div className="px-4 pt-3 pb-2.5 flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Режим на скенера:
        </span>
        <div className="flex gap-1.5">
          {[
            { id: 'lidar', label: 'LiDAR Mesh', icon: Layers },
            { id: 'tension', label: 'Тензионен стрес', icon: Flame },
          ].map((mode) => {
            const Icon = mode.icon;
            const active = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id as any)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-zinc-950 text-white border-zinc-950 font-bold shadow-xs'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Централен 3D Canvas дисплей */}
      <div className="relative w-full h-[360px] bg-[#F8F9FB] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Плаващ HUD индикатор за размер */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-zinc-200/90 rounded-xl px-3 py-1.5 text-[10px] font-mono text-zinc-800 shadow-sm space-y-0.5">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
            <Activity className="w-3 h-3" />
            <span>{currentSizeData.label}</span>
          </div>
          <p className="text-zinc-500 text-[9px]">{currentSizeData.status}</p>
        </div>

        {/* Долен статус бар върху канваса */}
        <div className="absolute bottom-2.5 left-3 right-3 bg-white/90 backdrop-blur-md border border-zinc-200/90 rounded-xl px-3 py-1.5 text-[10px] font-mono flex items-center justify-between text-zinc-600 shadow-xs">
          <span className="flex items-center gap-1.5 text-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Кликнете размер за жив морфинг
          </span>
          <span className="text-indigo-600 font-bold">Размер: {selectedSize}</span>
        </div>
      </div>

      {/* Селектор за интерактивни размери */}
      <div className="p-4 bg-white border-t border-zinc-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
            Симулирай прилягане:
          </span>
          <span className="text-[11px] font-mono font-bold" style={{ color: currentSizeData.color }}>
            {selectedSize === 'M' ? '★ Препоръчан (Regular)' : currentSizeData.status}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {(['XS', 'S', 'M', 'L', 'XL'] as const).map((sz) => {
            const isSelected = selectedSize === sz;
            const isRecommended = sz === 'M';
            return (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all border ${
                  isSelected
                    ? isRecommended
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-[1.03]'
                      : 'bg-zinc-950 text-white border-zinc-950 shadow-xs scale-[1.03]'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <span className="block">{sz}</span>
                <span className="text-[9px] opacity-75 font-normal block">
                  {isRecommended ? 'Match' : sz === 'XS' || sz === 'S' ? 'Slim' : 'Loose'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Главен CTA бутон */}
        <Link to="/quiz" className="block pt-1">
          <Button
            size="lg"
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Създайте ваш личен 3D манекен
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Interactive3DHeroScanner;


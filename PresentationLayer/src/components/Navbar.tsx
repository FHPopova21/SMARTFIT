import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  ShoppingBag,
  Sliders,
  Footprints,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll helper for anchor sections on homepage
  const handleAnchorClick = (anchorId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${anchorId}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E9EAF3] transition-all">
      {/* 1. Горен B2B Announcement Bar */}
      <div className="bg-[#0F1117] text-zinc-300 text-[10px] sm:text-xs font-mono font-medium tracking-wider uppercase py-1.5 px-4 text-center flex items-center justify-center gap-2 select-none border-b border-zinc-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="truncate">FITVISION 2.0 • B2B SIZE INTELLIGENCE ЗА МОДНА ЕЛЕКТРОННА ТЪРГОВИЯ</span>
        <span className="hidden md:inline text-zinc-500">•</span>
        <Link to="/clothing" className="hidden md:inline-flex items-center text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
          РАЗГЛЕДАЙТЕ ДЕМО МАГАЗИНА <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>

      {/* 2. Главна навигационна лента */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Основна навигация">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link
            to={isAuthenticated ? (user?.role === 'seller' ? '/seller' : (user?.role === 'admin' ? '/admin' : '/dashboard')) : '/'}
            className="flex items-center space-x-2.5 group focus:outline-none focus:ring-2 focus:ring-[#4F46E5] rounded-xl p-1"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md group-hover:bg-[#4338CA] transition-colors">
              FV
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F1117] font-heading leading-tight">
                Fit<span className="text-[#4F46E5]">Vision</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                B2B Size Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 font-sans text-sm font-semibold text-zinc-600">
            <button
              type="button"
              onClick={() => handleAnchorClick('platform')}
              className="px-3.5 py-2 rounded-xl hover:text-[#0F1117] hover:bg-[#F8F9FC] transition-colors"
            >
              Platform
            </button>

            <button
              type="button"
              onClick={() => handleAnchorClick('solutions')}
              className="px-3.5 py-2 rounded-xl hover:text-[#0F1117] hover:bg-[#F8F9FC] transition-colors"
            >
              Solutions
            </button>

            <button
              type="button"
              onClick={() => handleAnchorClick('integrations')}
              className="px-3.5 py-2 rounded-xl hover:text-[#0F1117] hover:bg-[#F8F9FC] transition-colors"
            >
              Integrations
            </button>

            <button
              type="button"
              onClick={() => handleAnchorClick('pricing')}
              className="px-3.5 py-2 rounded-xl hover:text-[#0F1117] hover:bg-[#F8F9FC] transition-colors"
            >
              Pricing
            </button>

            {/* Демо падащо меню с директен достъп до съществуващите потребителски функции */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl hover:text-[#0F1117] hover:bg-[#F8F9FC] transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <span>Demo</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 bg-white rounded-2xl border border-[#E9EAF3] shadow-lg">
                <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-1">
                  Интерактивни демонстрации
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/clothing" className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#F8F9FC] cursor-pointer text-xs font-semibold text-zinc-800">
                    <ShoppingBag className="w-4 h-4 text-[#4F46E5]" />
                    <div>
                      <span className="block font-bold">Демо магазин (Каталог)</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Пазаруване с размерни препоръки</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/recommendation" className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#F8F9FC] cursor-pointer text-xs font-semibold text-zinc-800">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="block font-bold">Виртуална 3D/2D Пробна</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Студиен аватар и 2D шублери</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/quiz" className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#F8F9FC] cursor-pointer text-xs font-semibold text-zinc-800">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="block font-bold">About You Quiz</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Бърз онбординг за мерки</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shoes" className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#F8F9FC] cursor-pointer text-xs font-semibold text-zinc-800">
                    <Footprints className="w-4 h-4 text-sky-600" />
                    <div>
                      <span className="block font-bold">Обувки AR Скенер</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Mondopoint ISO/TS 19407</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Right Actions (Log In & Book a Demo) */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  to={user?.role === 'seller' ? '/seller/profile' : '/profile'}
                  className="flex items-center space-x-2 text-xs bg-[#F8F9FC] hover:bg-zinc-100 border border-[#E9EAF3] px-3.5 py-2 rounded-xl transition-colors font-semibold text-[#0F1117]"
                >
                  <User size={14} className="text-[#4F46E5]" />
                  <span>{user?.name}</span>
                  <span className="text-[10px] uppercase font-bold bg-indigo-50 border border-indigo-200 text-[#4F46E5] px-2 py-0.5 rounded-full font-mono">
                    {user?.role === 'seller' ? 'Търговец' : (user?.role === 'admin' ? 'Админ' : 'Клиент')}
                  </span>
                </Link>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="border border-[#E9EAF3] text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs rounded-xl"
                >
                  Изход
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link to="/signin">
                  <Button variant="ghost" className="text-zinc-700 hover:text-[#0F1117] hover:bg-[#F8F9FC] text-xs font-semibold rounded-xl px-4 py-2">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs font-bold text-xs rounded-xl px-4 py-2.5 transition-all">
                    Book a Demo
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Затвори мобилното меню' : 'Отвори мобилното меню'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. Responsive Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#E9EAF3] space-y-3 font-sans animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-700">
              <button
                type="button"
                onClick={() => handleAnchorClick('platform')}
                className="text-left px-3 py-2.5 rounded-xl hover:bg-[#F8F9FC]"
              >
                Platform
              </button>
              <button
                type="button"
                onClick={() => handleAnchorClick('solutions')}
                className="text-left px-3 py-2.5 rounded-xl hover:bg-[#F8F9FC]"
              >
                Solutions
              </button>
              <button
                type="button"
                onClick={() => handleAnchorClick('integrations')}
                className="text-left px-3 py-2.5 rounded-xl hover:bg-[#F8F9FC]"
              >
                Integrations
              </button>
              <button
                type="button"
                onClick={() => handleAnchorClick('pricing')}
                className="text-left px-3 py-2.5 rounded-xl hover:bg-[#F8F9FC]"
              >
                Pricing
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-3 block">
                Демо среди
              </span>
              <Link
                to="/clothing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 hover:bg-[#F8F9FC]"
              >
                <ShoppingBag className="w-4 h-4 text-[#4F46E5]" />
                Демо магазин (Каталог)
              </Link>
              <Link
                to="/recommendation"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 hover:bg-[#F8F9FC]"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                Виртуална 3D/2D Пробна
              </Link>
              <Link
                to="/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 hover:bg-[#F8F9FC]"
              >
                <Sliders className="w-4 h-4 text-indigo-600" />
                About You Quiz
              </Link>
              <Link
                to="/shoes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 hover:bg-[#F8F9FC]"
              >
                <Footprints className="w-4 h-4 text-sky-600" />
                Обувки AR Скенер
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-semibold text-zinc-800">{user?.name}</span>
                  <Button onClick={logout} variant="ghost" size="sm" className="text-xs text-rose-600">
                    Изход
                  </Button>
                </div>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-xs font-bold rounded-xl border-[#E9EAF3]">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl">
                      Book a Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

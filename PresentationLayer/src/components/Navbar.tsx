import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { User, Home, ShoppingBag, Settings, Info, Sparkles, Sliders, Footprints } from 'lucide-react';
import { Link, useLocation, NavLink } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Начало', path: '/', icon: Home },
        { name: 'About You Quiz', path: '/quiz', icon: Sliders },
        { name: 'Каталог дрехи', path: '/clothing', icon: ShoppingBag },
        { name: 'Обувки', path: '/shoes', icon: Footprints },
      ];
    }

    switch (user?.role) {
      case 'user':
        return [
          { name: 'Начало', path: '/dashboard', icon: Home },
          { name: 'About You Quiz', path: '/quiz', icon: Sliders },
          { name: 'AI Препоръка', path: '/recommendation', icon: Sparkles },
          { name: 'Каталог дрехи', path: '/clothing', icon: ShoppingBag },
          { name: 'Обувки', path: '/shoes', icon: Footprints },
        ];
      case 'seller':
        return [
          { name: 'Начало', path: '/seller', icon: Home },
          { name: 'Мои обяви', path: '/seller/listings', icon: ShoppingBag },
          { name: 'Всички дрехи', path: '/clothing', icon: ShoppingBag },
        ];
      case 'admin':
        return [
          { name: 'Админ панел', path: '/admin', icon: Settings },
          { name: 'Каталог дрехи', path: '/clothing', icon: ShoppingBag },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-beige-200 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Badge */}
          <Link 
            to={isAuthenticated ? (user?.role === 'seller' ? '/seller' : (user?.role === 'admin' ? '/admin' : '/dashboard')) : '/'} 
            className="flex items-center space-x-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8956A] flex items-center justify-center text-[#2A1F1D] font-black text-sm tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              FV
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#3A2E2B]">
                Fit<span className="text-[#B8956A]">Vision</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 -mt-1 font-semibold">
                Visual Size AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-beige-100 text-[#3A2E2B] font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-[#3A2E2B] hover:bg-beige-50'
                  }`}
                >
                  <IconComponent size={16} className={isActive ? 'text-[#B8956A]' : 'text-gray-500'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-beige-100 text-[#3A2E2B] font-bold'
                    : 'text-gray-600 hover:text-[#3A2E2B] hover:bg-beige-50'
                }`
              }
            >
              <Info size={16} />
              <span>За нас</span>
            </NavLink>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to={user?.role === 'seller' ? '/seller/profile' : '/profile'} 
                  className="flex items-center space-x-2 text-sm bg-beige-50 hover:bg-beige-100 border border-beige-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <User size={16} className="text-[#B8956A]" />
                  <span className="hidden sm:inline font-medium text-gray-800">{user?.name}</span>
                  <span className="text-[10px] uppercase font-bold bg-[#DEC6A6] text-[#3A2E2B] px-1.5 py-0.2 rounded-full">
                    {user?.role === 'seller' ? 'Търговец' : (user?.role === 'admin' ? 'Админ' : 'Купувач')}
                  </span>
                </Link>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-beige-300 text-gray-700 hover:bg-beige-50 hover:text-red-600 transition-colors"
                >
                  Изход
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/signin">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-[#3A2E2B] hover:bg-beige-50">
                    Вход
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-[#B8956A] hover:bg-[#94754E] text-white shadow-sm font-medium">
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

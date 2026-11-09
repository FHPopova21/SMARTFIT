import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ClothingCard from '@/components/ClothingCard';
import { mockClothingItems } from '@/data/mockClothing';
import { ClothingItem } from '@/types';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  Store,
  Tag,
  ArrowUpDown,
  ShoppingBag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'all', label: 'Всички', icon: '🛍️' },
  { id: 'shirt', label: 'Ризи & Тениски', icon: '👔' },
  { id: 'pants', label: 'Панталони', icon: '👖' },
  { id: 'dress', label: 'Рокли', icon: '👗' },
  { id: 'jacket', label: 'Якета', icon: '🧥' },
  { id: 'sweater', label: 'Пуловери', icon: '🧶' },
  { id: 'skirt', label: 'Поли', icon: '🩱' },
];

const SIZES = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ELASTICITY_OPTIONS = [
  { id: 'all', label: 'Всички материи' },
  { id: 'elastic', label: 'Еластични' },
  { id: 'semi-elastic', label: 'Полуеластични' },
  { id: 'non-elastic', label: 'Нееластични' },
];

const ClothingListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedElasticity, setSelectedElasticity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [allItems, setAllItems] = useState<ClothingItem[]>(mockClothingItems);

  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [hasRecommendation, setHasRecommendation] = useState(false);

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const res = await fetch('/api/clothes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllItems(data);
          }
        }
      } catch (err) {
        console.warn('API clothes fetch failed, using fallback mock data:', err);
      }
    };
    fetchClothes();
  }, []);

  // Филтриране и сортиране чрез useMemo за висока производителност
  const filteredAndSortedItems = useMemo(() => {
    let result = [...allItems];

    // Търсене
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.merchantName && item.merchantName.toLowerCase().includes(term)) ||
          (item.description && item.description.toLowerCase().includes(term))
      );
    }

    // Категория
    if (selectedCategory !== 'all') {
      result = result.filter((item) => {
        const itemType = item.type as string;
        if (selectedCategory === 'shirt') {
          return itemType === 'shirt' || itemType === 't-shirt';
        }
        return itemType === selectedCategory;
      });
    }

    // Размер
    if (selectedSize !== 'all') {
      result = result.filter((item) => (item.size as string) === selectedSize);
    }

    // Еластичност / материя
    if (selectedElasticity !== 'all') {
      result = result.filter((item) => item.material === selectedElasticity);
    }

    // Сортиране
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'bg'));
        break;
      case 'featured':
      default:
        break;
    }

    return result;
  }, [allItems, searchTerm, selectedCategory, selectedSize, selectedElasticity, sortBy]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedSize !== 'all' ||
    selectedElasticity !== 'all' ||
    sortBy !== 'featured';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedElasticity('all');
    setSortBy('featured');
  };

  const handleRecommendation = (item: ClothingItem) => {
    navigate('/recommendation', { state: { selectedItem: item } });
  };

  const openDetails = async (item: ClothingItem) => {
    setSelectedItem(item);
    try {
      const res = await fetch(`/api/clothing/${item.id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    }

    if (user) {
      try {
        const recRes = await fetch('/api/user/recommendations', { credentials: 'include' });
        const recs = await recRes.json();
        setHasRecommendation(Array.isArray(recs) && recs.some((r: any) => String(r.item_identifier) === String(item.id)));
      } catch (err) {
        setHasRecommendation(false);
      }
    } else {
      setHasRecommendation(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/clothing/${selectedItem.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText('');
        toast({ title: 'Успех', description: 'Вашият отзив беше добавен!' });
        const commentsRes = await fetch(`/api/clothing/${selectedItem.id}/comments`);
        const commentsData = await commentsRes.json();
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } else {
        toast({
          title: 'Грешка',
          description: data.error ? String(data.error) : 'Възникна грешка при запазването',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Възникна грешка при комуникация със сървъра', variant: 'destructive' });
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Заглавна лента на каталога */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Badge className="bg-indigo-500/20 text-indigo-300 font-semibold mb-2 border border-indigo-500/30 text-xs font-mono">
              🛍️ FitVision Fashion Catalog
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
              Каталог Дрехи & 3D Напасване
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Изберете модел и проверете вашия персонализиран размер с точност до 98%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">
              Показване на <strong className="text-white">{filteredAndSortedItems.length}</strong> от {allItems.length} артикула
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Бързи категориини табове с икони */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? allItems.length
                : allItems.filter((i) => {
                    const t = i.type as string;
                    return cat.id === 'shirt' ? t === 'shirt' || t === 't-shirt' : t === cat.id;
                  }).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    : 'bg-[#121217] text-zinc-400 border-white/10 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Панел за филтри и търсене */}
        <Card className="glass-card mb-8 border-white/10 bg-[#121217]/80">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Търсене */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <Input
                  placeholder="Търсене по име, марка..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 text-xs h-10 rounded-xl"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-3 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Сортиране */}
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate">
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                      <SelectValue placeholder="Сортиране по..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#121217] border-white/10 text-white">
                    <SelectItem value="featured">Препоръчани (FitVision)</SelectItem>
                    <SelectItem value="price-asc">Цена: Възходяща</SelectItem>
                    <SelectItem value="price-desc">Цена: Низходяща</SelectItem>
                    <SelectItem value="name-asc">Име: А – Я</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Избор на размер */}
              <div>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Размер: {selectedSize === 'all' ? 'Всички' : selectedSize}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#121217] border-white/10 text-white">
                    {SIZES.map((sz) => (
                      <SelectItem key={sz} value={sz}>
                        {sz === 'all' ? 'Всички размери' : `Размер ${sz}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Еластичност */}
              <div>
                <Select value={selectedElasticity} onValueChange={setSelectedElasticity}>
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10 rounded-xl">
                    <SelectValue placeholder="Еластичност..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121217] border-white/10 text-white">
                    {ELASTICITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Индикатор за активни филтри */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
                <span className="text-zinc-400">
                  Приложени филтри: {filteredAndSortedItems.length} съответствия
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Изчисти всички филтри
                </button>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Мрежа с артикули */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedItems.map((item) => (
            <div key={item.id} onClick={() => openDetails(item)} className="cursor-pointer">
              <ClothingCard
                item={item}
                onRecommend={() => handleRecommendation(item)}
                onQuickView={() => openDetails(item)}
                showRecommendButton={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#121217] rounded-3xl border border-white/10 p-8 shadow-xs">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Search className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-heading">Няма намерени артикули</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
            Нито една дреха не отговаря на избраните критерии. Опитайте да изчистите някои филтри.
          </p>
          <Button
            type="button"
            onClick={resetFilters}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2 rounded-xl"
          >
            Изчисти филтрите
          </Button>
        </div>
      )}

      {/* Модален прозорец с детайли и отзиви */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl bg-[#121217] text-white rounded-3xl p-6 border-white/15">
          {selectedItem && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-1 text-[10px] font-mono font-bold">
                      {selectedItem.type.toUpperCase()} • Размер {selectedItem.size}
                    </Badge>
                    <DialogTitle className="text-2xl font-black text-white font-heading">
                      {selectedItem.name}
                    </DialogTitle>
                  </div>
                  {selectedItem.price && (
                    <span className="text-2xl font-black text-indigo-400 font-mono">
                      {Number(selectedItem.price).toFixed(2)} лв
                    </span>
                  )}
                </div>
              </DialogHeader>

              {/* Описание и характеристики */}
              <div className="space-y-4 text-xs text-zinc-300">
                {selectedItem.description && (
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/80 p-3.5 rounded-xl border border-white/5">
                    {selectedItem.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Материя</span>
                    <span className="font-bold text-white text-sm capitalize">{selectedItem.material}</span>
                  </div>
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Ширина</span>
                    <span className="font-bold text-white text-sm">{selectedItem.measurements.width} см</span>
                  </div>
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Дължина</span>
                    <span className="font-bold text-white text-sm">{selectedItem.measurements.length} см</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-900/90 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-zinc-200">
                      Търговец: {selectedItem.merchantName || 'FitVision Store'}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedItem(null);
                      handleRecommendation(selectedItem);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.35)] flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    3D Виртуална Пробна
                  </Button>
                </div>
              </div>

              {/* Раздел: Отзиви и коментари */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center justify-between">
                  <span>Потребителски отзиви ({comments.length})</span>
                  {hasRecommendation && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono">
                      ✓ Проверена препоръка
                    </Badge>
                  )}
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-2">Все още няма отзиви за този артикул.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-zinc-900/80 rounded-xl p-3 border border-white/10 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200">{c.user_name || 'Потребител'}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(c.created_at).toLocaleDateString('bg-BG')}
                          </span>
                        </div>
                        <p className="text-zinc-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {user && hasRecommendation ? (
                  <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Споделете как ви пасна размерът..."
                      className="text-xs bg-zinc-900 border-white/10 text-white rounded-xl focus:border-indigo-500"
                      rows={2}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      {commentLoading ? 'Изпращане...' : 'Публикувай отзив'}
                    </Button>
                  </form>
                ) : user ? (
                  <p className="text-[11px] text-zinc-500 italic pt-1">
                    * За да оставите отзив, първо генерирайте AI препоръка за тази дреха.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default ClothingListing;

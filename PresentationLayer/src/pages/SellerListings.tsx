import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Package, Sparkles } from 'lucide-react';
import { mockClothingItems } from '@/data/mockClothing';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import ClothingCard from '@/components/ClothingCard';
import { ClothingItem } from '@/types';

const SellerListings = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sellerItems, setSellerItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Форма за добавяне на нова обява
  const [formData, setFormData] = useState({
    name: '',
    type: 'shirt',
    material: 'elastic',
    size: 'M',
    width: '',
    length: '',
    sleeves: '',
    price: '',
    description: '',
    image_url: ''
  });

  const fetchSellerClothes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/clothes?seller_id=${user.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSellerItems(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch seller clothes from API:', err);
    } finally {
      setLoading(false);
    }
    // Fallback към mock данни при липса на връзка
    const fallback = mockClothingItems.filter(item => 
      (item.merchantName || item.sellerName) === user?.name || 
      (item.merchantId || item.sellerId) === String(user?.id)
    );
    setSellerItems(fallback);
  };

  useEffect(() => {
    fetchSellerClothes();
  }, [user]);

  const filteredItems = sellerItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const clothingTypes = [
    { value: 'all', label: 'Всички типове' },
    { value: 'shirt', label: 'Ризи' },
    { value: 'pants', label: 'Панталони' },
    { value: 'dress', label: 'Рокли' },
    { value: 'jacket', label: 'Якета' },
    { value: 'skirt', label: 'Поли' },
    { value: 'sweater', label: 'Пуловери' },
  ];

  const handleCreateClothing = async (e: React.FormEvent) => {
    e.preventDefault();
    const widthVal = parseFloat(formData.width);
    const lengthVal = parseFloat(formData.length);
    if (!formData.name.trim() || isNaN(widthVal) || isNaN(lengthVal) || widthVal <= 0 || lengthVal <= 0) {
      toast({
        title: 'Невалидни данни',
        description: 'Моля, въведете коректно име, положителна ширина и дължина в сантиметри.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/seller/clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          material: formData.material,
          size: formData.size,
          width: parseFloat(formData.width),
          length: parseFloat(formData.length),
          sleeves: formData.sleeves ? parseFloat(formData.sleeves) : null,
          price: formData.price ? parseFloat(formData.price) : 0,
          description: formData.description,
          image_url: formData.image_url
        })
      });

      if (res.ok) {
        toast({
          title: 'Успех!',
          description: 'Новата обява беше добавена в каталога.'
        });
        setIsAddOpen(false);
        setFormData({
          name: '',
          type: 'shirt',
          material: 'elastic',
          size: 'M',
          width: '',
          length: '',
          sleeves: '',
          price: '',
          description: '',
          image_url: ''
        });
        fetchSellerClothes();
      } else {
        const errData = await res.json();
        toast({
          title: 'Грешка',
          description: errData.error || 'Неуспешно добавяне на обявата.',
          variant: 'destructive'
        });
      }
    } catch (e) {
      toast({
        title: 'Грешка',
        description: 'Възникна мрежова грешка при свързване със сървъра.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете тази обява?')) return;
    try {
      const res = await fetch(`/api/seller/clothes/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast({ title: 'Изтрита', description: 'Обявата беше премахната успешно.' });
        setSellerItems(prev => prev.filter(item => String(item.id) !== String(itemId)));
      } else {
        setSellerItems(prev => prev.filter(item => String(item.id) !== String(itemId)));
      }
    } catch (e) {
      console.error('Delete failed:', e);
      setSellerItems(prev => prev.filter(item => String(item.id) !== String(itemId)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-[#FAFAFC]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-950 font-heading mb-2 flex items-center">
              <Package className="w-8 h-8 mr-3 text-indigo-600" />
              Мои обяви
            </h1>
            <p className="text-zinc-600 text-sm">
              Управлявайте вашите обяви за дрехи в каталога на FitVision с пълна съвместимост по ISO 8559.
            </p>
          </div>
          <Button 
            className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold shadow-xs rounded-xl" 
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Нова обява
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-zinc-950 text-lg font-heading">
            <Search className="w-5 h-5 mr-2 text-indigo-600" />
            Филтри
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-700">Търсене</label>
              <Input
                placeholder="Търсене по име на дреха..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-zinc-200 focus:border-indigo-600 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-700">Тип дреха</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="border-zinc-200 focus:border-indigo-600 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clothingTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="mb-4">
        <p className="text-zinc-500 font-mono text-xs">
          Намерени <span className="font-bold text-zinc-950">{filteredItems.length}</span> от {sellerItems.length} обяви
        </p>
      </div>

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <ClothingCard
            key={item.id}
            item={item}
            onEdit={() => console.log('Редакция:', item.id)}
            onDelete={() => handleDelete(item.id)}
            showSellerActions={true}
          />
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
          <p className="text-zinc-400 text-sm font-medium">Няма намерени обяви по зададените критерии.</p>
        </div>
      )}

      {/* Модален прозорец за добавяне на нова обява */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-zinc-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-heading text-zinc-950">
              <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
              Добавяне на нова обява за дреха
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateClothing} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-mono font-bold text-zinc-700">Име на артикула *</label>
              <Input
                placeholder="напр. Класическа бяла риза"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Тип дреха</label>
                <Select 
                  value={formData.type} 
                  onValueChange={v => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shirt">Риза</SelectItem>
                    <SelectItem value="pants">Панталон</SelectItem>
                    <SelectItem value="dress">Рокля</SelectItem>
                    <SelectItem value="jacket">Яке</SelectItem>
                    <SelectItem value="sweater">Пуловер</SelectItem>
                    <SelectItem value="skirt">Пола</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Материя</label>
                <Select 
                  value={formData.material} 
                  onValueChange={v => setFormData({ ...formData, material: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elastic">Еластична</SelectItem>
                    <SelectItem value="semi-elastic">Полу-еластична</SelectItem>
                    <SelectItem value="non-elastic">Нееластична</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Размер</label>
                <Select 
                  value={formData.size} 
                  onValueChange={v => setFormData({ ...formData, size: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Ширина (см) *</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="напр. 52"
                  value={formData.width}
                  onChange={e => setFormData({ ...formData, width: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Дължина (см) *</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="напр. 75"
                  value={formData.length}
                  onChange={e => setFormData({ ...formData, length: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Ръкави (см)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="по избор"
                  value={formData.sleeves}
                  onChange={e => setFormData({ ...formData, sleeves: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Цена (лв)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="напр. 49.99"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">URL на снимка</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Описание</label>
              <Textarea
                placeholder="Кратко описание на модела и кройката..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-zinc-200">
                Отказ
              </Button>
              <Button type="submit" className="bg-zinc-950 hover:bg-zinc-850 text-white font-bold rounded-xl shadow-xs" disabled={submitting}>
                {submitting ? 'Записване...' : 'Създай обява'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerListings;

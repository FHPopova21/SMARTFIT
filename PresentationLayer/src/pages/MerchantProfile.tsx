
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockClothingItems } from '@/data/mockClothing';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

const MerchantProfile = () => {
  const { user } = useAuthStore();

  // Filter listings for this merchant
  const [listings, setListings] = useState(
    mockClothingItems.filter(item => item.merchantId === String(user?.id))
  );

  // Mock recommendation requests per listing
  const recommendationRequests = listings.map(item => ({
    id: item.id,
    name: item.name,
    requests: Math.floor(Math.random() * 20) + 1, // mock data
    gender: Math.random() > 0.5 ? 'male' : 'female',
  }));

  const handleDelete = (id: string) => {
    setListings(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 min-h-screen bg-[#FAFAFC]">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 bg-white border border-zinc-200 rounded-3xl shadow-xs p-8 mb-4">
        <Avatar className="w-24 h-24 border-2 border-indigo-200 shadow-xs">
          <AvatarFallback className="text-3xl bg-indigo-50 text-indigo-700 font-bold">
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-zinc-950 font-heading mb-1 flex items-center gap-3">
            {user?.name || 'Merchant'}
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">{user?.role}</span>
          </h1>
          <div className="text-zinc-500 text-sm font-mono">{user?.email}</div>
          <Button asChild className="mt-4 px-6 py-2 text-xs font-bold bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl shadow-xs">
            <Link to="/profile/edit">Редакция на профил</Link>
          </Button>
        </div>
      </div>

      {/* Listings Section */}
      <Card className="bg-white border border-zinc-200/80 rounded-3xl shadow-xs mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-zinc-950 font-heading flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Мои обяви
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length > 0 ? (
            <ul className="grid md:grid-cols-2 gap-4">
              {listings.map(listing => (
                <li key={listing.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 shadow-xs hover:border-zinc-300 transition-all relative">
                  <div className="font-bold text-base text-zinc-950 mb-1">{listing.name}</div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono text-zinc-600 mb-2">
                    <span className="bg-white border border-zinc-200 px-2 py-0.5 rounded-lg">Размер: {listing.size}</span>
                    <span className="bg-white border border-zinc-200 px-2 py-0.5 rounded-lg">Материя: {listing.material}</span>
                  </div>
                  <div className="text-zinc-950 font-mono font-bold text-base mb-2">{listing.price} лв.</div>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="absolute top-3 right-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-xs transition-colors"
                  >
                    Изтрий
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-zinc-400 text-sm py-8 text-center">Няма намерени обяви.</div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Requests Section */}
      <Card className="glass-card bg-white/90 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">Recommendation Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendationRequests.length > 0 ? (
            <ul className="grid md:grid-cols-2 gap-6">
              {recommendationRequests.map(req => (
                <li key={req.id} className="rounded-xl border border-green-200 bg-green-50 p-4 shadow hover:shadow-lg transition-all duration-200">
                  <div className="font-semibold text-lg text-green-800 mb-1">{req.name}</div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-700 mb-2">
                    <span className="bg-green-200 px-2 py-1 rounded">{req.requests} users</span>
                    <span className="bg-green-200 px-2 py-1 rounded">Gender: {req.gender}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No recommendation requests found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantProfile; 
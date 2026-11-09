import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Ако имейлът е регистриран, ще получите линк за смяна на паролата.');
      } else {
        setError(data.error || 'Възникна грешка.');
      }
    } catch (err) {
      setError('Възникна грешка при изпращане.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xs">
        <h2 className="text-2xl font-black mb-2 text-zinc-950 font-heading">Забравена парола</h2>
        <p className="text-zinc-500 text-xs mb-6">Въведете вашия имейл, за да получите инструкции за възстановяване.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-mono font-bold text-zinc-700">Имейл адрес</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="border-zinc-200 focus:border-indigo-600 rounded-xl mt-1.5"
            />
          </div>
          <Button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold rounded-xl py-2.5 shadow-xs" disabled={loading}>
            {loading ? 'Изпращане...' : 'Изпрати линк за възстановяване'}
          </Button>
        </form>
        {message && <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-mono">{message}</div>}
        {error && <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-mono">{error}</div>}
        <Button variant="link" className="mt-4 w-full text-zinc-600 hover:text-zinc-950 text-xs font-mono" onClick={() => navigate('/signin')}>Назад към вход</Button>
      </div>
    </div>
  );
};

export default ForgotPassword; 
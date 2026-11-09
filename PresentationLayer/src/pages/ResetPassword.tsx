import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Паролите не съвпадат.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Паролата трябва да е поне 6 символа.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm_password: confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Паролата е сменена успешно.');
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
        <h2 className="text-2xl font-black mb-2 text-zinc-950 font-heading">Нова парола</h2>
        <p className="text-zinc-500 text-xs mb-6">Въведете вашата нова парола за достъп.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-xs font-mono font-bold text-zinc-700">Нова парола</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="border-zinc-200 focus:border-indigo-600 rounded-xl mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-xs font-mono font-bold text-zinc-700">Потвърди парола</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="border-zinc-200 focus:border-indigo-600 rounded-xl mt-1.5"
            />
          </div>
          <Button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold rounded-xl py-2.5 shadow-xs" disabled={loading}>
            {loading ? 'Записване...' : 'Запази новата парола'}
          </Button>
        </form>
        {message && <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-mono">{message}</div>}
        {error && <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-mono">{error}</div>}
        <Button variant="link" className="mt-4 w-full text-zinc-600 hover:text-zinc-950 text-xs font-mono" onClick={() => navigate('/signin')}>Към вход</Button>
      </div>
    </div>
  );
};

export default ResetPassword; 
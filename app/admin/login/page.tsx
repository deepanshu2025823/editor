'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.require2FA) {
        setStep('2fa'); 
        setLoading(false);
        return; 
      }

      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      router.push('/admin');

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otpCode }), 
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Verification failed');

      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      router.push('/admin');

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative bg-[#0f172a] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            {step === 'credentials' ? <Lock className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {step === 'credentials' ? 'Admin Portal' : 'Two-Factor Auth'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {step === 'credentials' ? 'Secure Command Center Access' : 'Enter the code from your authenticator app.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Admin Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  placeholder="admin@enterprise.os"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {step === '2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block text-center">Authentication Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="000000"
              />
            </div>

            <button 
              disabled={loading || otpCode.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Identity'}
            </button>

            <button 
              type="button"
              onClick={() => { setStep('credentials'); setOtpCode(''); }}
              className="w-full text-slate-500 hover:text-slate-300 text-sm font-medium transition"
            >
              Back to Login
            </button>
          </form>
        )}

      </div>
      
      <div className="absolute bottom-6 text-slate-600 text-xs font-medium">
        Secure Enterprise System • v2.4.0
      </div>

    </div>
  );
}
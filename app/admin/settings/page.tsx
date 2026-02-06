'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { User, Lock, Shield, Save, Bell, Server, AlertTriangle, Smartphone, X, Loader2 } from 'lucide-react';

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  const [admin, setAdmin] = useState({ id: 0, username: '', email: '', role: '' });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [preferences, setPreferences] = useState({ emailAlerts: true, systemSounds: false });

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
      try {
          const res = await fetch('/api/admin/settings');
          if (!res.ok) return; 
          const data = await res.json();
          
          if (data.id) {
              setAdmin({ id: data.id, username: data.username, email: data.email, role: data.role });
              setIs2FAEnabled(!!data.two_factor_enabled);
              if (data.preferences) setPreferences(data.preferences);
          }
      } catch (e) { console.error("Fetch Settings Error:", e); }
  };

  const handleUpdateProfile = async (e: any) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'profile', id: admin.id, username: admin.username, email: admin.email })
        });
        if(res.ok) alert("Profile Updated!");
        else alert("Update failed.");
      } catch (e) { alert("Error updating profile"); }
      finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e: any) => {
      e.preventDefault();
      if (password.new !== password.confirm) return alert("Passwords do not match!");
      
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'password', id: admin.id, newPassword: password.new })
        });
        if(res.ok) {
            alert("Password Changed Successfully!");
            setPassword({ current: '', new: '', confirm: '' });
        } else {
            alert("Error changing password.");
        }
      } catch (e) { alert("Server error."); }
      finally { setLoading(false); }
  };

  const init2FA = async () => {
      if (is2FAEnabled) {
          if(!confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) return;
          
          try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'disable-2fa', id: admin.id })
            });
            if (res.ok) {
                setIs2FAEnabled(false);
                alert("2FA Disabled.");
            }
          } catch (e) { alert("Error disabling 2FA"); }

      } else {
          setQrLoading(true);
          try {
              const res = await fetch('/api/admin/settings', {
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: admin.username })
              });
              
              const data = await res.json();
              
              if (!res.ok) throw new Error(data.error || "Generation Failed");

              if (data.imageUrl && data.secret) {
                  setQrCode(data.imageUrl);
                  setTempSecret(data.secret);
                  setShow2FAModal(true);
              } else {
                  alert("Invalid response from server. Check logs.");
              }
          } catch (e) { 
              console.error(e);
              alert("Failed to generate QR Code. Ensure 'otplib' and 'qrcode' are installed on server."); 
          } finally {
              setQrLoading(false);
          }
      }
  };

  const verifyAndEnable2FA = async () => {
      if(!otpToken || otpToken.length < 6) return alert("Please enter 6-digit code");

      try {
        const res = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'verify-2fa', id: admin.id, token: otpToken, secret: tempSecret })
        });
        
        if (res.ok) {
            setIs2FAEnabled(true);
            setShow2FAModal(false);
            setOtpToken('');
            alert("✅ 2FA Enabled Successfully!");
        } else {
            const data = await res.json();
            alert(`Verification Failed: ${data.error || 'Invalid Code'}`);
        }
      } catch (e) { alert("Verification error."); }
  };

  const togglePreference = async (key: string) => {
      const newPrefs = { ...preferences, [key]: !preferences[key as keyof typeof preferences] };
      setPreferences(newPrefs); 
      
      await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'system', id: admin.id, preferences: newPrefs })
      });
  };

  const handleClearData = async (type: string) => {
      if(!confirm("⚠️ WARNING: This action is permanent. Are you sure?")) return;
      
      await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id: admin.id })
      });
      alert("Action Completed.");
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {show2FAModal && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#1e1e24] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-8 text-center relative">
                  <button onClick={() => setShow2FAModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                  
                  <h3 className="text-xl font-bold text-white mb-2">Setup 2-Factor Auth</h3>
                  <p className="text-sm text-slate-400 mb-6">Scan this QR code with Google Authenticator.</p>
                  
                  <div className="bg-white p-3 rounded-xl inline-block mb-6 shadow-lg shadow-white/5">
                      {qrCode ? (
                          <img src={qrCode} alt="QR Code" className="w-48 h-48 object-contain" />
                      ) : (
                          <div className="w-48 h-48 flex items-center justify-center text-black">Loading...</div>
                      )}
                  </div>

                  <div className="mb-6">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Enter 6-Digit Code</label>
                      <input 
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={6}
                        placeholder="000 000"
                        className="w-full text-center bg-[#2a2a30] border border-slate-600 rounded-lg p-3 text-lg font-mono tracking-widest focus:border-blue-500 outline-none text-white transition focus:ring-1 focus:ring-blue-500"
                      />
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setShow2FAModal(false)} className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">Cancel</button>
                      <button onClick={verifyAndEnable2FA} className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-900/30">Verify & Enable</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <header className="mb-8">
           <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">Settings & Configuration</h1>
           <p className="text-slate-400 text-sm mt-1">Manage your account and system preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-2">
                {[ { id: 'general', label: 'General', icon: User }, { id: 'security', label: 'Security', icon: Lock }, { id: 'system', label: 'System', icon: Server } ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="lg:col-span-3">
                {activeTab === 'general' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Profile Information</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Username</label><input value={admin.username} onChange={(e) => setAdmin({...admin, username: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-sm" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email</label><input value={admin.email} onChange={(e) => setAdmin({...admin, email: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-sm" /></div>
                            </div>
                            <div className="flex justify-end"><button disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 text-white transition disabled:opacity-50"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}</button></div>
                        </form>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Smartphone className="w-5 h-5 text-purple-500" /> Two-Factor Authentication</h2>
                            <p className="text-sm text-slate-400 mb-6">Scan QR with Google Authenticator to secure account.</p>
                            <div className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-700">
                                <div><p className="font-bold text-sm text-white">Authenticator App</p><p className="text-xs text-slate-500 mt-1">{is2FAEnabled ? '✅ Account Secured' : '⚠️ Not enabled'}</p></div>
                                
                                {qrLoading ? (
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                ) : (
                                    <button onClick={init2FA} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is2FAEnabled ? 'bg-green-500' : 'bg-slate-600'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is2FAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-green-500" /> Change Password</h2>
                            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">New Password</label><input type="password" value={password.new} onChange={(e) => setPassword({...password, new: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-sm" placeholder="••••••••" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Confirm Password</label><input type="password" value={password.confirm} onChange={(e) => setPassword({...password, confirm: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-sm" placeholder="••••••••" /></div>
                                <div className="pt-2"><button disabled={loading} className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 text-white transition disabled:opacity-50"><Save className="w-4 h-4" /> Update</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-500" /> Notifications</h2>
                            <div className="flex items-center justify-between py-4 border-b border-slate-800">
                                <div><p className="font-bold text-sm text-white">Email Alerts</p><p className="text-xs text-slate-500">For high-priority events.</p></div>
                                <button onClick={() => togglePreference('emailAlerts')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.emailAlerts ? 'bg-blue-600' : 'bg-slate-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                            </div>
                            <div className="flex items-center justify-between py-4">
                                <div><p className="font-bold text-sm text-white">System Sounds</p><p className="text-xs text-slate-500">For incoming chats.</p></div>
                                <button onClick={() => togglePreference('systemSounds')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.systemSounds ? 'bg-blue-600' : 'bg-slate-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.systemSounds ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-red-900/30 rounded-2xl p-8">
                            <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h2>
                            <div className="flex gap-4">
                                <button onClick={() => handleClearData('danger-chat')} className="border border-red-800 text-red-500 hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-bold transition">Clear All Chat Logs</button>
                                <button onClick={() => handleClearData('danger-attendance')} className="border border-red-800 text-red-500 hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-bold transition">Reset Attendance Data</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
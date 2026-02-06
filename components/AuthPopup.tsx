'use client';
import { useState, useRef } from 'react';

export default function AuthPopup({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    designation: ''
  });
  const [profilePhotoBtnStr, setProfilePhotoBtnStr] = useState<string | null>(null);

  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      setIsEmailValid(false);
      setEmailError('');
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.email) return;
    setEmailError('');

    try {
      const res = await fetch('/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!data.isValid) {
        setEmailError(data.message);
        setIsEmailValid(false);
      } else {
        setIsEmailValid(true);
      }
    } catch (error) {
      setEmailError("Verification failed.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Image must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoBtnStr(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!isLogin && !isEmailValid) {
      setFormError("Please verify your email address first.");
      return;
    }

    setIsLoading(true);

    const payload = {
      action: isLogin ? 'login' : 'signup',
      email: formData.email,
      password: formData.password,
      ...(isLogin ? {} : {
        full_name: formData.full_name,
        designation: formData.designation,
        profile_photo: profilePhotoBtnStr
      })
    };

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
      } else {
        if (isLogin) {
          onLogin(data.user);
        } else {
          setSuccessMessage(data.message);
          setFormData({ full_name: '', email: '', password: '', designation: '' });
          setProfilePhotoBtnStr(null);
          setIsEmailValid(false);
        }
      }
    } catch (err) {
      setFormError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl flex max-w-[950px] w-full overflow-hidden min-h-[600px] animate-in fade-in zoom-in duration-300">
        <div className="hidden md:flex w-5/12 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 relative flex-col justify-between p-10 text-white">
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-50"></div>
           <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-500 rounded-full blur-[100px] opacity-40"></div>

           <div className="relative z-10">
               <div className="flex items-center gap-3 font-bold text-2xl tracking-tight mb-2">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center text-blue-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  Enterprise OS
               </div>
               <p className="text-blue-200 text-sm">Autonomous Business Intelligence</p>
           </div>

           <div className="relative z-10 mb-8">
              <h2 className="text-3xl font-bold leading-tight mb-6">
                Secure. Scalable. <br/> <span className="text-blue-400">Autonomous.</span>
              </h2>
              
              <div className="space-y-4">
                <FeatureItem icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" text="AI-Driven Attendance" />
                <FeatureItem icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" text="Zero-Exfiltration Security" />
                <FeatureItem icon="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" text="Live Surveillance" />
              </div>
           </div>

           <div className="relative z-10 text-xs text-slate-400">
              © 2026 Enterprise OS Inc.
           </div>
        </div>

        <div className="w-full md:w-7/12 bg-white flex flex-col relative overflow-y-auto">
          <div className="md:hidden p-6 bg-slate-900 text-white flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="font-bold text-lg">Enterprise OS</span>
          </div>

          <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">
             
             <div className="mb-8">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                   {isLogin ? 'Welcome Back' : 'Start your journey'}
                </h3>
                <h1 className="text-2xl font-extrabold text-slate-900">
                   {isLogin ? 'Log in to your account' : 'Create Employee Profile'}
                </h1>
                <p className="text-slate-500 mt-2 text-xs">
                   {isLogin ? 'Enter your email and password to access the workspace.' : 'Please fill in your details for admin verification.'}
                </p>
             </div>

             {formError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 text-sm font-medium flex items-center gap-2 animate-pulse">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {formError}
                </div>
             )}
             {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r text-green-700 text-sm font-medium flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {successMessage}
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                   <div className="flex items-center gap-5 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-16 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:text-blue-500 text-slate-400 transition-all shadow-sm overflow-hidden group"
                      >
                         {profilePhotoBtnStr ? (
                            <img src={profilePhotoBtnStr} className="w-full h-full object-cover" />
                         ) : (
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                         )}
                      </div>
                      <div>
                         <h4 className="font-semibold text-slate-800">Profile Photo</h4>
                         <p className="text-xs text-slate-500 mb-2">Max 2MB. Visible to administration.</p>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded transition">
                            Upload Image
                         </button>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                      </div>
                   </div>
                )}

                {!isLogin && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-600 uppercase">Full Name</label>
                         <input 
                            name="full_name" 
                            placeholder="e.g. John Doe" 
                            value={formData.full_name} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-600 uppercase">Designation</label>
                         <input 
                            name="designation" 
                            placeholder="e.g. Developer" 
                            value={formData.designation} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                         />
                      </div>
                   </div>
                )}

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-600 uppercase">Official Email</label>
                   <div className="relative">
                      <input
                         name="email"
                         type="email"
                         value={formData.email}
                         onChange={handleChange}
                         onBlur={!isLogin ? handleEmailBlur : undefined}
                         className={`w-full px-4 py-3 rounded-lg border ${(!isLogin && emailError) ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-50/50'} outline-none focus:ring-4 transition-all placeholder:text-slate-400 text-slate-800`}
                         placeholder="name@company.com"
                      />
                      {!isLogin && isEmailValid && (
                         <div className="absolute right-3 top-3.5 text-green-500">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         </div>
                      )}
                      {!isLogin && emailError && (
                         <div className="absolute right-3 top-3.5 text-red-500">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </div>
                      )}
                   </div>
                   {!isLogin && emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                </div>

                <div className="space-y-1">
                   <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase">Password</label>
                      {isLogin && <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Forgot Password?</a>}
                   </div>
                   <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      placeholder="••••••••"
                   />
                </div>

                <button
                   type="submit"
                   disabled={isLoading || (!isLogin && !isEmailValid)}
                   className={`
                      w-full py-4 rounded-lg font-bold text-sm tracking-wide text-white shadow-lg transition-all transform active:scale-[0.99]
                      ${isLoading || (!isLogin && !isEmailValid) 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30'}
                   `}
                >
                   {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                         <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Verifying...
                      </span>
                   ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                   )}
                </button>

             </form>
             
             <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                   {isLogin ? "New to the company?" : "Already verified?"} 
                   <button 
                      onClick={() => { setIsLogin(!isLogin); setFormError(''); setEmailError(''); setSuccessMessage(''); }}
                      className="ml-2 text-blue-600 font-bold hover:text-blue-800 hover:underline transition"
                   >
                      {isLogin ? "Create an account" : "Log in here"}
                   </button>
                </p>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const FeatureItem = ({ icon, text }: { icon: string, text: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-green-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
        <span className="text-slate-200 text-sm font-medium">{text}</span>
    </div>
);
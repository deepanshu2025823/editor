'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client'; 
import { Search, Bell, LogOut, User, Menu, ChevronDown, Loader2, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  user: {
    username: string;
    role: string;
    email?: string;
  };
  onLogout: () => void;
}

export default function Header({ toggleSidebar, user, onLogout }: HeaderProps) {
  const router = useRouter();
  
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
        const res = await fetch('/api/admin/notifications'); 
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.read).length);
            }
        }
    } catch (error) {
        console.warn("Failed to fetch notifications");
    } finally {
        setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let socket: any;
    try {
        socket = io(window.location.origin, { 
            path: '/api/socket', 
            addTrailingSlash: false,
            reconnectionAttempts: 5, 
            transports: ['polling', 'websocket'], // Polling required for initial handshake
            query: { role: 'admin' }
        });

        socket.on('connect', () => console.log('Socket Connected'));
        
        socket.on('new_notification', (newNotification: any) => {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        socket.on('admin-notification', (note: any) => {
             const newNote = { ...note, id: Date.now(), read: false, created_at: new Date().toISOString() };
             setNotifications((prev) => [newNote, ...prev]);
             setUnreadCount((prev) => prev + 1);
        });

    } catch (e) { console.error("Socket Error", e); }

    return () => { if(socket) socket.disconnect(); };
  }, []);

  const handleSearch = (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (query.length > 1) {
        setIsSearching(true);
        setShowSearchDropdown(true);
        searchDebounce.current = setTimeout(async () => {
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    fetch('/api/admin/users'),
                    fetch('/api/admin/projects')
                ]);
                const users = await usersRes.json();
                const projects = await projectsRes.json();
                
                const filteredUsers = Array.isArray(users) ? users.filter((u: any) => u.full_name?.toLowerCase().includes(query.toLowerCase())) : [];
                const filteredProjects = Array.isArray(projects) ? projects.filter((p: any) => p.name?.toLowerCase().includes(query.toLowerCase())) : [];

                const results = [
                    ...filteredUsers.map((u: any) => ({ type: 'Employee', title: u.full_name, sub: u.designation || 'N/A', id: u.id, link: '/admin/employees' })),
                    ...filteredProjects.map((p: any) => ({ type: 'Project', title: p.name, sub: p.status, id: p.id, link: '/admin/projects' }))
                ];
                setSearchResults(results);
            } catch (error) { setSearchResults([]); } 
            finally { setIsSearching(false); }
        }, 500);
    } else { setShowSearchDropdown(false); setIsSearching(false); }
  };

  const handleResultClick = (link: string) => {
      router.push(link);
      setShowSearchDropdown(false);
      setSearchQuery('');
  };

  const markAllRead = async () => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await fetch('/api/admin/notifications/mark-read', { method: 'POST' });
  };

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 md:px-6 backdrop-blur">
      
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white transition p-1"><Menu className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-white hidden md:block">Dashboard</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchRef}>
        <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition" />
            </div>
            <input 
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Search..." 
            />
            {showSearchDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    {isSearching ? (
                        <div className="p-4 text-center text-slate-500 text-xs flex justify-center items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map((result, idx) => (
                                <li key={idx} onClick={() => handleResultClick(result.link)} className="px-4 py-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0 transition">
                                    <div className="flex justify-between items-center">
                                        <div><p className="text-sm font-bold text-white">{result.title}</p><p className="text-xs text-slate-500">{result.sub}</p></div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${result.type === 'Employee' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'}`}>{result.type}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <div className="p-4 text-center text-slate-500 text-xs">No results found.</div>}
                </div>
            )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
         <div className="relative" ref={notifRef}>
             <button onClick={() => setNotifOpen(!isNotifOpen)} className="relative text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800">
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-slate-950 rounded-full animate-pulse"></span>}
                <Bell className="w-5 h-5" />
             </button>

             {isNotifOpen && (
                 <>
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setNotifOpen(false)}></div>
                    {/* FIXED CENTERING FOR MOBILE */}
                    <div className="fixed left-1/2 -translate-x-1/2 top-20 w-[90vw] max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 md:absolute md:left-auto md:right-0 md:top-full md:translate-x-0 md:w-80">
                        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h3 className="text-sm font-bold text-white">Notifications ({unreadCount})</h3>
                            <button onClick={markAllRead} className="text-[10px] text-blue-400 hover:text-blue-300">Mark read</button>
                        </div>
                        <div className="max-h-[60vh] md:max-h-64 overflow-y-auto">
                            {loadingNotifs ? (
                                <div className="p-6 text-center text-slate-500 text-xs flex justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                            ) : notifications.length > 0 ? (
                                notifications.map((note, idx) => (
                                    <div key={note.id || idx} className={`px-4 py-3 border-b border-slate-800 last:border-0 transition cursor-pointer ${note.read ? 'opacity-50 hover:opacity-100 hover:bg-slate-800' : 'bg-slate-800/40 hover:bg-slate-800'}`}>
                                        <div className="flex items-start gap-3">
                                            {note.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                                            <div>
                                                <p className="text-sm text-slate-200 leading-tight">{note.message}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{note.created_at ? new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>}
                        </div>
                    </div>
                 </>
             )}
         </div>

         <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center gap-2 md:gap-3 pl-2 md:pl-6 border-l border-slate-800 focus:outline-none group">
                <div className="text-right hidden md:block">
                   <p className="text-sm font-bold text-white group-hover:text-blue-400 transition">{user?.username || 'Admin'}</p>
                   <p className="text-xs text-slate-400 capitalize">{user?.role || 'Administrator'}</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                   {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <ChevronDown className={`hidden md:block w-4 h-4 text-slate-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setProfileOpen(false)}></div>
                    {/* FIXED CENTERING FOR MOBILE */}
                    <div className="fixed left-1/2 -translate-x-1/2 top-20 w-[90vw] max-w-[250px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 z-50 md:absolute md:left-auto md:right-0 md:top-full md:translate-x-0 md:w-48">
                        <div className="px-4 py-3 border-b border-slate-800 md:hidden flex items-center gap-3 bg-slate-950/50">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">{user?.username?.charAt(0) || 'A'}</div>
                            <div>
                                <p className="text-sm text-white font-bold">{user?.username}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/admin/settings')} className="w-full text-left px-4 py-3 md:py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition"><User className="w-4 h-4" /> My Profile</button>
                        <button onClick={onLogout} className="w-full text-left px-4 py-3 md:py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition"><LogOut className="w-4 h-4" /> Logout</button>
                    </div>
                </>
            )}
         </div>
      </div>
    </header>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { Users, Briefcase, Clock, TrendingUp, Filter, MoreVertical, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // Stats for Funnel & Graphs
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalProjects: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const adminData = localStorage.getItem('admin_user');
            if (!adminData || adminData === 'undefined') throw new Error("No session");
            setAdmin(JSON.parse(adminData));
            fetchDashboardData(); 
        } catch (error) {
            router.push('/admin/login'); 
        }
    };
    checkAuth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userRes, projectRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/projects')
      ]);

      const userData = await userRes.json();
      const projectData = await projectRes.json();

      const validUsers = Array.isArray(userData) ? userData : [];
      const validProjects = Array.isArray(projectData) ? projectData : [];

      setUsers(validUsers);
      setProjects(validProjects);

      // Calculate Stats Dynamically
      setStats({
          totalUsers: validUsers.length,
          activeUsers: validUsers.filter(u => u.status === 'active').length,
          pendingUsers: validUsers.filter(u => u.status === 'pending').length,
          rejectedUsers: validUsers.filter(u => u.status === 'rejected').length,
          totalProjects: validProjects.length,
          activeProjects: validProjects.filter(p => p.status === 'active').length,
          completedProjects: validProjects.filter(p => p.status === 'completed').length,
      });

    } catch (e) { console.error("Data Error", e); } 
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
        await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
        fetchDashboardData(); 
    } catch (e) { console.error("Update failed", e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (!admin) return null;

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* SIDEBAR - Mobile: Fixed & Hidden by default | Desktop: Fixed & Visible */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar isOpen={true} setIsOpen={setSidebarOpen} />
      </aside>

      {/* OVERLAY for Mobile - Closes sidebar when clicked */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT WRAPPER - Pushes content on Desktop, Full width on Mobile */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 relative min-h-screen w-full">
        
        {/* Header receives toggle function for hamburger menu */}
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={admin} onLogout={handleLogout} />

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto overflow-x-hidden">
          
          {/* --- STATS GRID (Responsive: 1 col mobile -> 2 col tablet -> 4 col desktop) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 transition shadow-lg relative group">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Staff</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition"><Users className="w-5 h-5"/></div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-green-400 gap-1"><TrendingUp className="w-3 h-3"/> +12% this month</div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/30 transition shadow-lg relative group">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Projects</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.activeProjects}</h3>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition"><Briefcase className="w-5 h-5"/></div>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(stats.activeProjects / (stats.totalProjects || 1)) * 100}%` }}></div>
                  </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-orange-500/30 transition shadow-lg relative group">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Requests</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.pendingUsers}</h3>
                      </div>
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 group-hover:scale-110 transition"><Clock className="w-5 h-5"/></div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">Requires immediate attention</p>
              </div>

              {/* Card 4 */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-2xl flex flex-col justify-between shadow-xl shadow-blue-900/20 relative overflow-hidden">
                  <div className="relative z-10">
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Productivity</p>
                      <h3 className="text-2xl font-bold text-white mt-1">94%</h3>
                  </div>
                  <div className="mt-4 text-xs text-blue-100 bg-white/10 px-2 py-1 rounded inline-block w-fit relative z-10">Team is performing well</div>
                  {/* Decorative Circle */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              </div>
          </div>

          {/* --- ANALYTICS SECTION (Responsive Stack) --- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* 1. RECRUITMENT FUNNEL */}
              <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400"/> Recruitment Funnel</h3>
                  
                  <div className="space-y-4">
                      {/* Funnel Items... (Same logic as before, CSS handles width) */}
                      <div className="relative group">
                          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Total Applicants</span><span>{stats.totalUsers}</span></div>
                          <div className="w-full bg-slate-800 h-8 rounded-lg overflow-hidden relative">
                              <div className="absolute top-0 left-0 h-full bg-blue-600/20 w-full flex items-center px-3 text-blue-400 font-bold text-xs">100%</div>
                          </div>
                      </div>
                      
                      <div className="relative group px-2 sm:px-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Pending Review</span><span>{stats.pendingUsers}</span></div>
                          <div className="w-full bg-slate-800 h-8 rounded-lg overflow-hidden relative">
                              <div className="absolute top-0 left-0 h-full bg-orange-500/20 flex items-center px-3 text-orange-400 font-bold text-xs" style={{ width: `${(stats.pendingUsers / (stats.totalUsers || 1)) * 100}%` }}>
                                  {Math.round((stats.pendingUsers / (stats.totalUsers || 1)) * 100)}%
                              </div>
                          </div>
                      </div>

                      <div className="relative group px-4 sm:px-8">
                          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Hired (Active)</span><span>{stats.activeUsers}</span></div>
                          <div className="w-full bg-slate-800 h-8 rounded-lg overflow-hidden relative">
                              <div className="absolute top-0 left-0 h-full bg-green-500/20 flex items-center px-3 text-green-400 font-bold text-xs" style={{ width: `${(stats.activeUsers / (stats.totalUsers || 1)) * 100}%` }}>
                                  {Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}%
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* 2. PROJECT STATUS GRAPH */}
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h3 className="text-lg font-bold text-white">Project Overview</h3>
                      <div className="flex gap-4 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Active</span>
                          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Done</span>
                      </div>
                  </div>

                  <div className="flex-1 flex items-end justify-around gap-2 h-48 border-b border-slate-800 pb-2 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                          <div className="w-full h-px bg-white"></div>
                          <div className="w-full h-px bg-white"></div>
                          <div className="w-full h-px bg-white"></div>
                          <div className="w-full h-px bg-white"></div>
                      </div>

                      {/* Bar 1 */}
                      <div className="w-12 sm:w-16 flex flex-col items-center gap-2 group">
                          <div className="text-xs text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition mb-1">{stats.totalProjects}</div>
                          <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-t-lg transition-all hover:bg-blue-500/30" style={{ height: '100%' }}></div>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Total</span>
                      </div>

                      {/* Bar 2 */}
                      <div className="w-12 sm:w-16 flex flex-col items-center gap-2 group">
                          <div className="text-xs text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition mb-1">{stats.activeProjects}</div>
                          <div className="w-full bg-purple-500/20 border border-purple-500/50 rounded-t-lg transition-all hover:bg-purple-500/30" style={{ height: `${(stats.activeProjects / (stats.totalProjects || 1)) * 100}%` }}></div>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Active</span>
                      </div>

                      {/* Bar 3 */}
                      <div className="w-12 sm:w-16 flex flex-col items-center gap-2 group">
                          <div className="text-xs text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition mb-1">{stats.completedProjects}</div>
                          <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded-t-lg transition-all hover:bg-emerald-500/30" style={{ height: `${(stats.completedProjects / (stats.totalProjects || 1)) * 100}%` }}></div>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Done</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* --- RECENT ACTIVITY TABLE (Scrollable on Mobile) --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-white">Recent Security Requests</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition border border-slate-700 w-full sm:w-auto">Export CSV</button>
                </div>
            </div>
            
            {/* Added overflow-x-auto for horizontal scroll on mobile */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-5 border-b border-slate-800">Identity</th>
                    <th className="p-5 border-b border-slate-800 hidden sm:table-cell">Department</th>
                    <th className="p-5 border-b border-slate-800">Status</th>
                    <th className="p-5 border-b border-slate-800 hidden md:table-cell">Date</th>
                    <th className="p-5 border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {loading ? (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Scanning database...</td></tr>
                  ) : users.slice(0, 5).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition duration-150 group">
                      <td className="p-5">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs overflow-hidden border border-slate-700 group-hover:border-slate-600 transition">
                               {user.profile_photo ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover"/> : user.full_name?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                               <div className="font-bold text-white text-sm">{user.full_name}</div>
                               <div className="text-slate-500 text-[10px] font-mono tracking-tight">{user.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-5 text-slate-400 hidden sm:table-cell text-xs">{user.department || 'General'}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                          user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          user.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             user.status === 'active' ? 'bg-emerald-500' : 
                             user.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                          }`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-5 text-slate-500 hidden md:table-cell text-xs font-mono">
                         {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-5 text-right">
                        {user.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateStatus(user.id, 'active')} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg transition"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => updateStatus(user.id, 'rejected')} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition"><XCircle className="w-4 h-4" /></button>
                          </div>
                        ) : (
                           <button className="text-slate-600 hover:text-white transition"><MoreVertical className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-950/30 border-t border-slate-800 text-center">
                <button onClick={() => router.push('/admin/employees')} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition">View All Employees &rarr;</button>
            </div>
          </div>

        </main>
        
        <footer className="p-6 text-center text-[10px] text-slate-600 border-t border-slate-900 mt-auto uppercase tracking-widest">
           Secure Admin Portal • Enterprise OS v2.0
        </footer>

      </div>
    </div>
  );
}
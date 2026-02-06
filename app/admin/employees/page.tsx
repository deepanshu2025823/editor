'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { Search, Plus, Trash2, Mail, Briefcase, Shield, X, Camera, Edit3 } from 'lucide-react';

export default function Employees() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
      full_name: '', 
      email: '', 
      designation: '', 
      department: '', 
      password: 'password123',
      profile_photo: '' 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleImageUpload = (e: any) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              alert("Image size should be less than 2MB");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData({ ...formData, profile_photo: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure you want to terminate this employee? Data will be lost.")) return;
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      fetchUsers();
  };

  const handleEditClick = (user: any) => {
      setIsEditing(true);
      setCurrentUserId(user.id);
      setFormData({
          full_name: user.full_name || '',
          email: user.email || '',
          designation: user.designation || '',
          department: user.department || '',
          password: user.password || '', 
          profile_photo: user.profile_photo || ''
      });
      setShowModal(true);
  };

  const handleAddClick = () => {
      setIsEditing(false);
      setFormData({ full_name: '', email: '', designation: '', department: '', password: 'password123', profile_photo: '' });
      setShowModal(true);
  };

  const handleSubmit = async (e: any) => {
      e.preventDefault();
      
      const method = isEditing ? 'PATCH' : 'POST';
      const body = isEditing ? { ...formData, id: currentUserId } : formData;

      try {
        await fetch('/api/admin/users', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        setShowModal(false);
        fetchUsers(); 
      } catch (err) {
          console.error("Error saving user:", err);
      }
  };

  const filteredUsers = users.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#1e1e24] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#25252b]">
                      <h3 className="text-lg font-bold text-white">{isEditing ? 'Edit Profile' : 'New Hire Onboarding'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      
                      <div className="flex justify-center mb-4">
                          <div className="relative group cursor-pointer w-24 h-24">
                              <div className="w-full h-full rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden relative z-0">
                                  {formData.profile_photo ? (
                                      <img src={formData.profile_photo} alt="Preview" className="w-full h-full object-cover" />
                                  ) : (
                                      <Camera className="w-8 h-8 text-slate-500" />
                                  )}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold z-10 pointer-events-none">
                                  Change
                              </div>

                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                          <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-[#2a2a30] border border-slate-700 rounded-lg p-3 text-sm mt-1 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Official Email</label>
                          <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#2a2a30] border border-slate-700 rounded-lg p-3 text-sm mt-1 focus:border-blue-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                              <input required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#2a2a30] border border-slate-700 rounded-lg p-3 text-sm mt-1 focus:border-blue-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Dept</label>
                              <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#2a2a30] border border-slate-700 rounded-lg p-3 text-sm mt-1 focus:border-blue-500 outline-none" />
                          </div>
                      </div>
                      
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-2 shadow-lg shadow-blue-900/20">
                          {isEditing ? 'Update Employee' : 'Create Profile'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 p-6 md:p-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Workforce Directory</h1>
              <p className="text-slate-400 text-sm mt-1">Manage access, roles, and employee records.</p>
           </div>
           
           <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by name or role..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition" 
                  />
              </div>
              <button 
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition active:scale-95 whitespace-nowrap"
              >
                 <Plus className="w-4 h-4" /> Add Employee
              </button>
           </div>
        </header>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-2xl animate-pulse"></div>)}
            </div>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                No employees found.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((emp) => (
                    <div key={emp.id} className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col justify-between">
                        
                        <div>
                            <div className={`absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                emp.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                emp.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                                {emp.status}
                            </div>

                            <div className="flex flex-col items-center text-center mt-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 p-1 mb-4 shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative">
                                    {emp.profile_photo ? (
                                        <img src={emp.profile_photo} alt={emp.full_name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400">
                                            {emp.full_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{emp.full_name}</h3>
                                <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">{emp.designation || 'No Role'}</p>
                                
                                <div className="w-full space-y-2">
                                    <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg truncate">
                                        <Briefcase className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        <span className="truncate">{emp.department || 'General'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg truncate">
                                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        <span className="truncate">{emp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg truncate">
                                        <Shield className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        <span className="truncate font-mono">{emp.employee_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                            <button 
                                onClick={() => handleEditClick(emp)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(emp.id)}
                                className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-lg transition border border-red-500/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
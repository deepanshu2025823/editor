'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import LiveFeedCard from '@/components/admin/LiveFeedCard'; 

export default function Surveillance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/admin/users'); 
        const data = await res.json();
        const activeStaff = data.filter((u: any) => u.status !== 'rejected');
        setEmployees(activeStaff);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col md:ml-64 p-6 md:p-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Live Surveillance</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time visual monitoring of authorized workforce.</p>
           </div>
           
           <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-slate-200 font-bold text-xs tracking-wider">SYSTEM ACTIVE</span>
           </div>
        </header>

        {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p>Loading security feeds...</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {employees.map((emp) => (
                  <LiveFeedCard key={emp.id} employee={emp} />
               ))}
               
               {employees.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                      No active employees found in the database.
                  </div>
               )}
            </div>
        )}
      </div>
    </div>
  );
}
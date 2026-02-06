'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { Clock, Calendar, CheckCircle, XCircle, BarChart3, Search, Filter, Download, X, Eye } from 'lucide-react';

export default function Attendance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, avgCheckIn: '--:--', onLeave: 0, avgProd: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewLogId, setViewLogId] = useState<string | null>(null);
  const [logHistory, setLogHistory] = useState<any[]>([]);

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/attendance');
      const data = await res.json();
      setAttendanceData(data);
      calculateStats(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    let result = attendanceData;

    if (searchTerm) {
        result = result.filter(emp => 
            emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (statusFilter !== 'All') {
        result = result.filter(emp => (emp.status || 'Absent') === statusFilter);
    }

    setFilteredData(result);
  }, [attendanceData, searchTerm, statusFilter]);

  const calculateStats = (data: any[]) => {
      const present = data.filter(d => d.check_in).length;
      const total = data.length;
      const avgProd = Math.round(data.reduce((acc, curr) => acc + (curr.productivity_score || 0), 0) / (present || 1));
      
      let totalMinutes = 0;
      let checkInCount = 0;
      data.forEach(d => {
          if(d.check_in) {
              const date = new Date(d.check_in);
              totalMinutes += date.getHours() * 60 + date.getMinutes();
              checkInCount++;
          }
      });
      const avgMins = checkInCount ? Math.floor(totalMinutes / checkInCount) : 0;
      const avgCheckIn = checkInCount ? `${Math.floor(avgMins / 60)}:${(avgMins % 60).toString().padStart(2, '0')} AM` : '--:--';

      setStats({ present, onLeave: total - present, avgProd, avgCheckIn });
  };

  const handleViewLog = async (id: string) => {
      setViewLogId(id);
      try {
          const res = await fetch(`/api/admin/attendance/${id}`);
          const data = await res.json();
          setLogHistory(data);
      } catch (e) { console.error(e); }
  };

  const handleExport = () => {
      const headers = ["Employee ID,Name,Role,Check-In,Status,Productivity"];
      const rows = filteredData.map(emp => 
          `${emp.employee_id},${emp.full_name},${emp.designation},${emp.check_in || ''},${emp.status || 'Absent'},${emp.productivity_score}%`
      );
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-red-500/10 text-red-500 border-red-500/20'; 
    switch (status) {
      case 'Working': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Idle': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Offline': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const formatTime = (isoString: string) => {
      if(!isoString) return '--:--';
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {viewLogId && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#1e1e24] w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#25252b]">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-400" /> Attendance History
                      </h3>
                      <button onClick={() => setViewLogId(null)} className="hover:bg-slate-700 p-2 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between mb-4 text-sm text-slate-400">
                          <span>Employee: <span className="text-white font-bold">{attendanceData.find(e => e.employee_id === viewLogId)?.full_name}</span></span>
                          <span>ID: <span className="font-mono text-blue-400">{viewLogId}</span></span>
                      </div>
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-bold">
                              <tr>
                                  <th className="p-3 rounded-l-lg">Date</th>
                                  <th className="p-3">Check-In</th>
                                  <th className="p-3">Check-Out</th>
                                  <th className="p-3">Score</th>
                                  <th className="p-3 rounded-r-lg">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {logHistory.length > 0 ? logHistory.map((log, i) => (
                                  <tr key={i}>
                                      <td className="p-3 text-slate-300">{new Date(log.date).toLocaleDateString()}</td>
                                      <td className="p-3 font-mono text-green-400">{formatTime(log.check_in)}</td>
                                      <td className="p-3 font-mono text-red-400">{log.check_out ? formatTime(log.check_out) : 'Active'}</td>
                                      <td className="p-3 font-bold">{log.productivity_score}%</td>
                                      <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${getStatusColor(log.status)}`}>{log.status}</span></td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={5} className="p-6 text-center text-slate-500 italic">No history found.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 p-6 md:p-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Attendance & Efficiency</h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                 <Calendar className="w-3 h-3" /> {date}
              </p>
           </div>
           
           <div className="flex gap-3 relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition ${showFilter ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'}`}
              >
                 <Filter className="w-4 h-4" /> Filter
              </button>
              
              {showFilter && (
                  <div className="absolute top-12 right-40 w-48 bg-[#1e1e24] border border-slate-700 rounded-xl shadow-xl z-20 p-2 animate-in fade-in zoom-in duration-200">
                      <p className="text-xs font-bold text-slate-500 px-2 py-1 mb-1">FILTER BY STATUS</p>
                      {['All', 'Working', 'Idle', 'Offline', 'Absent'].map(status => (
                          <div 
                            key={status}
                            onClick={() => { setStatusFilter(status); setShowFilter(false); }}
                            className={`px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-slate-800 ${statusFilter === status ? 'text-blue-400 bg-blue-400/10' : 'text-slate-300'}`}
                          >
                              {status}
                          </div>
                      ))}
                  </div>
              )}

              <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition active:scale-95">
                 <Download className="w-4 h-4" /> Export Report
              </button>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Present Today" value={stats.present} total={`/ ${attendanceData.length}`} icon={<CheckCircle className="text-green-400" />} color="green" />
            <StatCard title="Avg. Check-In" value={stats.avgCheckIn} total="Today" icon={<Clock className="text-blue-400" />} color="blue" />
            <StatCard title="On Leave" value={stats.onLeave} total="Employee" icon={<XCircle className="text-red-400" />} color="red" />
            <StatCard title="Avg. Productivity" value={`${stats.avgProd}%`} total="Efficiency" icon={<BarChart3 className="text-purple-400" />} color="purple" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[400px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-slate-200">Real-time Logs</h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search employee..." 
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all w-64" 
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="p-4">Employee</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Check-In</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Productivity</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="p-10 text-center text-slate-500 animate-pulse">Scanning biometric data...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-slate-500">No records found matching filters.</td></tr>
                        ) : filteredData.map((emp) => (
                            <tr key={emp.employee_id} className="hover:bg-slate-800/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">
                                            {emp.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{emp.full_name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{emp.employee_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-400 text-xs">{emp.designation}</td>
                                <td className="p-4 font-mono text-slate-300">{formatTime(emp.check_in)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(emp.status)}`}>
                                        {emp.status || 'Absent'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${emp.productivity_score > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${emp.productivity_score || 0}%` }}></div>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">{emp.productivity_score || 0}%</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleViewLog(emp.employee_id)}
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-end gap-1"
                                    >
                                        <Eye className="w-3 h-3" /> View Log
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, total, icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition duration-300">
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</span>
            <div className={`p-1.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                {icon}
            </div>
        </div>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            <span className="text-xs text-slate-500">{total}</span>
        </div>
    </div>
);
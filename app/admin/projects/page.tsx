'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { Plus, Calendar, MoreVertical } from 'lucide-react';

export default function Projects() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [projectForm, setProjectForm] = useState({ name: '', description: '', deadline: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', assigned_to: '', due_date: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const res = await fetch('/api/admin/projects');
        const data = await res.json();
        
        if (Array.isArray(data)) {
            setProjects(data);
        } else {
            console.error("API Error:", data);
            setProjects([]); 
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        setProjects([]);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateProject = async (e: any) => {
      e.preventDefault();
      await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectForm)
      });
      setShowProjectModal(false);
      fetchData();
  };

  const handleCreateTask = async (e: any) => {
      e.preventDefault();
      await fetch('/api/admin/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskForm, project_id: selectedProjectId })
      });
      setShowTaskModal(false);
      fetchData();
  };

  const moveTask = async (taskId: number, newStatus: string) => {
      const updatedProjects = projects.map(p => ({
          ...p,
          tasks: p.tasks ? p.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t) : []
      }));
      setProjects(updatedProjects);

      await fetch('/api/admin/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status: newStatus })
      });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {showProjectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <form onSubmit={handleCreateProject} className="bg-[#1e1e24] p-6 rounded-2xl w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                  <input required placeholder="Project Name" className="w-full bg-[#2a2a30] p-3 rounded mb-3 outline-none" onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                  <textarea placeholder="Description" className="w-full bg-[#2a2a30] p-3 rounded mb-3 outline-none" onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                  <input type="date" required className="w-full bg-[#2a2a30] p-3 rounded mb-4 outline-none text-white" onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} />
                  <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                      <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white">Create</button>
                  </div>
              </form>
          </div>
      )}

      {showTaskModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <form onSubmit={handleCreateTask} className="bg-[#1e1e24] p-6 rounded-2xl w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Add Task</h3>
                  <input required placeholder="Task Title" className="w-full bg-[#2a2a30] p-3 rounded mb-3 outline-none" onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <select className="bg-[#2a2a30] p-3 rounded outline-none" onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                      </select>
                      <input type="date" className="bg-[#2a2a30] p-3 rounded outline-none text-white" onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                  </div>
                  <input placeholder="Assign to (Employee ID)" className="w-full bg-[#2a2a30] p-3 rounded mb-4 outline-none" onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} />
                  <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                      <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white">Add Task</button>
                  </div>
              </form>
          </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 p-6 md:p-8 overflow-hidden">
        <header className="flex justify-between items-center mb-8">
           <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Projects & Sprints</h1>
              <p className="text-slate-400 text-sm mt-1">Manage development pipelines.</p>
           </div>
           <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-bold transition">
               <Plus className="w-4 h-4" /> New Project
           </button>
        </header>

        <div className="space-y-10 overflow-y-auto pb-20">
            {projects.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                    No active projects found. Check database connection or create a new project.
                </div>
            ) : projects.map((project) => (
                <div key={project.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                                <span className="font-bold text-blue-400 text-lg">#{project.id}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                                <p className="text-sm text-slate-400">{project.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Due: {new Date(project.deadline).toLocaleDateString()}</span>
                            <button onClick={() => { setSelectedProjectId(project.id); setShowTaskModal(true); }} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition">
                                + Add Task
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {['todo', 'in_progress', 'review', 'done'].map((status) => (
                            <div key={status} className="bg-[#0f172a] rounded-xl p-4 border border-slate-800/50 min-h-[150px]">
                                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider border-b border-slate-800 pb-2">
                                    {status.replace('_', ' ')}
                                </h4>
                                <div className="space-y-2">
                                    {project.tasks && project.tasks.filter((t: any) => t.status === status).map((task: any) => (
                                        <div key={task.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 cursor-pointer transition group relative">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                                    task.priority === 'high' ? 'bg-red-500/10 text-red-500' : 
                                                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 
                                                    'bg-green-500/10 text-green-500'
                                                }`}>{task.priority}</span>
                                                <MoreVertical className="w-3 h-3 text-slate-600 group-hover:text-white" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-200 mb-2">{task.title}</p>
                                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                                                <span>{task.assigned_to || 'Unassigned'}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition bg-slate-900 rounded p-0.5">
                                                    {status !== 'todo' && <button onClick={() => moveTask(task.id, 'todo')} className="p-1 hover:text-white" title="Move to Todo">⬅️</button>}
                                                    {status !== 'done' && <button onClick={() => moveTask(task.id, status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'review' : 'done')} className="p-1 hover:text-white" title="Move Forward">➡️</button>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!project.tasks || project.tasks.filter((t: any) => t.status === status).length === 0) && (
                                        <div className="text-center py-4 text-xs text-slate-600 italic">Empty</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
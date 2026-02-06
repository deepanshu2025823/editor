'use client';
import { Menu, Folder, Search, GitBranch, Settings, MessageSquare } from 'lucide-react'; 

interface ActivityBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userInitial: string;
  onLogout: () => void;
}

export default function ActivityBar({ activeView, setActiveView, userInitial, onLogout }: ActivityBarProps) {
  const topIcons = [
    { id: 'explorer', icon: Folder, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'chat', icon: MessageSquare, label: 'Team Chat' }, 
  ];

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-3 space-y-4 border-r border-[#252526] select-none z-20">
      <Menu className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer mb-2" />
      
      {topIcons.map((item) => (
        <div 
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`relative group cursor-pointer p-3 w-full flex justify-center transition-all box-border
            ${activeView === item.id ? 'border-l-2 border-blue-500 bg-[#37373d]' : 'border-l-2 border-transparent hover:bg-[#2a2d2e]'}
          `}
          title={item.label}
        >
           <item.icon className={`w-6 h-6 ${activeView === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
        </div>
      ))}
      
      <div className="flex-1" />
      
      <div 
        onClick={() => setActiveView('settings')}
        className={`relative group cursor-pointer p-3 w-full flex justify-center transition-all box-border
            ${activeView === 'settings' ? 'border-l-2 border-blue-500 bg-[#37373d]' : 'border-l-2 border-transparent hover:bg-[#2a2d2e]'}
        `}
        title="Settings"
      >
        <Settings className={`w-6 h-6 ${activeView === 'settings' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
      </div>

      <div 
        className="w-8 h-8 mb-4 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-blue-500 transition shadow-lg"
        title="Account / Logout"
        onClick={onLogout}
      >
         {userInitial}
      </div>
    </div>
  );
}
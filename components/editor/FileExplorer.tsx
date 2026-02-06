'use client';
import { 
  FileCode, FileJson, FileType, File, Folder, FolderPlus, FilePlus, 
  Trash2, ChevronRight, ChevronDown, MoreHorizontal 
} from 'lucide-react';
import { useState } from 'react';

interface FileExplorerProps {
  files: any[];
  activeFileId: string | null;
  onFileSelect: (file: any) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDelete: (id: string) => void;
}

export default function FileExplorer({ files, activeFileId, onFileSelect, onCreateFile, onCreateFolder, onDelete }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root'])); 

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getIcon = (name: string, type: string, isOpen: boolean) => {
    if (type === 'folder') return isOpen ? <Folder className="w-4 h-4 text-blue-300" /> : <Folder className="w-4 h-4 text-blue-300" />;
    if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-yellow-400" />;
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (name.endsWith('.css')) return <FileType className="w-4 h-4 text-blue-300" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-green-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col select-none h-full text-[#cccccc]">
      <div className="px-4 py-2 text-xs font-medium uppercase text-gray-400 flex justify-between items-center">
        <span>Explorer</span>
        <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white" />
      </div>

      <div className="px-1 py-1 text-xs font-bold uppercase text-gray-300 flex items-center bg-[#37373d] cursor-pointer">
        <ChevronDown className="w-4 h-4 mr-1" />
        <span>PROJECT-ROOT</span>
      </div>

      <div className="flex justify-end gap-1 px-2 py-1 border-b border-[#333]">
          <button onClick={onCreateFile} className="hover:bg-[#3c3c3c] p-1 rounded" title="New File"><FilePlus className="w-4 h-4" /></button>
          <button onClick={onCreateFolder} className="hover:bg-[#3c3c3c] p-1 rounded" title="New Folder"><FolderPlus className="w-4 h-4" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-1">
        {files
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
          .map((file) => (
          <div 
            key={file.id}
            className={`group px-4 py-1 flex items-center justify-between cursor-pointer text-sm transition-colors
              ${activeFileId === file.id 
                ? 'bg-[#37373d] text-white border-l-2 border-blue-500' 
                : 'border-l-2 border-transparent text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'}
            `}
            onClick={() => file.type === 'folder' ? toggleFolder(file.id) : onFileSelect(file)}
            style={{ paddingLeft: file.type === 'folder' ? '10px' : '24px' }} 
          >
            <div className="flex items-center gap-1.5 truncate w-full">
                {file.type === 'folder' && (
                   expandedFolders.has(file.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                )}
                {getIcon(file.name, file.type, expandedFolders.has(file.id))}
                <span className="truncate">{file.name}</span>
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                title="Delete"
            >
                <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {files.length === 0 && (
            <div className="p-4 text-xs text-gray-500 italic text-center">
                No files found. <br/> Create one to start.
            </div>
        )}
      </div>
    </div>
  );
}
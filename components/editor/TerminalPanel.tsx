'use client';
import { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, Trash2 } from 'lucide-react';

interface TerminalProps {
  logs: string[];
  onCommand: (cmd: string) => void;
}

export default function TerminalPanel({ logs, onCommand }: TerminalProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommand(input);
      setInput('');
    }
  };

  return (
    <div className="h-48 bg-[#1e1e1e] border-t border-[#333] flex flex-col font-sans">
      <div className="flex items-center justify-between px-4 py-0 bg-[#252526] border-b border-[#333]">
        <div className="flex gap-6 text-xs uppercase text-gray-400">
            <div className="py-2 text-white border-b border-white cursor-pointer hover:text-white">Terminal</div>
            <div className="py-2 cursor-pointer hover:text-white">Output</div>
            <div className="py-2 cursor-pointer hover:text-white">Debug Console</div>
            <div className="py-2 cursor-pointer hover:text-white">Problems <span className="bg-blue-600 text-white rounded-full px-1 ml-1">0</span></div>
        </div>
        <div className="flex gap-2 text-gray-400">
            <ChevronUp className="w-4 h-4 cursor-pointer hover:text-white" />
            <X className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>
      
      <div className="flex-1 p-3 font-mono text-sm overflow-y-auto custom-scrollbar bg-[#1e1e1e]" style={{ fontFamily: 'Consolas, monospace' }}>
        <div className="text-gray-500 mb-2">Microsoft Windows [Version 10.0.19045.4291] <br/> (c) Microsoft Corporation. All rights reserved.</div>
        
        {logs.map((log, i) => (
          <div key={i} className="mb-0.5 break-words leading-tight">
            {log.startsWith('>') ? (
                <div className="flex gap-2">
                    <span className="text-green-400">➜</span>
                    <span className="text-cyan-400">workspace</span>
                    <span className="text-gray-300">{log.substring(1)}</span>
                </div>
            ) : log.toLowerCase().includes('error') ? (
                <span className="text-red-400">{log}</span>
            ) : log.includes('Success') ? (
                <span className="text-green-400">{log}</span>
            ) : (
                <span className="text-gray-300">{log}</span>
            )}
          </div>
        ))}
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-green-400">➜</span>
          <span className="text-cyan-400">workspace</span>
          <input 
            className="bg-transparent outline-none text-gray-200 flex-1 border-none focus:ring-0 p-0 ml-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
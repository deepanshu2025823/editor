'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client'; 
import { X, Play, AlertTriangle } from 'lucide-react';
import AuthPopup from '@/components/AuthPopup';

import ActivityBar from '@/components/editor/ActivityBar';
import FileExplorer from '@/components/editor/FileExplorer';
import TerminalPanel from '@/components/editor/TerminalPanel';
import ChatPanel from '@/components/editor/ChatPanel';
import CallOverlay from '@/components/editor/CallOverlay'; 

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [activeView, setActiveView] = useState('explorer'); 
  
  const [files, setFiles] = useState<any[]>([]); 
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<string[]>(['> Enterprise OS Ready...', '> Waiting for user input...']);

  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 10 * 60 * 1000; 

  useEffect(() => {
    const savedUser = localStorage.getItem('business_os_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      const cleanup = connectToSurveillanceSystem(userData.employee_id);
      
      resetIdleTimer();
      window.addEventListener('mousemove', resetIdleTimer);
      window.addEventListener('keydown', resetIdleTimer);
      window.addEventListener('click', resetIdleTimer);

      return () => {
        cleanup.then(stop => stop && stop());
        if(idleTimerRef.current) clearTimeout(idleTimerRef.current);
        window.removeEventListener('mousemove', resetIdleTimer);
        window.removeEventListener('keydown', resetIdleTimer);
        window.removeEventListener('click', resetIdleTimer);
      };
    }
  }, []);

  const resetIdleTimer = () => {
    if (isIdle) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(triggerIdleState, IDLE_TIMEOUT);
  };

  const triggerIdleState = () => {
    setIsIdle(true);
    if (socketRef.current && user) {
        socketRef.current.emit('user-idle', { employeeId: user.employee_id, name: user.full_name, email: user.email });
    }
  };

  const resumeWork = () => {
    setIsIdle(false);
    resetIdleTimer();
  };

  const connectToSurveillanceSystem = async (employeeId: string) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const socket = io({ path: '/api/socket' });
        socketRef.current = socket;

        socket.on('connect', () => socket.emit('register-employee', employeeId));

        socket.on('call-incoming', (data) => {
            if(confirm(`Incoming Call from ${data.name}. Accept?`)) {
                setIsInCall(true);
            }
        });

        socket.on('call-ended', () => {
            setIsInCall(false);
            alert("Call Ended");
        });

        return () => {
            socket.disconnect();
            if (peerRef.current) peerRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        };
    } catch (err) { console.error(err); return () => {}; }
  };

  const handleStartCall = (video: boolean) => {
      setIsVideoCall(video);
      setIsInCall(true); 
      if(socketRef.current) {
          socketRef.current.emit('call-user', { 
              userToCall: 'admin', 
              from: user.employee_id, 
              name: user.full_name 
          });
      }
  };

  const handleEndCall = () => {
      setIsInCall(false);
      if(socketRef.current) {
          socketRef.current.emit('end-call', { to: 'admin' });
      }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile) return;
    setFiles(files.map(f => f.id === activeFileId ? { ...f, content: value || '' } : f));
  };

  const handleFileSelect = (file: any) => {
    if (file.type === 'folder') return; 
    if (!openFiles.includes(file.id)) setOpenFiles([...openFiles, file.id]);
    setActiveFileId(file.id);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(fileId => fileId !== id);
    setOpenFiles(newOpenFiles);
    if (id === activeFileId) setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
  };

  const handleNewFile = () => {
    const fileName = prompt("Enter file name (e.g., app.js):");
    if (fileName) {
      const ext = fileName.split('.').pop();
      const lang = ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : 'plaintext';
      const newFile = { id: Date.now().toString(), name: fileName, type: 'file', language: lang, content: '// Start coding...' };
      setFiles([...files, newFile]);
      setOpenFiles([...openFiles, newFile.id]);
      setActiveFileId(newFile.id);
    }
  };

  const handleNewFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) setFiles([...files, { id: Date.now().toString(), name: folderName, type: 'folder', content: '' }]);
  };

  const handleDelete = (id: string) => {
    if(confirm("Delete this item?")) {
        setFiles(files.filter(f => f.id !== id));
        setOpenFiles(openFiles.filter(fid => fid !== id));
        if (activeFileId === id) setActiveFileId(null);
    }
  };

  const handleRunCode = () => {
    if (activeFile) setLogs(prev => [...prev, `> node ${activeFile.name}`, 'Running...', 'Done.']);
  };

  const handleTerminalCommand = (cmd: string) => {
    setLogs(prev => [...prev, `> ${cmd}`]);
    if (cmd.trim() === 'ls') setTimeout(() => setLogs(prev => [...prev, files.map(f => f.name).join('   ') || '(empty)']), 100);
    else if (cmd.trim() === 'clear') setLogs([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('business_os_user');
    setUser(null);
    if(socketRef.current) socketRef.current.disconnect();
    window.location.reload();
  };

  if (!user) return <AuthPopup onLogin={(u) => { localStorage.setItem('business_os_user', JSON.stringify(u)); setUser(u); window.location.reload(); }} />;

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans relative">
      <video ref={videoRef} autoPlay playsInline muted className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />
      
      {isInCall && (
          <CallOverlay 
            stream={streamRef.current} 
            onEndCall={handleEndCall} 
            isVideoEnabled={isVideoCall} 
          />
      )}

      {isIdle && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
            <div className="bg-[#252526] p-8 rounded-2xl border border-red-500 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-white mb-2">Are you still there?</h2>
                <button onClick={resumeWork} className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">Resume Work</button>
            </div>
        </div>
      )}

      <ActivityBar activeView={activeView} setActiveView={setActiveView} userInitial={user.full_name.charAt(0)} onLogout={handleLogout} />

      {activeView === 'explorer' && <FileExplorer files={files} activeFileId={activeFileId} onFileSelect={handleFileSelect} onCreateFile={handleNewFile} onCreateFolder={handleNewFolder} onDelete={handleDelete} />}
      
      {activeView === 'search' && <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] p-4"><input placeholder="Search files..." className="w-full bg-[#3c3c3c] p-1.5 rounded outline-none text-white text-sm" /></div>}

      {activeView === 'chat' && (
          <ChatPanel 
            socket={socketRef.current} 
            user={user} 
            onStartCall={handleStartCall} 
          />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
         <div className="h-10 bg-[#252526] flex items-center justify-between pr-2 border-b border-[#1e1e1e]">
            <div className="flex items-center h-full overflow-x-auto no-scrollbar">
                {openFiles.map(fid => {
                    const f = files.find(file => file.id === fid);
                    if(!f) return null;
                    return (
                        <div key={f.id} onClick={() => setActiveFileId(f.id)} className={`group px-3 h-full flex items-center gap-2 text-xs cursor-pointer border-r border-[#1e1e1e] ${activeFileId === f.id ? 'bg-[#1e1e1e] text-white border-t-2 border-blue-500' : 'bg-[#2d2d2d] text-gray-500 hover:bg-[#333]'}`}>
                            {f.name} <span onClick={(e) => handleCloseTab(e, f.id)}><X className="w-3 h-3" /></span>
                        </div>
                    );
                })}
            </div>
            {activeFile && <button onClick={handleRunCode} className="flex items-center gap-2 bg-green-700 text-white px-3 py-1 rounded text-[10px] font-bold"><Play className="w-3 h-3" /> RUN</button>}
         </div>

         <div className="flex-1 relative bg-[#1e1e1e]">
            {activeFile ? (
                <Editor height="100%" path={activeFile.name} defaultLanguage={activeFile.language} value={activeFile.content} theme="vs-dark" onChange={handleEditorChange} options={{ fontSize: 14, minimap: { enabled: true } }} />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500"><Play className="w-16 h-16 opacity-20" /><p>Select a file to start editing</p></div>
            )}
         </div>

         <TerminalPanel logs={logs} onCommand={handleTerminalCommand} />
      </div>
    </div>
  );
}
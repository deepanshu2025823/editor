'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function LiveFeedCard({ employee }: { employee: any }) {
  const [status, setStatus] = useState<'Offline' | 'Online' | 'Connecting' | 'Live'>('Offline');
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Initialize Socket
    const socket = io(window.location.origin, { 
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        query: { role: 'admin' }
    });
    socketRef.current = socket;

    // 2. Check Status on Connect
    socket.on('connect', () => {
        socket.emit('check-status', employee.employee_id);
    });

    // 3. Handle Status Changes
    socket.on(`status-${employee.employee_id}`, (isOnline: boolean) => {
      if (isOnline) {
          if (status === 'Offline') {
              startSurveillance(socket);
          }
      } else {
          setStatus('Offline');
          cleanupWebRTC();
      }
    });

    // 4. WebRTC Signaling Events
    socket.on(`offer-${employee.employee_id}`, async (offer: any) => {
      try {
          if (!peerRef.current) return;
          if (peerRef.current.signalingState !== 'stable') {
              // Reset if state is weird
              await Promise.all([
                  peerRef.current.setRemoteDescription(new RTCSessionDescription(offer)),
                  peerRef.current.createAnswer().then(answer => peerRef.current!.setLocalDescription(answer))
              ]);
              socket.emit('answer', { 
                  targetId: employee.employee_id, 
                  answer: peerRef.current.localDescription 
              });
          }
      } catch (e) { console.error("Offer Error:", e); }
    });

    socket.on(`candidate-${employee.employee_id}`, async (candidate: any) => {
      try {
          if (peerRef.current && peerRef.current.remoteDescription) {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
      } catch (e) { console.error("Candidate Error:", e); }
    });

    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      cleanupWebRTC();
      socket.disconnect();
    };
  }, [employee]);

  // --- Helper: Cleanup ---
  const cleanupWebRTC = () => {
      if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
  };

  // --- Helper: Start Connection ---
  const startSurveillance = async (socket: Socket) => {
    setStatus('Connecting');
    cleanupWebRTC();

    // Enhanced STUN servers for better production connectivity
    const peer = new RTCPeerConnection({
      iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });
    peerRef.current = peer;

    // Handle incoming video stream
    peer.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('Live');
        // Clear any pending retry since we are live
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
      }
    };

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { targetId: employee.employee_id, candidate: event.candidate });
        }
    };

    // Trigger the connection
    console.log(`📡 Requesting feed from ${employee.employee_id}...`);
    socket.emit('admin-join', { targetId: employee.employee_id });

    // Auto-Retry logic if connection stuck on "Connecting"
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
    retryTimeout.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (status !== 'Live') {
            console.log("♻️ Retrying connection...");
            startSurveillance(socket);
        }
    }, 5000); // Retry every 5 seconds if not live
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full relative group">
        <div className="aspect-video w-full bg-black relative flex items-center justify-center">
            
            {/* Video Element */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'Live' ? 'opacity-100' : 'opacity-0'}`} 
            />
            
            {/* Offline / Connecting State UI */}
            {status !== 'Live' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-950/80 z-10">
                    {status === 'Connecting' ? (
                        <>
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                            </div>
                            <span className="text-xs font-bold text-blue-400 tracking-wider animate-pulse">
                                ESTABLISHING FEED...
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-500 tracking-wider">OFFLINE</span>
                        </>
                    )}
                </div>
            )}
            
            {/* Live Indicator Badge */}
            {status === 'Live' && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-red-400/50 animate-pulse z-20">
                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                </div>
            )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                    {employee.full_name ? employee.full_name.substring(0, 2).toUpperCase() : 'NA'}
                 </div>
                 <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-white truncate w-24 sm:w-auto">{employee.full_name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{employee.employee_id}</p>
                 </div>
            </div>
            
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 ${status === 'Live' ? 'text-green-400 border-green-500/30 bg-green-500/10' : status === 'Connecting' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-slate-500 border-slate-700 bg-slate-800'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Live' ? 'bg-green-500' : status === 'Connecting' ? 'bg-blue-500 animate-bounce' : 'bg-slate-500'}`}></span>
                {status}
            </div>
        </div>
    </div>
  );
}
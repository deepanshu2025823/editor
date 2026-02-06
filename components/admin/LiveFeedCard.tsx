'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function LiveFeedCard({ employee }: { employee: any }) {
  const [status, setStatus] = useState<'Offline' | 'Online' | 'Connecting'>('Offline');
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null); 

  useEffect(() => {
    const socket = io(window.location.origin, { 
        path: '/api/socket',
        transports: ['polling', 'websocket'], 
        query: { role: 'admin' }
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
        socket.emit('check-status', employee.employee_id);
    });

    socket.on(`status-${employee.employee_id}`, (isOnline: boolean) => {
      if (isOnline && status !== 'Online') {
          setStatus('Connecting');
          initWebRTC(socket);
      } else if (!isOnline) {
          setStatus('Offline');
          if (videoRef.current) videoRef.current.srcObject = null;
      }
    });

    return () => {
      if (peerRef.current) peerRef.current.close();
      socket.disconnect();
    };
  }, [employee]);

  const initWebRTC = async (socket: Socket) => {
    if (peerRef.current) peerRef.current.close();

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerRef.current = peer;

    peer.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('Online');
      }
    };

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { targetId: employee.employee_id, candidate: event.candidate });
        }
    };

    socket.emit('admin-join', { targetId: employee.employee_id });

    socket.on(`offer-${employee.employee_id}`, async (offer: any) => {
      if (peer.signalingState !== 'closed') {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { targetId: employee.employee_id, answer });
      }
    });

    socket.on(`candidate-${employee.employee_id}`, async (candidate: any) => {
      if (candidate && peer.signalingState !== 'closed') {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
        <div className="aspect-video w-full bg-black relative flex items-center justify-center group">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${status !== 'Online' ? 'hidden' : ''}`} />
            
            {status !== 'Online' && (
                <div className="text-slate-600 flex flex-col items-center animate-pulse">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span className="text-xs uppercase tracking-wider font-semibold">{status === 'Connecting' ? 'Connecting...' : 'User Offline'}</span>
                </div>
            )}
            
            {status === 'Online' && (
                <div className="absolute top-3 right-3 bg-red-600/90 px-2 py-0.5 rounded text-[10px] font-bold text-white border border-red-500 animate-pulse shadow-lg">
                    LIVE
                </div>
            )}
        </div>

        <div className="p-4 bg-slate-950/50 flex justify-between items-center mt-auto border-t border-slate-800">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                    {employee.full_name ? employee.full_name.substring(0, 2).toUpperCase() : 'NA'}
                 </div>
                 <div>
                    <h3 className="font-bold text-sm text-white leading-none">{employee.full_name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{employee.employee_id}</p>
                 </div>
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${status === 'Online' ? 'text-green-500 border-green-500/20 bg-green-500/10' : status === 'Connecting' ? 'text-yellow-500 border-yellow-500/20' : 'text-slate-500 border-slate-500/20'}`}>
                {status}
            </div>
        </div>
    </div>
  );
}
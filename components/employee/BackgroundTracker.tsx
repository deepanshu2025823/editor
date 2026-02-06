'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function BackgroundTracker({ employeeId }: { employeeId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!employeeId) return;

    // 1. Connect to Socket
    const socket = io(window.location.origin, {
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      query: { role: 'employee', id: employeeId }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("🔒 Employee Connected to Security Cloud");
      socket.emit('register-employee', employeeId);
    });

    // 2. Handle Admin Request (Start Camera)
    socket.on('request-offer', async () => {
      console.log("⚡ Admin requested feed...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setIsSharing(true);

        // ✅ FIX: Added TURN Servers (Required for Cloud/Render)
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { 
               urls: "turn:openrelay.metered.ca:80",
               username: "openrelayproject",
               credential: "openrelayproject"
            },
            { 
               urls: "turn:openrelay.metered.ca:443",
               username: "openrelayproject",
               credential: "openrelayproject"
            },
            { 
               urls: "turn:openrelay.metered.ca:443?transport=tcp",
               username: "openrelayproject",
               credential: "openrelayproject"
            }
          ]
        });
        peerRef.current = peer;

        // Add Video Stream
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        // Send Ice Candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('candidate', { targetId: employeeId, candidate: event.candidate });
          }
        };

        // Create Offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { targetId: employeeId, offer });

      } catch (err) {
        console.error("Camera Access Failed:", err);
        alert("Please Allow Camera Access for Attendance System");
      }
    });

    // 3. Handle Answer
    socket.on('answer', async (answer) => {
      if (peerRef.current && peerRef.current.signalingState !== 'stable') {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on(`candidate-${employeeId}`, async (candidate) => {
       if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
       }
    });

    return () => {
      if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if(peerRef.current) peerRef.current.close();
      socket.disconnect();
    };
  }, [employeeId]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all ${isSharing ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isSharing ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
                {isSharing ? 'LIVE FEED ACTIVE' : 'SECURITY ACTIVE'}
            </span>
        </div>
    </div>
  );
}
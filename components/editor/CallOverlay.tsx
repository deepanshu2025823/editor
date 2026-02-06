'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface CallOverlayProps {
  stream: MediaStream | null;
  onEndCall: () => void;
  isVideoEnabled: boolean;
}

export default function CallOverlay({ stream, onEndCall, isVideoEnabled }: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(isVideoEnabled);

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMic = () => {
    if(stream) {
        stream.getAudioTracks()[0].enabled = !micOn;
        setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if(stream) {
        stream.getVideoTracks()[0].enabled = !cameraOn;
        setCameraOn(!cameraOn);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-300">
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
        
        <div className="bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden border border-gray-700 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
            <div className="text-center z-10">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 mx-auto shadow-lg">
                    AD
                </div>
                <h3 className="text-xl font-semibold text-white">Admin / Team Lead</h3>
                <p className="text-blue-300 text-sm animate-pulse mt-2">Connecting...</p>
            </div>
        </div>

        <div className="bg-gray-900 rounded-2xl relative overflow-hidden border border-gray-800">
            {cameraOn ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                        <VideoOff className="w-8 h-8" />
                    </div>
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur">
                You
            </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-6 bg-gray-800/80 px-8 py-4 rounded-full border border-gray-700 shadow-2xl backdrop-blur-md">
        <button 
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all duration-200 ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button 
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-110 transition-all duration-200 px-8"
        >
            <PhoneOff className="w-8 h-8" />
        </button>

        <button 
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-all duration-200 ${cameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
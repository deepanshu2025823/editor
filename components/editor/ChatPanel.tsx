'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Video, Phone, MoreVertical, Mic, Trash2, Download, BellOff } from 'lucide-react';

interface ChatPanelProps {
    socket: any;
    user: any;
    onStartCall: (video: boolean) => void; 
}

export default function ChatPanel({ socket, user, onStartCall }: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'ai'>('ai');
  const [messages, setMessages] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: 'AI', text: 'Hello! I am your Autonomous Enterprise Assistant. How can I help you code today?', time: 'Now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on("receive-message", (data: any) => {
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    });
    return () => { socket.off("receive-message"); };
  }, [socket]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeTab === 'team') {
      const msgData = { sender: user.full_name, senderId: user.employee_id, text: input, time };
      socket.emit("send-message", msgData);
      setInput('');
    } else {
      const userMsg = { sender: 'You', text: input, time };
      setAiMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      scrollToBottom();

      try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: input, 
                history: aiMessages.map(m => ({ sender: m.sender, text: m.text })) 
            }),
        });
        
        const data = await res.json();
        
        const aiReply = { 
            sender: 'AI', 
            text: data.reply || "Sorry, I couldn't process that.", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        
        setAiMessages(prev => [...prev, aiReply]);
      } catch (err) {
        setAiMessages(prev => [...prev, { sender: 'AI', text: "Error connecting to AI Brain.", time: 'Error' }]);
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
    }
  };

  const clearChat = () => {
      if(activeTab === 'team') setMessages([]);
      else setAiMessages([]);
      setShowMenu(false);
  };

  const activeList = activeTab === 'team' ? messages : aiMessages;

  return (
    <div className="w-80 bg-[#252526] border-r border-[#1e1e1e] flex flex-col h-full flex-shrink-0 relative">
      <div className="bg-[#252526] border-b border-[#333]">
          <div className="flex justify-between items-center p-3 relative">
             <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Communication</div>
             
             <div className="flex gap-3 text-gray-400">
                <Phone 
                    className="w-4 h-4 cursor-pointer hover:text-green-400 transition" 
                    onClick={() => onStartCall(false)} 
                />
                <Video 
                    className="w-4 h-4 cursor-pointer hover:text-blue-400 transition" 
                    onClick={() => onStartCall(true)} 
                />
                
                <div className="relative">
                    <MoreVertical 
                        className="w-4 h-4 cursor-pointer hover:text-white transition" 
                        onClick={() => setShowMenu(!showMenu)} 
                    />
                    
                    {showMenu && (
                        <div className="absolute right-0 top-6 w-40 bg-[#333] border border-[#444] rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in duration-200">
                            <button 
                                onClick={clearChat} 
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[#444] rounded text-left transition"
                            >
                                <Trash2 className="w-3 h-3" /> Clear Chat
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[#444] rounded text-left transition">
                                <Download className="w-3 h-3" /> Export Logs
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[#444] rounded text-left transition">
                                <BellOff className="w-3 h-3" /> Mute
                            </button>
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="flex px-2 pb-2">
             <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-l-md transition-colors ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-400 hover:bg-[#3e3e42]'}`}
             >
                <Bot className="w-3 h-3" /> AI Assistant
             </button>
             <button 
                onClick={() => setActiveTab('team')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-r-md transition-colors ${activeTab === 'team' ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-400 hover:bg-[#3e3e42]'}`}
             >
                <User className="w-3 h-3" /> Team Chat
             </button>
          </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#1e1e1e]"
        onClick={() => setShowMenu(false)}
      >
        {activeList.length === 0 && (
            <div className="text-center text-gray-500 text-xs mt-10 opacity-50">
                <p>Start a conversation...</p>
            </div>
        )}
        
        {activeList.map((msg, idx) => {
          const isMe = msg.sender === 'You' || msg.senderId === user.employee_id;
          const isAI = msg.sender === 'AI';
          
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               <div className="flex items-center gap-2 mb-1">
                  {!isMe && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-sm
                        ${isAI ? 'bg-gradient-to-tr from-purple-500 to-blue-500' : 'bg-green-600'}
                      `}>
                        {isAI ? <Bot className="w-3 h-3" /> : msg.sender[0]}
                      </div>
                  )}
                  <span className="text-[10px] text-gray-500">{isMe ? 'You' : msg.sender} • {msg.time}</span>
               </div>
               
               <div className={`max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed shadow-sm whitespace-pre-wrap
                   ${isMe 
                     ? 'bg-blue-600 text-white rounded-tr-none' 
                     : isAI 
                        ? 'bg-[#2d2d30] text-gray-200 border border-purple-500/30 rounded-tl-none' 
                        : 'bg-[#3e3e42] text-gray-200 rounded-tl-none'
                   }
               `}>
                  {msg.text}
               </div>
            </div>
          );
        })}
        
        {isTyping && activeTab === 'ai' && (
            <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center"><Bot className="w-3 h-3 text-white" /></div>
                <div className="bg-[#2d2d30] px-3 py-2 rounded-lg rounded-tl-none border border-purple-500/20">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[#333] bg-[#252526]">
        <div className="relative flex items-center">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === 'ai' ? "Ask Gemini AI..." : "Message team..."}
                className="w-full bg-[#3c3c3c] text-white text-xs rounded-md pl-3 pr-10 py-3 outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500 transition-all border border-transparent focus:border-blue-500"
            />
            <div className="absolute right-2 flex items-center gap-1">
                <Mic className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition" />
                <button type="submit" disabled={!input.trim()} className="p-1 rounded hover:bg-blue-600/20 text-blue-500 transition disabled:opacity-50">
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
      </form>
    </div>
  );
}
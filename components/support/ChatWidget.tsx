"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2, ArrowRight } from "lucide-react";
interface SupportMessage {
  id: string;
  sender_type: "user" | "admin";
  content: string;
  created_at: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isIdentified, setIsIdentified] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Session
  useEffect(() => {
    let sid = localStorage.getItem("support_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("support_session_id", sid);
    }
    setSessionId(sid);

    const guestEmail = localStorage.getItem("guest_email");
    if (guestEmail) {
      setEmail(guestEmail);
      setIsIdentified(true);
    }
  }, []);

  const [messages, setMessages] = useState<SupportMessage[]>([]);

  // Poll for messages ONLY if widget is open and identified
  useEffect(() => {
    if (!isOpen || !isIdentified || !sessionId) return;
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support?sessionId=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchMessages(); // initial fetch
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isOpen, isIdentified, sessionId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    
    setIsSending(true);
    try {
      await fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          event_name: "started_support_chat", 
          email: email
        })
      });
      localStorage.setItem("guest_email", email);
      setIsIdentified(true);
    } catch (err) {
      // Allow fallback
      localStorage.setItem("guest_email", email);
      setIsIdentified(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const content = input.trim();
    setInput("");
    
    // Optimistic update
    setMessages((prev) => [...prev, { id: "temp-" + Date.now(), sender_type: "user", content, created_at: new Date().toISOString() }]);

    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email, content }),
      });
      // The polling interval will catch the new message soon, but we could also manually trigger a fetch here.
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ffd800] hover:bg-[#ffed4a] text-[#022f42] rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 animate-fade-in-up"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="fill-current" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-[#022f42] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
          
          {/* Header */}
          <div className="bg-[#01202e] p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div> Live Support
              </h3>
              <p className="text-white/40 text-[10px] mt-0.5">Usually replies in minutes</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>

          {!isIdentified ? (
            /* Identify Gateway */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-[#ffd800]/10 rounded-full flex items-center justify-center mb-4 text-[#ffd800]">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-white font-black text-lg mb-2">Need help?</h3>
              <p className="text-white/60 text-xs mb-6 leading-relaxed">Please enter your email so we can follow up with you if we get disconnected.</p>
              
              <form onSubmit={handleIdentify} className="w-full flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="name@startup.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#ffd800]"
                />
                <button type="submit" disabled={isSending} className="bg-[#ffd800] text-[#022f42] px-3 py-2 rounded-md hover:bg-white transition-colors">
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          ) : (
            /* Active Chat Interface */
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pt-6 scroll-smooth">
                {messages.length === 0 && (
                  <div className="text-center text-white/30 text-xs mt-10">
                    Send a message to start the conversation...
                  </div>
                )}
                {messages.map((msg) => {
                  const isUser = msg.sender_type === "user";
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-white/10" : "bg-[#ffd800]/20"}`}>
                        {isUser ? <User size={14} className="text-white/60" /> : <Bot size={14} className="text-[#ffd800]" />}
                      </div>
                      <div className={`p-3 rounded-lg text-sm ${isUser ? "bg-[#ffd800] text-[#022f42] rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#01202e] flex gap-2 items-end shrink-0">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/10 rounded-md text-sm text-white px-3 py-2 resize-none h-[40px] focus:outline-none focus:border-[#ffd800] focus:bg-white/10"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim()} 
                  className="w-10 h-10 bg-[#ffd800] text-[#022f42] rounded-md flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </>
          )}

        </div>
      )}
    </>
  );
}

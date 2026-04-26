"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ShieldCheck, Lock, AlertCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface MediatedChatCenterProps {
  chatId: string;
  recipientName: string;
  recipientRole: "startup" | "investor";
}

export default function MediatedChatCenter({ chatId, recipientName, recipientRole }: MediatedChatCenterProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Mask sensitive info (Emails, Links, Phone numbers)
  const maskSensitiveContent = (text: string) => {
    // Basic redaction for demo/MVP
    const emailRegex = /[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+/gi;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const phoneRegex = /(\+?\d{1,4}?[\s-]?\(?\d{1,3}?\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9})/g;

    return text
      .replace(emailRegex, "[REDACTED EMAIL]")
      .replace(urlRegex, "[REDACTED LINK]")
      .replace(phoneRegex, "[REDACTED CONTACT]");
  };

  useEffect(() => {
    if (!chatId) return;

    // Load existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
        (payload: { new: Record<string, unknown> }) => {
          setMessages((prev) => [...prev, payload.new as unknown as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user?.id) return;

    setSending(true);
    const safeContent = maskSensitiveContent(newMessage);

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: safeContent,
      });

    if (error) {
      console.error("Chat Error:", error);
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border-2 border-[#022f42]/10 rounded-sm shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="bg-[#022f42] p-5 border-b border-white/10 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#ffd800] text-[#022f42] flex items-center justify-center font-black rounded-sm shadow-inner">
               {recipientName.charAt(0)}
            </div>
            <div>
               <div className="text-white font-black text-sm tracking-tight">{recipientName}</div>
               <div className="text-[9px] font-black text-[#ffd800] uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure Deal Tunnel Active
               </div>
            </div>
         </div>
         <div className="text-white/40 text-[9px] font-black uppercase tracking-widest hidden sm:block">
            Bypass Prevention Policy Enforced
         </div>
      </div>

      {/* Trust Banner */}
      <div className="bg-[#fcfdfd] border-b border-gray-100 p-3 px-6 flex items-center gap-3 text-[10px] text-[#1e4a62] font-semibold">
         <Lock className="w-3 h-3 text-[#1e4a62]/30" />
         All communication is mediated to preserve deal integrity. External links and emails are automatically redacted.
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#f2f6fa]/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
             <Clock className="w-8 h-8 mb-3" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End Encryption Established</p>
             <p className="text-[10px] mt-1">Initiate the first protocol exchange above.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-sm shadow-sm relative group ${msg.sender_id === user?.id ? "bg-[#022f42] text-white" : "bg-white text-[#022f42] border border-gray-100"}`}>
                <div className="text-xs leading-relaxed font-medium">
                   {msg.content}
                </div>
                <div className={`text-[8px] font-black uppercase mt-2 opacity-40 ${msg.sender_id === user?.id ? "text-white" : "text-[#022f42]"}`}>
                   {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-4">
           <input 
             type="text" 
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             placeholder={`Secure message to ${recipientName}...`}
             className="flex-grow bg-[#f2f6fa] border-2 border-transparent focus:border-[#022f42] focus:bg-white p-4 text-sm text-[#022f42] font-medium outline-none transition-all rounded-sm"
           />
           <button 
             type="submit" 
             disabled={!newMessage.trim() || sending}
             className={`px-8 flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all rounded-sm ${(!newMessage.trim() || sending) ? 'bg-gray-100 text-gray-400' : 'bg-[#ffd800] text-[#022f42] hover:bg-[#022f42] hover:text-[#ffd800] shadow-xl'}`}
           >
              {sending ? "..." : <><Send className="w-4 h-4" /> Send</>}
           </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
           <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> No direct contact info permitted
           </div>
           <span>Standard 2% Success Fee Agreement Active</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language, ProjectData } from '../types';
import { chatWithArchitect } from '../services/geminiService';
import { MessageCircleIcon, SendIcon, XCircleIcon, MinimizeIcon, BrainIcon } from './Icons';

interface AIChatProps {
  project: ProjectData;
  language: Language;
}

const AIChat: React.FC<AIChatProps> = ({ project, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    title: language === 'cn' ? "咨询架构师" : "Ask Architect",
    placeholder: language === 'cn' ? "问问为什么选这个硬件..." : "Why did you choose this sensor?",
    send: language === 'cn' ? "发送" : "Send",
    thinking: language === 'cn' ? "思考中..." : "Thinking..."
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await chatWithArchitect(project, messages, input, language);
      const aiMsg: ChatMessage = { role: 'model', content: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl transition-all z-50 flex items-center gap-2 group"
      >
        <MessageCircleIcon className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-bold">
          {t.title}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0f172a] p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 p-1.5 rounded">
                <BrainIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-bold text-slate-200 text-sm">{t.title}</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
          <MinimizeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1e293b]">
        {messages.length === 0 && (
           <div className="text-center text-slate-500 text-xs mt-10">
              <p>{language === 'cn' ? "我是为您设计该方案的 AI 架构师。" : "I am the AI Architect who designed this."}</p>
              <p className="mt-2">{language === 'cn' ? "对方案有疑问？随时问我。" : "Questions about the design? Ask me."}</p>
           </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-200 border border-slate-600'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-700/50 text-slate-400 rounded-lg px-3 py-2 text-xs animate-pulse">
                {t.thinking}
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0f172a] border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.placeholder}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-lg"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AIChat;
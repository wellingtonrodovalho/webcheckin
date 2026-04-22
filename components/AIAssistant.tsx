
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIHelp } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  currentContext: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente do Wellington. Como posso ajudar com seu cadastro hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAIHelp(input, currentContext);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Eita, deu um erro aqui. Pode tentar de novo?' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-['Nunito']">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[320px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
            id="ai_chat_window"
          >
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-sm"></i>
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">Assistente Virtual</h3>
                  <p className="text-[10px] opacity-80 font-bold uppercase">Online para ajudar</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                id="close_ai_chat"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 p-3 rounded-2xl border border-slate-100 italic text-xs flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                    <span className="animate-bounce [animation-delay:0.4s]">.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Como posso ajudar?"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                  id="ai_chat_input"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                  id="send_ai_message"
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-6 h-14 rounded-full flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-110 active:scale-90 ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
        }`}
        id="toggle_ai_chat"
      >
        <span className="font-black text-sm uppercase tracking-widest">Ajuda</span>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-xl`}></i>
      </button>
    </div>
  );
};

export default AIAssistant;

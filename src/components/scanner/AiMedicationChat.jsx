import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, Lightbulb, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button';
import Card from '../Card';
import toast from 'react-hot-toast';

const SYSTEM_INSTRUCTION = "You are MediRemind AI, an empathetic healthcare assistant for the MediRemind application. Help users understand medication timing, side effects, and health habits clearly and concisely. Always include a brief medical disclaimer.";

const SUGGESTED_PROMPTS = [
  "💊 What should I do if I miss a medication dose?",
  "⚠️ Can I take Paracetamol with Amoxicillin?",
  "🍽️ Should I take my antibiotics before or after food?",
  "⏰ How can I manage side effects like nausea or fatigue?",
  "💡 Best practices for storing pills and liquid medicine"
];

export default function AiMedicationChat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('mediremind_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Hello! I am MediRemind AI Assistant.**\n\nHow can I help you with your medications today? You can ask me about:\n- Dosage instructions & timing\n- Food & drug interaction checks\n- Missed dose guidance\n- Managing common side effects`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    try {
      localStorage.setItem('mediremind_ai_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = async (textToSend = null) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API Key needs to be configured in environment variables. Please set VITE_GEMINI_API_KEY.');
      }

      // Dynamically import to avoid top-level load errors if package missing
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

      const chat = model.startChat({
        history: historyPayload,
      });

      const result = await chat.sendMessage(queryText);
      const response = await result.response;
      const replyText = response.text() || 'I received your query but could not generate a reply.';

      const botMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Gemini Chat Service Error:', error);
      toast.error(error.message || 'Unable to communicate with MediRemind AI.');
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **API Notice:** ${error.message || 'Could not complete request to MediRemind AI.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const initial = [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Hello! I am MediRemind AI Assistant.**\n\nHow can I help you with your medications today? You can ask me about:\n- Dosage instructions & timing\n- Food & drug interaction checks\n- Missed dose guidance\n- Managing common side effects`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initial);
    localStorage.removeItem('mediremind_ai_chat_history');
    toast.success('Chat history cleared');
  };

  return (
    <Card className="flex flex-col h-[600px] border-teal-500/20 shadow-xl overflow-hidden p-0 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              MediRemind AI Medication Chat
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                Gemini 1.5 Flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instant answers for dosages, interactions & side effects
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear Chat History"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb size={12} className="text-amber-500" /> Prompts:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-2xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/20">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-xs font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
                <div
                  className={`text-[9px] mt-1.5 text-right font-mono ${
                    msg.role === 'user' ? 'text-teal-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-3 items-center text-teal-600 dark:text-teal-400 text-xs font-medium">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <Sparkles size={16} className="animate-spin" />
            </div>
            <span className="animate-pulse">MediRemind AI is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="px-3 py-1.5 bg-amber-500/5 border-t border-amber-500/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
        <ShieldAlert size={12} className="text-amber-500 shrink-0" />
        <span>For informational purposes only. Consult a licensed doctor or pharmacist for emergency decisions.</span>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about medication dosage, side effects, interactions..."
          disabled={isLoading}
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="sm"
          className="rounded-xl px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </Button>
      </form>
    </Card>
  );
}


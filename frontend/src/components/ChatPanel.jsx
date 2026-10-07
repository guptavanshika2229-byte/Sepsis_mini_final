import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Trash2, 
  RefreshCw,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { sendChatMessage } from '../api/client';

export default function ChatPanel({ patientId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Hello Doctor! I am your Clinical AI Assistant for Patient ${patientId}. You can ask me why the risk is high, what treatments to give, or to summarize recent vitals.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [patientId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText = inputText) => {
    const textToSend = questionText.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendChatMessage(patientId, textToSend);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer || 'Response generated based on model predictions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Unable to connect to clinical assistant service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    `Why is Patient ${patientId}'s risk high?`,
    `What treatments will reduce sepsis risk?`,
    `Summarize vitals & blood lactate trend.`
  ];

  return (
    <div className="space-y-4 flex flex-col h-[600px]">
      {/* App Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Sepsis AI Clinical Assistant</h3>
            <p className="text-xs text-slate-500">Grounded in patient {patientId}'s trajectory & SHAP metrics</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([])}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          title="Clear Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 transition text-left"
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Canvas */}
      <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                isUser ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
              }`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                isUser 
                  ? 'bg-indigo-600 text-white font-medium shadow-sm rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none'
              }`}>
                <p className="whitespace-pre-line">{m.text}</p>
                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-white p-3 rounded-xl border border-slate-200 w-fit">
            <Sparkles className="h-4 w-4 animate-spin text-indigo-600" />
            Analyzing patient data & generating response...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
        <input
          type="text"
          placeholder={`Ask about Patient ${patientId}'s condition...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}

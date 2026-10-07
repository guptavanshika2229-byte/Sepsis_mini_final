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
    // Reset conversation context when patient changes
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Hello, Doctor. I am your Clinical AI Assistant grounded in patient ${patientId}'s trajectory, multimodal BiGRU risk model, and SHAP explainability drivers. How can I assist you with ${patientId}'s care plan today?`,
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
        text: 'Unable to reach clinical assistant service. Please check network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Chat history cleared. Grounded assistant ready for patient ${patientId}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const sampleQuestions = [
    `Why is ${patientId}'s risk increasing?`,
    `What interventions do you recommend?`,
    `Summarize ${patientId}'s vitals and SHAP drivers.`
  ];

  return (
    <div className="glass-card p-6 flex flex-col h-[650px] gap-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Clinical Assistant Q&A
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
                Grounded in {patientId}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Conversational synthesis backed by deep model inference & SHAP attributions.
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition flex items-center gap-1"
          title="Clear Chat History"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {/* Suggested Question Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> Quick Prompts:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition hover:border-rose-500/40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-rose-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 border-b border-white/10 pb-1">
                  <span className="font-semibold uppercase tracking-wider">
                    {isAssistant ? 'Clinical AI Assistant' : 'Physician / Nurse'}
                  </span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                {isAssistant && (
                  <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>AI-Generated • Grounded in Patient Data & Model Features</span>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="p-2 rounded-lg bg-rose-500 text-white shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-rose-400 shrink-0">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Synthesizing clinical response...</span>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          placeholder={`Ask a question regarding ${patientId}'s trajectory or risk drivers...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-rose-500 transition disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
      </form>
    </div>
  );
}

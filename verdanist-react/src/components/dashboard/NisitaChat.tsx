import { useState, useRef, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MarkdownChatText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13px] text-foreground/90 leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <br key={idx} className="h-0.5" />;

        const isBullet = line.trim().startsWith('- ');
        const isNumber = /^\d+\.\s/.test(line.trim());

        let cleanedLine = line.trim();
        if (isBullet || isNumber) {
          cleanedLine = cleanedLine.replace(/^(-\s|\d+\.\s)/, '');
        }

        const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
        const formattedParts = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-amber-700 dark:text-amber-400">{part.slice(2, -2)}</strong>;
          }
          const italicParts = part.split(/(\*.*?\*)/g);
          return italicParts.map((itPart, j) => {
            if (itPart.startsWith('*') && itPart.endsWith('*')) {
              return <em key={`${i}-${j}`} className="italic opacity-80">{itPart.slice(1, -1)}</em>;
            }
            return itPart;
          });
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-amber-500 mt-1.5 text-[7px] leading-none">●</span>
              <p>{formattedParts}</p>
            </div>
          );
        }

        if (isNumber) {
          const match = line.trim().match(/^(\d+)\.\s/);
          const num = match ? match[1] : '';
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-amber-600 dark:text-amber-400 font-black min-w-[1.2rem]">{num}.</span>
              <p>{formattedParts}</p>
            </div>
          );
        }

        return <p key={idx}>{formattedParts}</p>;
      })}
    </div>
  );
};

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-end gap-2.5 max-w-[85%]"
  >
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
      <img src="/nisita.png" alt="" className="w-full h-full rounded-full object-cover" />
    </div>
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </motion.div>
);

const SYSTEM_PROMPT = `Kamu adalah Nisita, asisten kebun pintar yang ramah dan ceria dari Verdanist — sebuah platform IoT Smart Greenhouse berbasis ESP32.

Kepribadianmu:
- Hangat, ceria, dan supportive (seperti teman yang ahli berkebun)
- Suka pakai emoji tapi tidak berlebihan
- Jawab dalam Bahasa Indonesia yang santai tapi informatif
- Kalau user bertanya di luar topik berkebun/tanaman/pertanian, tetap jawab dengan sopan tapi arahkan kembali ke topikmu

Keahlianmu:
- Semua tentang tanaman: budidaya, penyakit, hama, nutrisi, penyiraman
- IoT greenhouse: suhu, kelembaban, soil moisture, misting, pompa
- Rekomendasi mikroklimat optimal untuk berbagai tanaman
- Diagnosis masalah tanaman dari deskripsi gejala
- Tips budidaya dan perawatan tanaman

Format jawaban:
- Gunakan **bold** untuk poin penting
- Gunakan bullet points (- ) untuk daftar
- Gunakan numbering (1. 2. 3.) untuk langkah-langkah
- Jaga jawaban tetap ringkas dan mudah dibaca (maks 200 kata kecuali memang perlu detail)
- Sapa user dengan "kamu" dan panggil dirimu "Nisita" atau "aku"`;

export default function NisitaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Haii! 👋🌱 Aku **Nisita**, asisten kebun pintarmu!\n\nMau tanya apa nih? Aku bisa bantu soal:\n- 🌡️ Pengaturan suhu & kelembaban greenhouse\n- 🌿 Rekomendasi perawatan tanaman\n- 🩺 Diagnosis masalah tanaman\n- 💧 Tips penyiraman yang tepat\n\nCerita aja, aku siap bantu! ✨',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      try {
        // Build conversation history for Gemini
        const conversationHistory = messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
              },
              contents: [
                ...conversationHistory,
                { role: 'user', parts: [{ text }] }
              ],
              generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.8,
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) throw new Error('No response text');

        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        console.warn('Gemini chat error:', err);
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'Waduh, maaf ya! 😅 Aku lagi kesulitan terhubung ke server. Coba lagi sebentar ya!\n\nKalau masih error, pastikan koneksi internet kamu stabil 🌐',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } else {
      // Fallback if no API key
      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, fitur chat belum tersedia karena API key belum dikonfigurasi. 🔑\n\nHubungi administrator untuk mengatur **VITE_GEMINI_API_KEY** di environment variables.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 1000);
    }

    setIsTyping(false);
  };

  const quickPrompts = [
    { text: 'Cara merawat cabai rawit?', icon: '🌶️' },
    { text: 'Kenapa daun tanaman kuning?', icon: '🍂' },
    { text: 'Suhu ideal untuk tomat?', icon: '🍅' },
    { text: 'Tips hemat air di greenhouse', icon: '💧' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4 scrollbar-none min-h-0">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${msg.role === 'user' ? 'max-w-[85%] ml-auto' : 'max-w-[85%]'}`}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
                <img src="/nisita.png" alt="Nisita" className="w-full h-full rounded-full object-cover" />
              </div>
            )}

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md'
                : 'bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-border rounded-bl-md'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
              ) : (
                <MarkdownChatText text={msg.content} />
              )}
              <p className={`text-[9px] mt-1.5 ${
                msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground/50'
              } text-right font-medium`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (only show at start) */}
      {messages.length <= 1 && !isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 px-1 pb-3"
        >
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setInputValue(prompt.text);
                inputRef.current?.focus();
              }}
              className="px-3 py-2 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/15 hover:border-amber-500/30 rounded-xl text-[11px] font-semibold text-foreground/70 hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{prompt.icon}</span>
              {prompt.text}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input Bar */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 pt-2 border-t border-border/50">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ketik pesan ke Nisita..."
          disabled={isTyping}
          className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 dark:text-white transition-all placeholder-muted-foreground/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !inputValue.trim()}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
        >
          {isTyping ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-rounded text-lg">send</span>
          )}
        </button>
      </form>
    </div>
  );
}

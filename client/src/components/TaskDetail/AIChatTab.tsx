import React, { useState, useRef, useEffect } from 'react';

interface AIChatTabProps {
  taskId: number;
  projectSlug: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function AIChatTab({ taskId, projectSlug }: AIChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Use Vite env for AI backend URL or fallback to localhost:8000
  const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api/v1/ai';

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${AI_API_URL}/query`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectSlug,
          task_id: String(taskId),
          question: userMessage.text,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. ' + (data.detail || '') }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Network error: Unable to reach AI server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-100">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-zinc-500 text-sm text-center mt-10">
            Ask me anything about the documents uploaded to this task or project!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-[10px] font-semibold mb-1 px-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-zinc-500' : 'text-[#098032]'}`}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-white rounded-tr-sm'
                    : 'bg-[#121212] border border-zinc-800 text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-semibold mb-1 px-1 uppercase tracking-wider text-[#098032]">AI</span>
            <div className="max-w-[85%] p-3 bg-[#121212] border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm text-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-auto relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="w-full h-11 pl-4 pr-12 bg-[#121212] border border-zinc-800 focus:border-[#098032] focus:outline-none rounded-xl text-sm text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-[#098032] hover:bg-[#076a29] disabled:bg-zinc-800 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}

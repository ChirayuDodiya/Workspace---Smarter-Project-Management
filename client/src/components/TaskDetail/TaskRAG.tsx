import { useState, useRef } from 'react';
import axios from 'axios';

interface TaskRAGProps {
  taskId: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TaskRAG({ taskId }: TaskRAGProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use Vite environment variable, Nginx proxy path, or fallback to localhost:8000
  const RAG_API_URL = import.meta.env.VITE_RAG_API_URL 
    ? import.meta.env.VITE_RAG_API_URL 
    : import.meta.env.PROD 
      ? '/rag' 
      : 'http://localhost:8000';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('task_id', taskId.toString());

    try {
      const response = await axios.post(`${RAG_API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage(`Success: Processed ${response.data.chunks_count} chunks.`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setQuestion('');
    setIsQuerying(true);

    try {
      const response = await axios.post(`${RAG_API_URL}/query`, {
        task_id: taskId.toString(),
        question: userQuestion
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error: any) {
      console.error('Query failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.response?.data?.detail || error.message}` 
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex flex-col h-125 text-sm">
      {/* Upload Section */}
      <div className="mb-4 pb-4 border-b border-zinc-800">
        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
          Upload Reference Document (PDF)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-zinc-700 text-xs font-medium cursor-pointer"
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </button>
          <span className="text-xs text-zinc-500">
            {uploadMessage || 'Upload PDF to enable AI Q&A'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-10 text-xs">
            Ask a question based on uploaded documents.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-xl max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-[#045c22] text-white ml-auto rounded-tr-sm' 
                  : 'bg-zinc-800 text-zinc-200 mr-auto rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {isQuerying && (
          <div className="bg-zinc-800 text-zinc-400 p-3 rounded-xl max-w-[85%] mr-auto rounded-tl-sm animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Input Section */}
      <form onSubmit={handleAskQuestion} className="relative mt-auto flex">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:border-[#098032] transition-colors"
          disabled={isQuerying}
        />
        <button
          type="submit"
          disabled={!question.trim() || isQuerying}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#045c22] hover:bg-[#074c1f] disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

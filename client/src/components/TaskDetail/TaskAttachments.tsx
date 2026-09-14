import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Download, Trash2, File, Upload, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  user_id: number;
  download_url: string | null;
  users: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

interface TaskAttachmentsProps {
  taskId: number;
  currentUser: any;
}

export function TaskAttachments({ taskId, currentUser }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/attachments`);
      setAttachments(res.data.data);
    } catch (err) {
      console.error('Failed to load attachments', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    let hasError = false;

    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        hasError = true;
      } else {
        formData.append('files', file);
      }
    });

    if (hasError) {
      setError('One or more files exceed the 50MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchAttachments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-8 bg-[#181818] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#121212] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#098032]/10 flex items-center justify-center text-[#098032]">
            <Paperclip className="w-4 h-4" />
          </div>
          <h3 className="text-base font-semibold text-white uppercase tracking-wider">Attachments</h3>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
            {attachments.length}
          </span>
        </div>

        <div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-3 py-1.5 bg-[#098032] hover:bg-[#074c1f] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors border border-transparent"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="p-5">
        {attachments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
              <File className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">No attachments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((file) => (
              <div key={file.id} className="flex flex-col bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-700/50">
                    <File className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.download_url && (
                      <a
                        href={file.download_url}
                        download={file.original_name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {(file.user_id === currentUser?.id || currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate mb-1" title={file.original_name}>
                    {file.original_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

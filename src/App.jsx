import { useState, useRef, useEffect } from 'react';
import './App.css';

const quickPrompts = [
  'Buatkan ide konten untuk Instagram bisnis kopi',
  'Ringkas artikel ini dalam 5 poin penting',
  'Tolong bikin caption promosi yang friendly'
];

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_FILE_CHARS = 12000;
const supportedExtensions = [
  'txt',
  'md',
  'csv',
  'json',
  'xml',
  'html',
  'css',
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'java'
];

const getFileExtension = (fileName) => fileName.toLowerCase().split('.').pop();

const isSupportedFile = (file) => {
  const extension = getFileExtension(file.name);
  return supportedExtensions.includes(extension);
};

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya Hermes. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fillQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const clearAttachedFile = () => {
    setAttachedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSupportedFile(file)) {
      setFileError('Format file belum didukung. Gunakan file teks seperti txt, csv, json, md, atau source code.');
      setAttachedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 1 MB agar proses tetap cepat.');
      setAttachedFile(null);
      return;
    }

    try {
      const content = await file.text();
      const normalizedContent = content.trim();

      if (!normalizedContent) {
        setFileError('File kosong. Pilih file lain yang berisi teks.');
        setAttachedFile(null);
        return;
      }

      setAttachedFile({
        name: file.name,
        content: normalizedContent.slice(0, MAX_FILE_CHARS),
        isTruncated: normalizedContent.length > MAX_FILE_CHARS
      });
      setFileError('');
    } catch (error) {
      console.error('Gagal membaca file:', error);
      setFileError('File tidak bisa dibaca. Coba file lain.');
      setAttachedFile(null);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    const basePrompt = input.trim() || 'Tolong analisa file ini.';
    const fileContext = attachedFile
      ? `\n\nFile terlampir: ${attachedFile.name}\n\n${attachedFile.content}${attachedFile.isTruncated ? '\n\n[Konten dipotong karena terlalu panjang]' : ''
      }`
      : '';

    const finalMessage = `${basePrompt}${fileContext}`;
    const userMessage = {
      role: 'user',
      content: attachedFile ? `${basePrompt}\n\n📎 File: ${attachedFile.name}` : basePrompt
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    clearAttachedFile();
    setIsLoading(true);

    try {
      // GANTI STRING DI BAWAH DENGAN URL RENDER ANDA (contoh: https://api-hermes-agent.onrender.com/api/chat)
      const response = await fetch('https://bot-hermes-15pr.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalMessage })
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan format balasan.' }]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, gagal terhubung ke server backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-orb orb-left" />
      <div className="bg-orb orb-right" />

      <main className="app-container">
        <header className="header">
          <div>
            <p className="eyebrow">AI Assistant</p>
            <h1>Hermes Workspace</h1>
          </div>
          <span className="status-chip">Online</span>
        </header>

        <section className="quick-prompts" aria-label="Quick prompts">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              type="button"
              className="prompt-chip"
              onClick={() => fillQuickPrompt(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </section>

        <section className="chat-container" aria-live="polite">
          <div className="message-list">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.role}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper assistant">
                <div className="message-bubble loading">Hermes sedang mengetik...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="input-form">
            <input
              ref={fileInputRef}
              type="file"
              className="file-input-hidden"
              onChange={onFileChange}
              disabled={isLoading}
            />

            <div className="composer-tools">
              <button
                type="button"
                className="upload-btn"
                onClick={openFilePicker}
                disabled={isLoading}
              >
                📄 Unggah File
              </button>

              {attachedFile && (
                <div className="attached-file-pill" role="status">
                  <span>{attachedFile.name}</span>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={clearAttachedFile}
                    disabled={isLoading}
                    aria-label="Hapus file"
                  >
                    x
                  </button>
                </div>
              )}
            </div>

            {fileError && <p className="file-error">{fileError}</p>}

            <div className="composer-row">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pertanyaan atau tugas Anda..."
                disabled={isLoading}
              />
              <button type="submit" className="send-btn" disabled={isLoading || (!input.trim() && !attachedFile)}>
                Kirim
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
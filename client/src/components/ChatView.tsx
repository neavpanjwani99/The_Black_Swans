import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import '../assets/css/ChatView.css';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  citations?: Array<{ id: string; station: string; type: string; date: string }>;
}

interface ChatViewProps {
  setActiveTab: (tab: any) => void;
}

// Custom Premium SVG Icons replacing emojis
function Volume2Icon({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MicIcon({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function FileTextIcon({ size = 14, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function Trash2Icon({ size = 14, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ChatView({ setActiveTab }: ChatViewProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Kannada'>('English');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize and persist chat history in sessionStorage to maintain thread state across tab switching
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('drishti_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        sender: 'ai',
        text: 'DRISHTI query system initialized. Search the database for FIR entries, suspects, registered vehicles, or crime metrics.'
      }
    ];
  });

  useEffect(() => {
    sessionStorage.setItem('drishti_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Export Chat History to PDF via print window
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>DRISHTI Chat Briefing Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; line-height: 1.6; color: #1f2937; }
            h2 { color: #5a6c63; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
            .meta-info { font-size: 0.875rem; color: #4b5563; margin-bottom: 20px; }
            .msg { margin-bottom: 15px; padding: 15px; border-radius: 6px; }
            .user { background: #f3f4f6; border-left: 4px solid #6b7280; }
            .ai { background: #f4f6f5; border-left: 4px solid #5a6c63; }
            .role { font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: #4b5563; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h2>DRISHTI Investigation Briefing Report</h2>
          <div class="meta-info">
            <strong>Generated on:</strong> ${new Date().toLocaleString()}<br/>
            <strong>Language Context:</strong> ${language}
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
          ${chatHistory.map(msg => `
            <div class="msg ${msg.sender}">
              <div class="role">${msg.sender === 'user' ? 'Officer' : 'DRISHTI AI'}</div>
              <div>${msg.text}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };


  // Voice Input (Speech-to-Text) using Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'English' ? 'en-IN' : 'kn-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showToast('Microphone access denied. Please allow microphone permissions in settings.', 'error');
      } else {
        showToast(`Voice input error: ${event.error}`, 'error');
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => (prev ? prev + ' ' + transcript : transcript));
      showToast('Speech captured successfully!', 'success');
    };

    recognition.start();
  };

  // Audio Readout (Text-to-Speech) using Web Speech Synthesis API
  const handleTextToSpeech = (text: string) => {
    // window.speechSynthesis (built-in browser API, no need to import)
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      showToast('Speech synthesis stopped.', 'info');
      return;
    }

    // Strip HTML/markdown/citations markup from speech output
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'English' ? 'en-IN' : 'kn-IN';

    utterance.onstart = () => {
      showToast('Playing audio readout...', 'info');
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      showToast('Audio readout playback error.', 'error');
    };

    window.speechSynthesis.speak(utterance);
  };




  // Chat Submission
  const handleChatSubmit = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const query = customMsg || chatInput;
    if (!query.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', text: query };
    setChatHistory(prev => [...prev, userMsg]);
    if (!customMsg) setChatInput('');
    setChatLoading(true);

    try {
      // Build history payload
      const historyPayload = chatHistory.map(h => ({
        sender: h.sender,
        text: h.text
      }));
      const res = await api.chat(query, historyPayload);

      // Simulate slight thinking delay
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          sender: 'ai',
          text: res.response,
          citations: res.citations
        }]);
        setChatLoading(false);
      }, 700);

    } catch (err) {
      console.error(err);
      setChatLoading(false);
    }
  };

  // Pre-configured chat queries
  const sampleQueries = [
    "Show recent apartment burglaries in Banaswadi with repeat accused.",
    "Which of those share the same phone number or vehicle?",
    "Show 7-day crime trend forecast for Bangalore East district.",
    "Show criminal network for accused: Shiva, FIR #4521"
  ];

  return (
    <div className="chat-container">
      {/* Messages Panel */}
      <div className="chat-messages-pane">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>CCTNS Database Vector Search Engine</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Results queried directly from database records</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'English' | 'Kannada')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="English">English</option>
              <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            </select>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleExportPDF}
              disabled={chatHistory.length <= 1}
            >
              <FileTextIcon size={14} />
              <span>Export PDF</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setChatHistory([{ sender: 'ai', text: 'Conversational history cleared.' }]);
                showToast('Conversational history cleared.', 'info');
              }}
            >
              <Trash2Icon size={14} />
              <span>Reset Thread</span>
            </button>
          </div>
        </div>


        <div className="chat-body">
          {chatHistory.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <p style={{ margin: 0, flex: 1 }}>{m.text}</p>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => handleTextToSpeech(m.text)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      color: 'var(--text-secondary)',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    title="Read answer out loud"
                  >
                    <Volume2Icon size={14} />
                  </button>
                )}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="citations-list">
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>VERIFIED SOURCES:</p>
                  {m.citations.map((c, idx) => (
                    <a href="#" key={idx} className="citation-item" onClick={(e) => { e.preventDefault(); setActiveTab('ocr'); }}>
                      File: {c.id} &bull; {c.station} &bull; {c.type} ({c.date})
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
              <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
              <span>Retrieving records and generating cited response...</span>
            </div>
          )}
        </div>

        <div className="chat-footer">
          <form onSubmit={handleChatSubmit} className="chat-input-form" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleVoiceInput}
              style={{
                background: isRecording ? '#ef4444' : 'var(--bg-card)',
                color: isRecording ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--card-border)',
                borderRadius: '4px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              title="Voice Search (STT)"
            >
              <MicIcon size={16} />
              {isRecording && <span style={{ fontSize: '11px', fontWeight: 600 }}>STOP</span>}
            </button>
            <input
              type="text"
              className="chat-input"
              placeholder={isRecording ? "Listening... Speak now" : "Enter search parameters or select a query..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isRecording}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={isRecording}>Send</button>
          </form>
        </div>

      </div>

      {/* Chat Sidebar Pane */}
      <div className="chat-sidebar-pane">
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
          Sample Search Queries
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click a sample query to search the database:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {sampleQueries.map((q, idx) => (
            <button key={idx} className="btn btn-secondary" style={{ fontSize: '12px', textAlign: 'left', padding: '10px', display: 'block', width: '100%', lineHeight: '1.4' }} onClick={() => handleChatSubmit(undefined, q)}>
              "{q}"
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(90, 108, 99, 0.03)', border: '1px solid rgba(90, 108, 99, 0.15)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
          <p style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '4px' }}>Governance Compliance</p>
          All search queries are recorded in the audit log, detailing officer credentials, access timestamps, and references.
        </div>
      </div>

      {/* Premium Toast Notification Popups */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#eff6ff',
          color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#15803d' : '#1d4ed8',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : toast.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10000,
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}


import { useState } from 'react';
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

export function ChatView({ setActiveTab }: ChatViewProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'DRISHTI query system initialized. Search the database for FIR entries, suspects, registered vehicles, or crime metrics.'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

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
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setChatHistory([{ sender: 'ai', text: 'Conversational history cleared.' }])}>
            Reset Thread
          </button>
        </div>

        <div className="chat-body">
          {chatHistory.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
              <p>{m.text}</p>
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
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              placeholder="Enter search parameters or select a query..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Send</button>
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
    </div>
  );
}

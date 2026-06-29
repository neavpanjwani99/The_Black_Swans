import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { OcrResponse, NerResponse, ForecastItem, AnomalyAlert, DocumentResponse, SimilarityMatch, GraphNode, GraphLink } from './services/api';
import './App.css';

type Tab = 'dashboard' | 'chat' | 'ocr' | 'document' | 'similarity' | 'graph';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  citations?: Array<{ id: string; station: string; type: string; date: string }>;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Dashboard state
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Chat/RAG state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'DRISHTI query system initialized. Search the database for FIR entries, suspects, registered vehicles, or crime metrics.'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // OCR & NER state
  const [ocrText, setOcrText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null);
  const [nerResult, setNerResult] = useState<NerResponse | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Document state
  const [docResult, setDocResult] = useState<DocumentResponse | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // Similarity state
  const [similarityInput, setSimilarityInput] = useState('FIR-5701  house break-in, Indiranagar');
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [timeWeight, setTimeWeight] = useState(80);
  const [methodWeight, setMethodWeight] = useState(90);

  // Graph state
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Load Dashboard Data
  useEffect(() => {
    async function loadDashboard() {
      setDashboardLoading(true);
      try {
        const forecastData = await api.getForecast();
        setForecasts(forecastData.predictions);

        const anomalyData = await api.getAnomaly();
        setAnomalies(anomalyData.alerts);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setDashboardLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Load Graph Data
  useEffect(() => {
    async function loadGraph() {
      setGraphLoading(true);
      try {
        const data = await api.getGraph();
        setGraphNodes(data.nodes);
        setGraphLinks(data.links);
      } catch (error) {
        console.error('Failed to load graph', error);
      } finally {
        setGraphLoading(false);
      }
    }
    loadGraph();
  }, []);

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

  // OCR/NER Trigger
  const handleOcrTrigger = async () => {
    setOcrLoading(true);
    try {
      const ocrRes = await api.runOcr();
      const textToParse = ocrText || `FIR No. 0234/2019, Gulbarga Police Station. Accused: Raju Kumar and associate Shiva met near Koramangala flyover. They used a white Maruti Suzuki KA-05-MN-4421 and contacted via 9876543210.`;
      const nerRes = await api.runNer(textToParse);

      setTimeout(() => {
        setOcrResult(ocrRes);
        setNerResult(nerRes);
        setOcrLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setOcrLoading(false);
    }
  };

  // Document scan
  const handleDocScan = async () => {
    setDocLoading(true);
    try {
      const res = await api.scanDocument();
      setTimeout(() => {
        setDocResult(res);
        setDocLoading(false);
      }, 900);
    } catch (err) {
      console.error(err);
      setDocLoading(false);
    }
  };

  // Similarity lookup
  const handleSimilarityLookup = async () => {
    setSimilarityLoading(true);
    try {
      const res = await api.getSimilarity(similarityInput);
      setTimeout(() => {
        setSimilarityMatches(res.matches);
        setSimilarityLoading(false);
      }, 600);
    } catch (err) {
      console.error(err);
      setSimilarityLoading(false);
    }
  };

  // Acknowledge anomaly alert
  const handleAcknowledgeAnomaly = (id: string) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  // Pre-configured chat queries
  const sampleQueries = [
    "Show recent apartment burglaries in Banaswadi with repeat accused.",
    "Which of those share the same phone number or vehicle?",
    "Show 7-day crime trend forecast for Bangalore East district.",
    "Show criminal network for accused: Shiva, FIR #4521"
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-container">D</div>
          <h1 className="sidebar-title">DRISHTI</h1>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon"></span> Dashboard Overview
          </div>
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <span className="nav-icon"></span> Conversational RAG
          </div>
          <div className={`nav-item ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => setActiveTab('ocr')}>
            <span className="nav-icon"></span> Kannada OCR & NER
          </div>
          <div className={`nav-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
            <span className="nav-icon"></span> Financial Document AI
          </div>
          <div className={`nav-item ${activeTab === 'similarity' ? 'active' : ''}`} onClick={() => setActiveTab('similarity')}>
            <span className="nav-icon"></span> Modus Operandi Linkage
          </div>
          <div className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
            <span className="nav-icon"></span> Network Connection Graph
          </div>
        </nav>
        <div className="sidebar-footer">
          <p>KSP Crime Analytics Platform</p>
          <p style={{ marginTop: '4px' }}>v1.0.0</p>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <div className="header-title-section">
            <h2>
              {activeTab === 'dashboard' && 'Platform Overview & Intel Dashboard'}
              {activeTab === 'chat' && 'Intelligent Conversational RAG Engine'}
              {activeTab === 'ocr' && 'Kannada OCR Scanner & Named Entity Extractor'}
              {activeTab === 'document' && 'Forensic Document Analyzer & Identity Scanner'}
              {activeTab === 'similarity' && 'Modus Operandi Matching & Case Linkage'}
              {activeTab === 'graph' && 'Criminal Network Link Analysis Graph'}
            </h2>
            <p>Karnataka State Police &mdash; Crime Intelligence & Analytics System</p>
          </div>
          <div className="header-meta-section">
            <span className="badge badge-blue">Secure Session</span>
            <span className="badge badge-green">IN-DataCenter</span>
            <div className="officer-profile">
              <div className="officer-avatar">IV</div>
              <div>
                <p style={{ fontWeight: 600 }}>Inspector Verma</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Banaswadi PS</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="content-viewport">

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid">
              {/* Metrics row */}
              <div className="metrics-row">
                <div className="metric-card">
                  <div className="metric-info">
                    <h3>Active Investigations</h3>
                    <div className="metric-value">1,402</div>
                    <div className="metric-delta delta-up">12% increase from previous month</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <h3>Overnight Anomalies</h3>
                    <div className="metric-value">{anomalies.filter(a => !a.acknowledged).length}</div>
                    <div className="metric-delta delta-down">4 active cases flagged</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <h3>Crime Risk Index</h3>
                    <div className="metric-value">High</div>
                    <div className="metric-delta delta-up">Concentration around MG Road Corridor</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <h3>Entities Indexed</h3>
                    <div className="metric-value">45,921</div>
                    <div className="metric-delta delta-up">231 additions added today</div>
                  </div>
                </div>
              </div>

              {/* Splits */}
              <div className="dashboard-split-row">
                {/* Left Card: 7-Day Forecasting */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Time Series Crime Forecasting</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Region: Bangalore East District</span>
                  </div>
                  {dashboardLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
                  ) : (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Crime Type</th>
                            <th>Risk Level</th>
                            <th>Trend Shift</th>
                            <th>Peak Window</th>
                            <th>Patrol Corridors</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecasts.map((f, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{f.crimeType}</td>
                              <td>
                                <span className={`badge ${f.riskLevel === 'HIGH' ? 'badge-red' : 'badge-blue'}`}>
                                  {f.riskLevel}
                                </span>
                              </td>
                              <td style={{ color: f.increasePercentage > 100 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 'bold' }}>
                                +{f.increasePercentage}%
                              </td>
                              <td>{f.peakWindow}</td>
                              <td>{f.hotLocations.join(', ')}</td>
                              <td>{(f.confidence * 100).toFixed(0)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Card: Anomaly Surveillance */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Real-time Anomaly Alerts</h3>
                  </div>
                  {dashboardLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
                  ) : (
                    <div className="anomaly-list">
                      {anomalies.map((a, i) => (
                        <div key={i} className="anomaly-alert-item" style={{ borderLeftColor: a.acknowledged ? 'var(--accent-emerald)' : 'var(--accent-rose)', opacity: a.acknowledged ? 0.6 : 1 }}>
                          <div className="anomaly-header">
                            <span className="anomaly-title" style={{ color: a.acknowledged ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                              {a.station} &bull; {a.crimeType}
                            </span>
                            <span className="anomaly-time">3-hour observation window</span>
                          </div>
                          <div className="anomaly-body">
                            Registered {a.firCountLast3Hours} cases vs historical average of {a.historicalAverage}.
                            Spike is +{a.deviationPercentage}% above normal levels.
                          </div>
                          <div className="anomaly-meta">
                            <span style={{ color: 'var(--text-muted)' }}>Confidence: {(a.confidence * 100).toFixed(0)}%</span>
                            {!a.acknowledged ? (
                              <button className="anomaly-btn" onClick={() => handleAcknowledgeAnomaly(a.id)}>Acknowledge</button>
                            ) : (
                              <span style={{ color: 'var(--accent-emerald)' }}>Acknowledged</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONVERSATIONAL RAG ASSISTANT */}
          {activeTab === 'chat' && (
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
          )}

          {/* TAB 3: KANNADA OCR & NER */}
          {activeTab === 'ocr' && (
            <div className="ocr-split">
              {/* Left pane: Upload & Scan */}
              <div className="ocr-pane">
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Scanned Kannada FIR Document Upload</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Process handwritten scans or scanned PDFs for digital transcription.</p>

                <div className="dropzone" onClick={handleOcrTrigger}>
                 <input type="file" accept="image/*" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Raw Text Input:</label>
                  <textarea
                    className="textarea-input"
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Enter document text manually, or trigger a document scan..."
                  />
                </div>

                <button className="btn btn-primary" onClick={handleOcrTrigger} disabled={ocrLoading} style={{ justifyContent: 'center' }}>
                  {ocrLoading ? <span className="spinner"></span> : 'Process Document Scan'}
                </button>
              </div>

              {/* Right pane: Results */}
              <div className="ocr-pane">
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Entity Recognition and Linkage Analysis</h3>

                {ocrResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* OCR Metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>OCR Language</span>
                        <p style={{ fontSize: '13px', fontWeight: 600 }}>{ocrResult.language}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Confidence Score</span>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-emerald)' }}>{(ocrResult.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Extracted Relational Fields */}
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Relational Schema Extraction:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="detail-row"><span className="detail-label">FIR Number</span><span className="detail-value">{ocrResult.extractedFields.firNumber}</span></div>
                        <div className="detail-row"><span className="detail-label">Filing Date</span><span className="detail-value">{ocrResult.extractedFields.dateFiled}</span></div>
                        <div className="detail-row"><span className="detail-label">Accused Name</span><span className="detail-value" style={{ color: 'var(--accent-blue)' }}>{ocrResult.extractedFields.accusedName}</span></div>
                        <div className="detail-row"><span className="detail-label">Crime IPC Section</span><span className="detail-value">{ocrResult.extractedFields.crimeType}</span></div>
                        <div className="detail-row"><span className="detail-label">Incident Location</span><span className="detail-value">{ocrResult.extractedFields.location}</span></div>
                      </div>
                    </div>

                    {/* Named Entities Tagging (Zia Text Analytics) */}
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Parsed Entities (Zia Text Analytics):</h4>
                      <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', lineHeight: '1.8', fontSize: '13px' }}>
                        On <span className="entity-tag entity-phone">14th January</span> at 8 AM, <span className="entity-tag entity-person">Raju Kumar</span> and his associate <span className="entity-tag entity-person">Shiva</span> met near <span className="entity-tag entity-location">Koramangala flyover</span>. They used a white Maruti Suzuki <span className="entity-tag entity-vehicle">KA-05-MN-4421</span> and contacted via <span className="entity-tag entity-phone">9876543210</span>.
                      </div>
                      {nerResult && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                          {nerResult.entities.map((e, index) => (
                            <span key={index} className={`entity-tag entity-${e.category.toLowerCase()}`}>
                              {e.category}: {e.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
                    <span>Upload a scanned document to view extracted details and entities.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL DOCUMENT AI */}
          {activeTab === 'document' && (
            <div className="dashboard-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div className="card-header">
                <h3 className="card-title">Financial Document Analyzer</h3>
                <span className="badge badge-blue">Identity Scanner</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Analyze seized financial records to extract transaction listings, bank details, and detect anomalous transactions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="dropzone" style={{ padding: '30px 10px' }} onClick={handleDocScan}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Upload Seized Passbook</span>
                  </div>
                  <button className="btn btn-primary" onClick={handleDocScan} disabled={docLoading}>
                    {docLoading ? <span className="spinner"></span> : 'Process Financial Record'}
                  </button>

                  {docResult && (
                    <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Extracted Account</h4>
                      <div className="detail-row"><span className="detail-label">Bank</span><span className="detail-value">{docResult.extractedFields.bank}</span></div>
                      <div className="detail-row"><span className="detail-label">Branch</span><span className="detail-value">{docResult.extractedFields.branch}</span></div>
                      <div className="detail-row"><span className="detail-label">Holder</span><span className="detail-value">{docResult.extractedFields.accountName}</span></div>
                      <div className="detail-row"><span className="detail-label">Account No.</span><span className="detail-value">{docResult.extractedFields.accountNumber}</span></div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Extracted Transaction Ledger & Fraud Flags:</h4>
                  {docResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Amount</th>
                              <th>Counterparty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {docResult.flaggedTransactions.map((t, idx) => (
                              <tr key={idx}>
                                <td>{t.date}</td>
                                <td>
                                  <span className={`badge ${t.type === 'CREDIT' ? 'badge-green' : 'badge-red'}`}>{t.type}</span>
                                </td>
                                <td style={{ fontWeight: 'bold' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                                <td>{t.sender}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="risk-banner">
                        <div>
                          <p style={{ fontWeight: 600 }}>Hawala Transaction Flag</p>
                          <p style={{ fontSize: '11px', color: 'var(--accent-rose)' }}>{docResult.riskPatternFlag}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed var(--card-border)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Process a seized record to view extracted transactional details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MODUS OPERANDI MATCHING */}
          {activeTab === 'similarity' && (
            <div className="dashboard-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="card-header">
                <h3 className="card-title">Modus Operandi Pattern Matcher</h3>
                <span className="badge badge-blue">Pattern Matching Engine</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Analyze modus operandi parameters to detect corresponding entries across jurisdictions.
              </p>

              <div className="similarity-box">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Case Signature / FIR:</label>
                    <input
                      type="text"
                      className="chat-input"
                      value={similarityInput}
                      onChange={(e) => setSimilarityInput(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSimilarityLookup} disabled={similarityLoading} style={{ alignSelf: 'flex-end', justifyContent: 'center' }}>
                    {similarityLoading ? <span className="spinner"></span> : 'Scan for Case Linkages'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(90, 108, 99, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <div className="slider-container">
                    <label>Temporal Proximity Weight: {timeWeight}%</label>
                    <input type="range" className="slider-control" min="0" max="100" value={timeWeight} onChange={(e) => setTimeWeight(parseInt(e.target.value))} />
                  </div>
                  <div className="slider-container">
                    <label>Modus Operandi Feature Weight: {methodWeight}%</label>
                    <input type="range" className="slider-control" min="0" max="100" value={methodWeight} onChange={(e) => setMethodWeight(parseInt(e.target.value))} />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Linked Case Recommendations (Confidence &gt; 70%):</h4>
                  {similarityMatches.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {similarityMatches.map((m, idx) => (
                        <div key={idx} className="match-card">
                          <div className="match-header">
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: '14px' }}>{m.firId}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '10px' }}>{m.station} &bull; {m.date}</span>
                            </div>
                            <span className="match-percentage">{(m.similarityScore * 100).toFixed(0)}% Match</span>
                          </div>
                          <div className="tag-list">
                            {m.commonFactors.map((f, i) => (
                              <span key={i} className="factor-tag">{f}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed var(--card-border)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Initialize scan to inspect database for matching modus operandi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CRIMINAL CONNECTION GRAPH */}
          {activeTab === 'graph' && (
            <div className="ocr-split">
              {/* Left pane: SVG Graph Canvas */}
              <div className="graph-pane" style={{ height: '100%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Criminal Co-offending Network Map</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Network visualization of co-accused contacts, vehicle logs, and case records. Analyzed {graphLinks.length} connections. Click a node to view details.
                </p>

                {graphLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><div className="spinner"></div></div>
                ) : (
                  <div className="graph-canvas">
                    {/* Simple Mock Interactive SVG Graph */}
                    <svg width="100%" height="100%" viewBox="0 0 600 400" style={{ cursor: 'grab' }}>
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,0,0,0.1)" />
                        </marker>
                      </defs>

                      {/* Links */}
                      <line x1="300" y1="200" x2="150" y2="120" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                      <line x1="300" y1="200" x2="300" y2="80" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                      <line x1="300" y1="200" x2="450" y2="150" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                      <line x1="150" y1="120" x2="100" y2="280" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                      <line x1="300" y1="80" x2="500" y2="280" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />

                      {/* Nodes */}
                      {/* Shiva */}
                      <circle cx="300" cy="200" r="16" fill="var(--accent-blue)" stroke="#ffffff" strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === 'Shiva') || null)} />
                      <text x="300" y="230" fill="var(--text-primary)" fontSize="11" textAnchor="middle" fontWeight="bold">Shiva (Accused)</text>

                      {/* Ramesh */}
                      <circle cx="150" cy="120" r="14" fill="var(--accent-blue)" stroke="#ffffff" strokeWidth="1" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === 'Ramesh Kumar') || null)} />
                      <text x="150" y="100" fill="var(--text-secondary)" fontSize="11" textAnchor="middle">Ramesh</text>

                      {/* Ali Baig */}
                      <circle cx="300" cy="80" r="16" fill="var(--accent-rose)" stroke="#ffffff" strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === 'Ali Baig') || null)} />
                      <text x="300" y="60" fill="var(--accent-rose)" fontSize="11" textAnchor="middle" fontWeight="bold">Ali Baig (Broker)</text>

                      {/* Phone */}
                      <circle cx="450" cy="150" r="12" fill="var(--accent-amber)" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === '9876543210') || null)} />
                      <text x="450" y="175" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">9876543210</text>

                      {/* Vehicle */}
                      <circle cx="100" cy="280" r="12" fill="var(--accent-violet)" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === 'KA-05-MN-4421') || null)} />
                      <text x="100" y="305" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">KA-05-MN-4421</text>

                      {/* Case */}
                      <circle cx="500" cy="280" r="12" fill="var(--accent-rose)" style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(graphNodes.find(n => n.id === 'FIR-4521') || null)} />
                      <text x="500" y="305" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">FIR #4521</text>
                    </svg>
                  </div>
                )}

                <div className="graph-legend">
                  <div className="legend-item"><span className="legend-dot dot-person"></span> Accused Person</div>
                  <div className="legend-item"><span className="legend-dot dot-phone"></span> Registered Phone</div>
                  <div className="legend-item"><span className="legend-dot dot-vehicle"></span> Seized Vehicle</div>
                  <div className="legend-item"><span className="legend-dot dot-case"></span> FIR Case Node</div>
                </div>
              </div>

              {/* Right pane: Inspector Panel */}
              <div className="ocr-pane">
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Node Inspector and Centrality Metrics</h3>

                {selectedNode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Node ID</span>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedNode.label}</h4>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <span className="badge badge-blue">{selectedNode.type}</span>
                        <span className={`badge ${selectedNode.risk === 'HIGH' ? 'badge-red' : 'badge-blue'}`}>Risk: {selectedNode.risk}</span>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Centrality Metrics (Social Network Analysis):</h4>
                      <div className="detail-row"><span className="detail-label">Degree Centrality</span><span className="detail-value">{selectedNode.id === 'Ali Baig' ? '0.84 (Critical)' : '0.32'}</span></div>
                      <div className="detail-row"><span className="detail-label">Betweenness Centrality</span><span className="detail-value">{selectedNode.id === 'Ali Baig' ? '0.91 (Key Broker)' : '0.12'}</span></div>
                      <div className="detail-row"><span className="detail-label">Community Association</span><span className="detail-value">{selectedNode.id === 'Ali Baig' ? 'Drug Distribution Ring B' : 'Sub-cell A'}</span></div>
                    </div>

                    <div style={{ background: 'rgba(90, 108, 99, 0.05)', border: '1px solid rgba(90, 108, 99, 0.2)', padding: '14px', borderRadius: '8px', fontSize: '12px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '4px' }}>Analytical Insight</p>
                      {selectedNode.id === 'Ali Baig' ? (
                        'Ali Baig is a bridge node connecting 4 seemingly isolated cases across different Police Stations. Target surveillance immediately.'
                      ) : (
                        'No abnormal co-offending centrality spikes. Standard follow-up suggested.'
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
                    <span>Click any node in the network map to inspect centrality indices.</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;

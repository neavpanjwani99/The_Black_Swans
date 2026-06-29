import { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import type { OcrResponse, NerResponse, ForecastItem, AnomalyAlert, DocumentResponse, SimilarityMatch, GraphNode, GraphLink, Entity } from './services/api';
import './App.css';
import Tesseract from 'tesseract.js';

type Tab = 'dashboard' | 'chat' | 'ocr' | 'document' | 'similarity' | 'graph';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  citations?: Array<{ id: string; station: string; type: string; date: string }>;
}

// Helper to render PDF pages to canvases using PDF.js loaded from CDN
async function renderPdfToCanvas(file: File): Promise<HTMLCanvasElement[]> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = (window as any).pdfjsLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases: HTMLCanvasElement[] = [];

  // Limit to first 3 pages for performance
  const numPages = Math.min(pdf.numPages, 3);
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      canvases.push(canvas);
    }
  }
  return canvases;
}

// Helper to render text with highlighted entities
function renderHighlightedText(text: string, entities: Entity[]) {
  if (!entities || entities.length === 0) return text;

  // Sort entities by start index to process in order
  const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedEntities.forEach((entity, idx) => {
    // Basic bounds and overlap check
    if (entity.start < lastIndex || entity.end > text.length || entity.start > entity.end) {
      return;
    }

    // Add text before the entity
    if (entity.start > lastIndex) {
      parts.push(text.substring(lastIndex, entity.start));
    }

    // Add highlighted entity
    const categoryClass = `entity-${entity.category.toLowerCase()}`;
    parts.push(
      <span key={idx} className={`entity-tag ${categoryClass}`}>
        {text.substring(entity.start, entity.end)}
      </span>
    );

    lastIndex = entity.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
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
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusMsg, setOcrStatusMsg] = useState('');
  const [ocrFileName, setOcrFileName] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Process text manually entered in textarea
  const handleManualTextProcess = async () => {
    if (!ocrText.trim()) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrProgress(100);
    setOcrStatusMsg('Sending to AI for analysis...');
    try {
      const [ocrRes, nerRes] = await Promise.all([
        api.runOcr(ocrText, 1.0),
        api.runNer(ocrText)
      ]);
      setOcrResult(ocrRes);
      setNerResult(nerRes);
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || 'An error occurred during processing.');
    } finally {
      setOcrLoading(false);
      setOcrStatusMsg('');
    }
  };

  // File-based OCR using Tesseract.js
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    setNerResult(null);
    setOcrFileName(file.name);
    setOcrProgress(0);
    setOcrStatusMsg('Preparing document...');

    try {
      let extractedText = '';
      let tesseractConfidence = 0;

      if (file.type === 'application/pdf') {
        // PDF: render each page to canvas, then OCR each canvas
        setOcrStatusMsg('Rendering PDF pages...');
        const canvases = await renderPdfToCanvas(file);
        const allText: string[] = [];
        let totalConf = 0;

        for (let i = 0; i < canvases.length; i++) {
          setOcrStatusMsg(`OCR on page ${i + 1} of ${canvases.length}...`);
          const result = await Tesseract.recognize(canvases[i], 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const pageProgress = ((i / canvases.length) + (m.progress / canvases.length)) * 100;
                setOcrProgress(Math.round(pageProgress));
              }
            }
          });
          allText.push(result.data.text);
          totalConf += result.data.confidence;
        }
        extractedText = allText.join('\n\n--- Page Break ---\n\n');
        tesseractConfidence = canvases.length > 0 ? totalConf / canvases.length / 100 : 0.9;
      } else {
        // Image: OCR directly
        setOcrStatusMsg('Recognizing text from image...');
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });
        extractedText = result.data.text;
        tesseractConfidence = result.data.confidence / 100;
      }

      setOcrText(extractedText);
      setOcrProgress(100);
      setOcrStatusMsg('Sending to AI for analysis...');

      const [ocrRes, nerRes] = await Promise.all([
        api.runOcr(extractedText, tesseractConfidence),
        api.runNer(extractedText)
      ]);

      setOcrResult(ocrRes);
      setNerResult(nerRes);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'An error occurred during OCR processing.');
    } finally {
      setOcrLoading(false);
      setOcrStatusMsg('');
      // Reset file input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Scanned FIR Document Upload</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Upload an image (JPG, PNG) or PDF. Tesseract.js extracts text client-side, then AI identifies entities.
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  className="dropzone"
                  onClick={() => !ocrLoading && fileInputRef.current?.click()}
                  style={{ cursor: ocrLoading ? 'not-allowed' : 'pointer', opacity: ocrLoading ? 0.6 : 1 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    disabled={ocrLoading}
                  />
                  <div style={{ fontSize: '32px', color: 'var(--text-secondary)' }}>📄</div>
                  {ocrFileName ? (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-blue)' }}>{ocrFileName}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to change file</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>Click to upload document</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supports JPG, PNG, PDF (up to 3 pages)</p>
                    </div>
                  )}
                </div>

                {/* OCR Progress Bar */}
                {ocrLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{ocrStatusMsg || 'Processing...'}</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{ocrProgress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${ocrProgress}%`,
                          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-emerald))',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {ocrError && (
                  <div style={{ background: 'rgba(191,63,74,0.07)', border: '1px solid rgba(191,63,74,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--accent-rose)' }}>
                    ⚠ {ocrError}
                  </div>
                )}

                {/* Manual Text Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Or enter text manually:
                  </label>
                  <textarea
                    className="textarea-input"
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Paste document text here to analyze directly without uploading a file..."
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleManualTextProcess}
                  disabled={ocrLoading || !ocrText.trim()}
                  style={{ justifyContent: 'center' }}
                >
                  {ocrLoading
                    ? <><span className="spinner" /><span style={{ marginLeft: '8px' }}>{ocrStatusMsg || 'Processing...'}</span></>
                    : '⚡ Analyze Text with AI'}
                </button>
              </div>

              {/* Right pane: Results */}
              <div className="ocr-pane">
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Entity Recognition and Linkage Analysis</h3>

                {ocrLoading && !ocrResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '16px', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px' }} />
                    <p style={{ fontSize: '13px' }}>{ocrStatusMsg || 'Running OCR and entity extraction...'}</p>
                  </div>
                )}

                {ocrResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* OCR Metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.5)', padding: '14px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OCR Language</span>
                        <p style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{ocrResult.language}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence Score</span>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>{(ocrResult.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Extracted Relational Fields */}
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Relational Schema Extraction:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        <div className="detail-row"><span className="detail-label">FIR Number</span><span className="detail-value" style={{ fontWeight: 700 }}>{ocrResult.extractedFields.firNumber}</span></div>
                        <div className="detail-row"><span className="detail-label">Filing Date</span><span className="detail-value">{ocrResult.extractedFields.dateFiled}</span></div>
                        <div className="detail-row"><span className="detail-label">Accused Name</span><span className="detail-value" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{ocrResult.extractedFields.accusedName}</span></div>
                        <div className="detail-row"><span className="detail-label">Crime IPC Section</span><span className="detail-value" style={{ fontWeight: 600 }}>{ocrResult.extractedFields.crimeType}</span></div>
                        <div className="detail-row" style={{ borderBottom: 'none', paddingBottom: 0 }}><span className="detail-label">Incident Location</span><span className="detail-value" style={{ fontWeight: 600 }}>{ocrResult.extractedFields.location}</span></div>
                      </div>
                    </div>

                    {/* Named Entities Tagging */}
                    {nerResult && nerResult.entities.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Parsed Entities (AI Text Analytics):</h4>

                        {/* Highlighted text view */}
                        <div style={{
                          background: 'var(--bg-primary)',
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1px solid var(--card-border)',
                          lineHeight: '2',
                          fontSize: '13px',
                          maxHeight: '160px',
                          overflowY: 'auto'
                        }}>
                          {ocrResult.rawText
                            ? renderHighlightedText(ocrResult.rawText, nerResult.entities)
                            : <span style={{ color: 'var(--text-muted)' }}>No raw text available for highlighting.</span>
                          }
                        </div>

                        {/* Entity tags by category */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          {nerResult.entities.map((e, index) => (
                            <span key={index} className={`entity-tag entity-${e.category.toLowerCase()}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                              <strong>{e.category}:</strong> {e.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reset button */}
                    <button
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => { setOcrResult(null); setNerResult(null); setOcrText(''); setOcrFileName(null); setOcrError(null); setOcrProgress(0); }}
                    >
                      ↺ Clear Results
                    </button>
                  </div>
                )}

                {!ocrResult && !ocrLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '40px' }}>🔍</span>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>No analysis yet</p>
                      <p style={{ fontSize: '12px' }}>Upload a document or enter text on the left to extract entities and relational fields.</p>
                    </div>
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

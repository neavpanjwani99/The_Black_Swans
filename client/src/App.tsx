import { useState } from 'react';
import './App.css';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { OcrView } from './components/OcrView';
import { DocumentView } from './components/DocumentView';
import { SimilarityView } from './components/SimilarityView';
import { GraphView } from './components/GraphView';

type Tab = 'dashboard' | 'chat' | 'ocr' | 'document' | 'similarity' | 'graph';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Overlay */}
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-container">D</div>
          <h1 className="sidebar-title">DRISHTI</h1>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', display: 'none' }}>
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
            <span className="nav-icon"></span> Dashboard Overview
          </div>
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }}>
            <span className="nav-icon"></span> Conversational RAG
          </div>
          <div className={`nav-item ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => { setActiveTab('ocr'); setIsSidebarOpen(false); }}>
            <span className="nav-icon"></span> Kannada OCR & NER
          </div>
          <div className={`nav-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => { setActiveTab('document'); setIsSidebarOpen(false); }}>
            <span className="nav-icon"></span> Financial Document AI
          </div>
          <div className={`nav-item ${activeTab === 'similarity' ? 'active' : ''}`} onClick={() => { setActiveTab('similarity'); setIsSidebarOpen(false); }}>
            <span className="nav-icon"></span> Modus Operandi Linkage
          </div>
          <div className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => { setActiveTab('graph'); setIsSidebarOpen(false); }}>
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
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰
          </button>
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
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'chat' && <ChatView setActiveTab={setActiveTab} />}
          {activeTab === 'ocr' && <OcrView />}
          {activeTab === 'document' && <DocumentView />}
          {activeTab === 'similarity' && <SimilarityView />}
          {activeTab === 'graph' && <GraphView />}
        </div>
      </main>
    </div>
  );
}

export default App;

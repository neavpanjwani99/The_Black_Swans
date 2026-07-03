import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { OcrView } from './components/OcrView';
import { DocumentView } from './components/DocumentView';
import { SimilarityView } from './components/SimilarityView';
import { GraphView } from './components/GraphView';
import { LoginView } from './components/LoginView';

interface UserSession {
  name: string;
  badgeNumber: string;
  role: string;
  station: string;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('drishti_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Derive activeTab from current URL pathname
  const path = location.pathname.substring(1) || 'dashboard';
  const activeTab = ['dashboard', 'chat', 'ocr', 'document', 'similarity', 'graph'].includes(path) ? path : 'dashboard';

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
    setIsSidebarOpen(false);
  };

  const handleLogin = (userData: UserSession) => {
    localStorage.setItem('drishti_user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('drishti_user');
    setUser(null);
    navigate('/dashboard');
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Overlay */}
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <img src="/Main-logo.png" alt="DRISHTI Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">DRISHTI</h1>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', display: 'none' }}>
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <span className="nav-icon"></span> Dashboard Overview
          </div>
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleTabChange('chat')}>
            <span className="nav-icon"></span> Conversational RAG
          </div>
          <div className={`nav-item ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => handleTabChange('ocr')}>
            <span className="nav-icon"></span> Kannada OCR & NER
          </div>
          <div className={`nav-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => handleTabChange('document')}>
            <span className="nav-icon"></span> Financial Document AI
          </div>
          <div className={`nav-item ${activeTab === 'similarity' ? 'active' : ''}`} onClick={() => handleTabChange('similarity')}>
            <span className="nav-icon"></span> Modus Operandi Linkage
          </div>
          <div className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => handleTabChange('graph')}>
            <span className="nav-icon"></span> Network Connection Graph
          </div>
        </nav>
        <div className="sidebar-footer">
          <p>KSP Crime Analytics Platform</p>
          <p style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>Logged in as {user.badgeNumber}</p>
          <button className="btn-logout" onClick={handleLogout}>Log Out</button>
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
              <div className="officer-avatar">{initials}</div>
              <div>
                <p style={{ fontWeight: 600 }}>{user.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.station}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="content-viewport">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/chat" element={<ChatView setActiveTab={(tab) => handleTabChange(tab)} />} />
            <Route path="/ocr" element={<OcrView />} />
            <Route path="/document" element={<DocumentView />} />
            <Route path="/similarity" element={<SimilarityView />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './assets/css/App.css';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { OcrView } from './components/OcrView';
import { DocumentView } from './components/DocumentView';
import { SimilarityView } from './components/SimilarityView';
import { GraphView } from './components/GraphView';
import { LoginView } from './components/LoginView';
import { DashboardIcon, ChatIcon, OcrIcon, DocumentIcon, SimilarityIcon, GraphIcon, CloseIcon } from './components/Icons';

interface UserSession {
  name: string;
  badgeNumber: string;
  role: string;
  station: string;
}


// rbac model for user permissions  
const rolePermissions: Record<string, string[]> = {
  Investigator: ['dashboard', 'chat', 'ocr', 'document', 'similarity', 'graph'],
  Analyst: ['dashboard', 'ocr', 'document', 'similarity', 'graph'],
  Supervisor: ['dashboard', 'chat', 'similarity', 'graph'],
  Policymaker: ['dashboard']
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    // Clear legacy localStorage data to clean up persistent logins
    localStorage.removeItem('drishti_user');
    const saved = sessionStorage.getItem('drishti_user');
    return saved ? JSON.parse(saved) : null;
  });

  const allowedTabs = user ? (rolePermissions[user.role] || ['dashboard']) : ['dashboard'];

  // Derive activeTab from current URL pathname
  const path = location.pathname.substring(1) || 'dashboard';
  const activeTab = ['dashboard', 'chat', 'ocr', 'document', 'similarity', 'graph'].includes(path) ? path : 'dashboard';

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
    setIsSidebarOpen(false);
  };

  const handleLogin = (userData: UserSession) => {
    sessionStorage.setItem('drishti_user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('drishti_user');
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
          <img src="/dashboard-logo.png" alt="DRISHTI Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">DRISHTI</h1>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {allowedTabs.includes('dashboard') && (
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
              <span className="nav-icon"><DashboardIcon size={16} /></span> Dashboard Overview
            </div>
          )}
          {allowedTabs.includes('chat') && (
            <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleTabChange('chat')}>
              <span className="nav-icon"><ChatIcon size={16} /></span> Conversational RAG
            </div>
          )}
          {allowedTabs.includes('ocr') && (
            <div className={`nav-item ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => handleTabChange('ocr')}>
              <span className="nav-icon"><OcrIcon size={16} /></span> Kannada OCR & NER
            </div>
          )}
          {allowedTabs.includes('document') && (
            <div className={`nav-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => handleTabChange('document')}>
              <span className="nav-icon"><DocumentIcon size={16} /></span> Financial Document AI
            </div>
          )}
          {allowedTabs.includes('similarity') && (
            <div className={`nav-item ${activeTab === 'similarity' ? 'active' : ''}`} onClick={() => handleTabChange('similarity')}>
              <span className="nav-icon"><SimilarityIcon size={16} /></span> Modus Operandi Linkage
            </div>
          )}
          {allowedTabs.includes('graph') && (
            <div className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => handleTabChange('graph')}>
              <span className="nav-icon"><GraphIcon size={16} /></span> Network Connection Graph
            </div>
          )}
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
            <span className="badge badge-blue">{user.role} Session</span>
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
            <Route path="/dashboard" element={<DashboardView user={user} />} />
            <Route path="/chat" element={allowedTabs.includes('chat') ? <ChatView setActiveTab={(tab) => handleTabChange(tab)} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/ocr" element={allowedTabs.includes('ocr') ? <OcrView /> : <Navigate to="/dashboard" replace />} />
            <Route path="/document" element={allowedTabs.includes('document') ? <DocumentView /> : <Navigate to="/dashboard" replace />} />
            <Route path="/similarity" element={allowedTabs.includes('similarity') ? <SimilarityView /> : <Navigate to="/dashboard" replace />} />
            <Route path="/graph" element={allowedTabs.includes('graph') ? <GraphView /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;

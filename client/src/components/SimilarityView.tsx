import { useState } from 'react';
import { api } from '../services/api';
import type { SimilarityMatch } from '../services/api';
import '../assets/css/SimilarityView.css';

export function SimilarityView() {
  const [similarityInput, setSimilarityInput] = useState('FIR-5701  house break-in, Indiranagar');
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [timeWeight, setTimeWeight] = useState(80);
  const [methodWeight, setMethodWeight] = useState(90);

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

  return (
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
  );
}

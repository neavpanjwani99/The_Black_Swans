import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { GraphNode, GraphLink } from '../services/api';

export function GraphView() {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

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

  return (
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
  );
}

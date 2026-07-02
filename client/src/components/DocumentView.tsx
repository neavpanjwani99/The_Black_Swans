import { useState } from 'react';
import { api } from '../services/api';
import type { DocumentResponse } from '../services/api';

export function DocumentView() {
  const [docResult, setDocResult] = useState<DocumentResponse | null>(null);
  const [docLoading, setDocLoading] = useState(false);

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

  return (
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
  );
}

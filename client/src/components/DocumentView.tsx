import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { api } from '../services/api';
import type { DocumentResponse } from '../services/api';
import '../assets/css/DocumentView.css';

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

export function DocumentView() {
  const [docResult, setDocResult] = useState<DocumentResponse | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docStatusMsg, setDocStatusMsg] = useState('');
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocLoading(true);
    setDocResult(null);
    setDocFileName(file.name);
    setDocStatusMsg('Extracting text with Tesseract...');

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        setDocStatusMsg('Rendering PDF pages...');
        const canvases = await renderPdfToCanvas(file);
        const allText: string[] = [];

        for (let i = 0; i < canvases.length; i++) {
          setDocStatusMsg(`OCR on page ${i + 1} of ${canvases.length}...`);
          const result = await Tesseract.recognize(canvases[i], 'eng+kan', {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                const pageProgress = ((i / canvases.length) + (m.progress / canvases.length)) * 100;
                setDocStatusMsg(`Extracting text... ${Math.round(pageProgress)}%`);
              }
            }
          });
          allText.push(result.data.text);
        }
        extractedText = allText.join('\n\n--- Page Break ---\n\n');
      } else {
        setDocStatusMsg('Recognizing text from image...');
        const result = await Tesseract.recognize(file, 'eng+kan', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setDocStatusMsg(`Extracting text... ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        extractedText = result.data.text;
      }
      
      setDocStatusMsg('Analyzing financial data with AI...');
      
      const res = await api.scanDocument(extractedText);
      setDocResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDocLoading(false);
      setDocStatusMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <div 
            className="dropzone" 
            style={{ padding: '30px 10px', cursor: docLoading ? 'not-allowed' : 'pointer', opacity: docLoading ? 0.7 : 1 }} 
            onClick={() => !docLoading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={docLoading}
            />
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📄</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {docFileName ? docFileName : 'Upload Seized Passbook / Cheque (PDF/Image)'}
            </span>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => !docLoading && fileInputRef.current?.click()} 
            disabled={docLoading}
          >
            {docLoading ? <><span className="spinner"></span><span style={{marginLeft: '8px'}}>{docStatusMsg}</span></> : 'Select Image to Process'}
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

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { api } from '../services/api';
import type { OcrResponse, NerResponse, Entity } from '../services/api';

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

export function OcrView() {
  const [ocrText, setOcrText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null);
  const [nerResult, setNerResult] = useState<NerResponse | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusMsg, setOcrStatusMsg] = useState('');
  const [ocrFileName, setOcrFileName] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            logger: (m: any) => {
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
          logger: (m: any) => {
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

  return (
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
  );
}

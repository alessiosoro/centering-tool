import React, { useState } from 'react';

function ResultEvaluator({ image, guides }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setPdfUrl(null);

    const blob = await (await fetch(image)).blob();
    const formData = new FormData();
    formData.append('file', blob, 'card.png');
    formData.append('guides', JSON.stringify(guides));

    try {
      const res = await fetch('/evaluate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      setResult(data);

      const pdfBlob = new Blob([Uint8Array.from(atob(data.pdf_base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);
    } catch (err) {
      console.error("Errore:", err);
    }

    setLoading(false);
  };

  return (
    <div className="result-box">
      <h2>📊 Analisi con FastAPI</h2>
      <button onClick={handleAnalyze} className="analyze-button" disabled={loading}>
        {loading ? "Analisi in corso..." : "🔍 Analizza con FastAPI"}
      </button>

      {result && (
        <div className="results">
          <p><b>Orizzontale:</b> {result.hor_percent}% ({result.left} mm / {result.right} mm)</p>
          <p><b>Verticale:</b> {result.ver_percent}% ({result.top} mm / {result.bottom} mm)</p>
          <p><b>Voti stimati:</b></p>
          <ul>
            <li>PSA: {result.psa}</li>
            <li>BGS: {result.bgs}</li>
            <li>SGC: {result.sgc}</li>
          </ul>
          {pdfUrl && (
            <a href={pdfUrl} download="report_centering.pdf" className="pdf-link">
              📄 Scarica PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultEvaluator;

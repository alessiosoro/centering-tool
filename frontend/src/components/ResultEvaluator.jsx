import React, { useState } from "react";
import "../index.css";

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
    formData.append("file", blob, "card.png");
    formData.append("guides", JSON.stringify(guides));

    try {
      const res = await fetch("/evaluate", {
        method: "POST",
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
    <div className="results-section">
      <h2>📊 Analisi con FastAPI</h2>

      <button onClick={handleAnalyze} className="analyze-button" disabled={loading}>
        {loading ? "Analisi in corso..." : "🔍 Analizza la centratura"}
      </button>

      {result && (
        <>
          <div className="result-box">
            <span><b>Orizzontale:</b> {result.hor_percent}%</span>
            <span>Sinistra: {result.left} mm</span>
            <span>Destra: {result.right} mm</span>
          </div>

          <div className="result-box">
            <span><b>Verticale:</b> {result.ver_percent}%</span>
            <span>Alto: {result.top} mm</span>
            <span>Basso: {result.bottom} mm</span>
          </div>

          <div className="result-box">
            <span className="badge">PSA</span> <strong>{result.psa}</strong>
          </div>
          <div className="result-box">
            <span className="badge">BGS</span> <strong>{result.bgs}</strong>
          </div>
          <div className="result-box">
            <span className="badge">SGC</span> <strong>{result.sgc}</strong>
          </div>

          {pdfUrl && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <a href={pdfUrl} download="report_centering.pdf">
                <button>📄 Scarica il PDF</button>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ResultEvaluator;

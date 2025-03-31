import React from "react";
import "../index.css";

const ResultEvaluator = ({ result }) => {
  return (
    <div>
      <h2>Risultati</h2>

      <div className="result-box">
        <span>Orizzontale: <strong>{result.hor_percent}%</strong></span>
        <span>Sinistra: <strong>{result.left} mm</strong></span>
        <span>Destra: <strong>{result.right} mm</strong></span>
      </div>

      <div className="result-box">
        <span>Verticale: <strong>{result.ver_percent}%</strong></span>
        <span>Alto: <strong>{result.top} mm</strong></span>
        <span>Basso: <strong>{result.bottom} mm</strong></span>
      </div>

      <div className="result-box">
        <span className="badge">Centratura Globale</span>
        <strong>{Math.round((result.hor_percent + result.ver_percent) / 2)}%</strong>
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

      {/* LEGENDA COLORI */}
      <div className="result-box">
        <h3 style={{ marginBottom: "8px" }}>Legenda</h3>
        <ul className="legend-list">
          <li><span className="legend-box topOuter"></span> BORDO SUPERIORE - Interno</li>
          <li><span className="legend-box topInner"></span> BORDO SUPERIORE - Esterno</li>
          <li><span className="legend-box bottomOuter"></span> BORDO INFERIORE - Interno</li>
          <li><span className="legend-box bottomInner"></span> BORDO INFERIORE - Esterno</li>
          <li><span className="legend-box leftOuter"></span> BORDO SINISTRO - Interno</li>
          <li><span className="legend-box leftInner"></span> BORDO SINISTRO - Esterno</li>
          <li><span className="legend-box rightOuter"></span> BORDO DESTRO - Interno</li>
          <li><span className="legend-box rightInner"></span> BORDO DESTRO - Esterno</li>
        </ul>
      </div>

      {result.pdf_base64 && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <a
            href={`data:application/pdf;base64,${result.pdf_base64}`}
            download="centering_report.pdf"
          >
            <button>📄 Scarica PDF</button>
          </a>
        </div>
      )}
    </div>
  );
};

export default ResultEvaluator;

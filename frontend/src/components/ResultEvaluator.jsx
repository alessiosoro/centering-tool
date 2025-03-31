import React from "react";
import "../index.css";

const ResultEvaluator = ({ result }) => {
  const legenda = [
    { color: "#ff69b4", label: "Bordo Superiore Interno" },
    { color: "#ff00ff", label: "Bordo Superiore Esterno" },
    { color: "#ffaa00", label: "Bordo Inferiore Interno" },
    { color: "#ffcc00", label: "Bordo Inferiore Esterno" },
    { color: "#dd2222", label: "Bordo Sinistro Interno" },
    { color: "#ff4444", label: "Bordo Sinistro Esterno" },
    { color: "#00ffff", label: "Bordo Destro Interno" },
    { color: "#00bfff", label: "Bordo Destro Esterno" },
  ];

  return (
    <div>
      <h2>📊 Risultati</h2>

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
        <strong>{result.global_percent}%</strong>
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

      <div className="legend">
        <h3>🎨 Legenda Bordi</h3>
        <ul>
          {legenda.map((item, idx) => (
            <li key={idx}>
              <span
                className="color-box"
                style={{
                  backgroundColor: item.color,
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  marginRight: "8px",
                  borderRadius: "4px",
                }}
              ></span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResultEvaluator;

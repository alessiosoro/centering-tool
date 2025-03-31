import React, { useState } from "react";
import "../index.css";

const ResultEvaluator = ({ result, translations }) => {
  const t = translations;
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const legenda = [
    { color: "#ff69b4", label: t.topInner },
    { color: "#ff00ff", label: t.topOuter },
    { color: "#ffaa00", label: t.bottomInner },
    { color: "#ffcc00", label: t.bottomOuter },
    { color: "#dd2222", label: t.leftInner },
    { color: "#ff4444", label: t.leftOuter },
    { color: "#00ffff", label: t.rightInner },
    { color: "#00bfff", label: t.rightOuter },
  ];

  const generatePdf = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", result.originalFile); // 👈 questo campo deve essere passato dal componente padre!
    formData.append("guides", JSON.stringify(result.guides));
    formData.append("lang", result.lang);

    try {
      const res = await fetch("/evaluate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPdfBase64(data.pdf_base64);
    } catch (error) {
      console.error("Errore generazione PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>📊 {t.resultTitle}</h2>

      <div className="result-box">
        <span>{t.horizontal}: <strong>{result.hor_percent}{t.percent}</strong></span>
        <span>{t.leftInner.split(" ")[1]}: <strong>{result.left} {t.mm}</strong></span>
        <span>{t.rightInner.split(" ")[1]}: <strong>{result.right} {t.mm}</strong></span>
      </div>

      <div className="result-box">
        <span>{t.vertical}: <strong>{result.ver_percent}{t.percent}</strong></span>
        <span>{t.topInner.split(" ")[1]}: <strong>{result.top} {t.mm}</strong></span>
        <span>{t.bottomInner.split(" ")[1]}: <strong>{result.bottom} {t.mm}</strong></span>
      </div>

      <div className="result-box">
        <span className="badge">{t.globalCentering}</span>
        <strong>{result.global_percent}{t.percent}</strong>
      </div>

      <div className="result-box">
        <span className="badge">{t.psa}</span> <strong>{result.psa}</strong>
      </div>

      <div className="result-box">
        <span className="badge">{t.bgs}</span> <strong>{result.bgs}</strong>
      </div>

      <div className="result-box">
        <span className="badge">{t.sgc}</span> <strong>{result.sgc}</strong>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button onClick={generatePdf} disabled={loading}>
          📝 {loading ? "..." : t.generatePdfButton}
        </button>
      </div>

      {pdfBase64 && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <a
            href={`data:application/pdf;base64,${pdfBase64}`}
            download="centering_report.pdf"
          >
            <button>📄 {t.downloadButton}</button>
          </a>
        </div>
      )}

      <div className="legend">
        <h3>🎨 {t.resultTitle}</h3>
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

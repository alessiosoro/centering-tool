import React, { useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import CanvasRenderer from "./components/CanvasRenderer";
import ResultEvaluator from "./components/ResultEvaluator";
import Tabs from "./components/Tabs";
import translations from "./lang";
import "./index.css";

function App() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [guides, setGuides] = useState({
    topOuter: 0.05,
    topInner: 0.10,
    bottomOuter: 0.90,
    bottomInner: 0.95,
    leftOuter: 0.05,
    leftInner: 0.10,
    rightOuter: 0.90,
    rightInner: 0.95,
  });
  const [result, setResult] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [language, setLanguage] = useState("it");
  const t = translations[language];

  const handleGuideChange = (key, value) => {
    setGuides((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = (file, preview) => {
    setImageFile(file);
    setImagePreview(preview);
    setResult(null);
    setPdfBase64(null);
    setTimeout(() => {
      evaluateLive(file, guides, language);
    }, 100);
  };

  const resetApp = () => {
    window.location.reload();
  };

  const evaluateLive = async (
    currentFile = imageFile,
    currentGuides = guides,
    currentLang = language
  ) => {
    if (!currentFile) return;

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("guides", JSON.stringify(currentGuides));
    formData.append("lang", currentLang);

    try {
      const res = await fetch("/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const { pdf_base64, ...rest } = data;
      setResult(rest);
      setPdfBase64(null); // PDF va generato manualmente
    } catch (error) {
      console.error("Errore analisi live:", error);
    }
  };

  const generatePDF = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("guides", JSON.stringify(guides));
    formData.append("lang", language);

    try {
      const res = await fetch("/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.pdf_base64) {
        setPdfBase64(data.pdf_base64);
      }
    } catch (error) {
      console.error("Errore generazione PDF:", error);
    }
  };

  useEffect(() => {
    if (imageFile) {
      evaluateLive(imageFile, guides, language);
    }
  }, [guides]);

  useEffect(() => {
    if (imageFile) {
      evaluateLive(imageFile, guides, language);
    }
  }, [language]);

  const languages = [
    { code: "it", flag: "it" },
    { code: "en", flag: "gb" },
    { code: "fr", flag: "fr" },
    { code: "de", flag: "de" },
    { code: "es", flag: "es" },
    { code: "pt", flag: "pt" },
    { code: "zh", flag: "cn" },
    { code: "ko", flag: "kr" },
    { code: "ja", flag: "jp" },
  ];

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setResult(null);
    setPdfBase64(null);
    if (imageFile) {
      evaluateLive(imageFile, guides, code);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>{t.title}</h1>
        <div className="subtitle">{t.subtitle}</div>
        <div className="language-panel">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`lang-btn ${language === lang.code ? "active" : ""}`}
              title={lang.code.toUpperCase()}
            >
              <img
                src={`https://flagcdn.com/24x18/${lang.flag}.png`}
                alt={lang.code}
                className="flag-icon"
              />
            </button>
          ))}
        </div>
      </div>
      <Tabs translations={t} />
      {!imagePreview && (
        <ImageUploader onImageUpload={handleUpload} translations={t} />
      )}
      {imagePreview && (
        <div className="container">
          <div className="image-section">
            <CanvasRenderer
              image={imagePreview}
              guides={guides}
              onGuideChange={handleGuideChange}
              translations={t}
            />
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button onClick={resetApp}>🔄 {t.resetButton}</button>
              <button onClick={generatePDF}>📄 {t.generatePdfButton}</button>
              {pdfBase64 && (
                <a
                  href={`data:application/pdf;base64,${pdfBase64}`}
                  download="centering_report.pdf"
                >
                  <button>⬇️ {t.downloadButton}</button>
                </a>
              )}
            </div>
          </div>
          {result && (
            <div className="results-section">
              <ResultEvaluator result={result} translations={t} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

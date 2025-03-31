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
  const [language, setLanguage] = useState("it");
  const t = translations[language];

  const handleGuideChange = (key, value) => {
    setGuides((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = (file, preview) => {
    setImageFile(file);
    setImagePreview(preview);
    setResult(null);
  };

  const resetApp = () => {
    window.location.reload();
  };

  const evaluateLive = async () => {
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
      setResult(data);
    } catch (error) {
      console.error("Errore analisi live:", error);
    }
  };

  useEffect(() => {
    if (imageFile) {
      evaluateLive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guides]);

  const languages = [
    { code: "it", flag: "🇮🇹" },
    { code: "en", flag: "🇬🇧" },
    { code: "fr", flag: "🇫🇷" },
    { code: "de", flag: "🇩🇪" },
    { code: "es", flag: "🇪🇸" },
    { code: "pt", flag: "🇵🇹" },
    { code: "zh", flag: "🇨🇳" },
    { code: "ko", flag: "🇰🇷" },
    { code: "ja", flag: "🇯🇵" },
  ];

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setTimeout(() => {
      if (imageFile) evaluateLive();
    }, 50);
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
                src={`https://flagcdn.com/24x18/${lang.code}.png`}
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

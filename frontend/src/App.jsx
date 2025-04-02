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

  // fallback automatico in caso di lingua assente
  const t = translations[language] || translations["en"];

  // debug log
  console.log("🌐 Lingua selezionata:", language);
  console.log("📘 Traduzioni caricate:", t);

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
      setPdfBase64(pdf_base64);
    } catch (err) {
      console.error("❌ Errore nella valutazione:", err);
    }
  };

  // 🔁 Valuta ogni volta che cambiano i cursori
  useEffect(() => {
    if (imageFile) {
      const timeout = setTimeout(() => {
        evaluateLive(imageFile, guides, language);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [guides]);

  return (
    <div className="App">
      <ImageUploader onImageUpload={handleUpload} translations={t} />
      {imagePreview && (
        <CanvasRenderer
          imagePreview={imagePreview}
          guides={guides}
          onGuideChange={handleGuideChange}
        />
      )}
      {result && (
        <ResultEvaluator
          result={result}
          pdfBase64={pdfBase64}
          t={t}
          language={language}
        />
      )}
      <Tabs translations={t} />
      <button className="reset-button" onClick={resetApp}>
        🔁 {t.resetButton}
      </button>
    </div>
  );
}

export default App;

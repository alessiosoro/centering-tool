import React, { useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import CanvasRenderer from "./components/CanvasRenderer";
import ResultEvaluator from "./components/ResultEvaluator";
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

    try {
      const res = await fetch("/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Errore durante l'analisi:", error);
    }
  };

  useEffect(() => {
    if (imageFile) {
      evaluateLive();
    }
  }, [guides]);

  return (
    <div>
      <h1>Centering Tool</h1>
      {!imagePreview && (
        <ImageUploader onImageUpload={handleUpload} />
      )}
      {imagePreview && (
        <div className="container">
          <div className="image-section">
            <CanvasRenderer
              image={imagePreview}
              guides={guides}
              onGuideChange={handleGuideChange}
            />
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button onClick={resetApp}>🔄 Carica nuova immagine</button>
            </div>
          </div>
          {result && (
            <div className="results-section">
              <ResultEvaluator result={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;


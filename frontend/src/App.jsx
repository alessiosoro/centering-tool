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
  const [showInstructions, setShowInstructions] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

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
    } catch (err) {
      console.error("Errore durante l'analisi:", err);
    }
  };

  // 🌀 Debounced live evaluation
  useEffect(() => {
    if (imageFile) {
      if (timeoutId) clearTimeout(timeoutId);
      const newId = setTimeout(() => {
        evaluateLive();
      }, 200);
      setTimeoutId(newId);
    }
  }, [guides]);

  return (
    <div>
      <h1>Centering Tool</h1>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button onClick={() => setShowInstructions((prev) => !prev)}>
          📘 {showInstructions ? "Nascondi Istruzioni" : "Mostra Istruzioni"}
        </button>
      </div>

      {showInstructions && (
        <div className="instructions">
          <h2>📏 Come usare il Centering Tool</h2>
          <ul>
            <li>🖼️ Carica una foto della tua carta Pokémon centrata e ben ritagliata.</li>
            <li>🎯 Trascina i <strong>cursori colorati</strong> per posizionare le linee guida.</li>
            <li>🔍 Le linee definiscono i <strong>bordi interni ed esterni</strong> della carta.</li>
            <li>📊 Il sistema calcola la <strong>centratura orizzontale, verticale e globale</strong>.</li>
            <li>🏆 I punteggi PSA, BGS, SGC vengono mostrati automaticamente.</li>
            <li>📄 Puoi anche scaricare un PDF con l'immagine e i risultati.</li>
          </ul>
        </div>
      )}

      {!imagePreview && <ImageUploader onImageUpload={handleUpload} />}

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

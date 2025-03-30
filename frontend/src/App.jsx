import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import CanvasRenderer from "./components/CanvasRenderer";
import ResultEvaluator from './components/ResultEvaluator';
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

  const handleGuideChange = (key, value) => {
    setGuides((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = (file, preview) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  return (
    <div>
      <h1>Centering Tool</h1>
      {!imagePreview && (
        <ImageUploader onImageUpload={handleUpload} />
      )}
      {imagePreview && (
        <div className="container">
          <div className="image-section">
            <CanvasRenderer image={imagePreview} guides={guides} onGuideChange={handleGuideChange} />
          </div>
          <div className="results-section">
            <ResultEvaluator image={imagePreview} guides={guides} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

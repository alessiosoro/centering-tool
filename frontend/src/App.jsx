import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import CanvasRenderer from './components/CanvasRenderer';
import ResultEvaluator from './components/ResultEvaluator';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [guides, setGuides] = useState(null);

  return (
    <div className="app-container">
      <h1 className="app-title">Centering Tool</h1>
      <ImageUploader onUpload={setUploadedImage} />
      {uploadedImage && (
        <CanvasRenderer image={uploadedImage} onGuidesChange={setGuides} />
      )}
      {uploadedImage && guides && (
        <ResultEvaluator image={uploadedImage} guides={guides} />
      )}
    </div>
  );
}

export default App;

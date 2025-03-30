import React from 'react';

function ImageUploader({ onUpload }) {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="image-uploader">
      <label htmlFor="image-upload" className="upload-label">
        📤 Carica immagine della carta
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="upload-input"
      />
    </div>
  );
}

export default ImageUploader;

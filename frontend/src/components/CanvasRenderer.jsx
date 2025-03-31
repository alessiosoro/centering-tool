import React, { useRef, useEffect, useState } from "react";
import "../index.css";

const guideColors = {
  topOuter: "#ff00ff",
  topInner: "#ff69b4",
  bottomOuter: "#ffaa00",
  bottomInner: "#ffcc00",
  leftOuter: "#ff4444",
  leftInner: "#dd2222",
  rightOuter: "#00ffff",
  rightInner: "#00bfff",
};

const CanvasRenderer = ({ image, guides, onGuideChange, translations }) => {
  const wrapperRef = useRef();
  const imageRef = useRef();
  const [dragging, setDragging] = useState(null);

  const handleMouseDown = (e, key) => {
    e.preventDefault();
    setDragging({ key });
  };

  const handleMouseUp = () => setDragging(null);

  const handleMouseMove = (e) => {
    if (!dragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const key = dragging.key;

    if (key.includes("top") || key.includes("bottom")) {
      const posY = (e.clientY - rect.top) / rect.height;
      onGuideChange(key, Math.max(0, Math.min(1, posY)));
    } else {
      const posX = (e.clientX - rect.left) / rect.width;
      onGuideChange(key, Math.max(0, Math.min(1, posX)));
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dragging]);

  return (
    <div className="canvas-container">
      <div className="image-wrapper" ref={wrapperRef}>
        <img src={image} alt="Card" className="card-image" ref={imageRef} />

        {/* LINEE GUIDA */}
        {Object.entries(guides).map(([key, val]) => {
          const isHorizontal = key.includes("top") || key.includes("bottom");
          const style = isHorizontal
            ? { top: `${val * 100}%`, left: 0, width: "100%", height: "2px" }
            : { left: `${val * 100}%`, top: 0, height: "100%", width: "2px" };

          return (
            <div
              key={key}
              className="guide-line"
              style={{ ...style, backgroundColor: guideColors[key] }}
              title={translations[key]}
            />
          );
        })}

        {/* CURSORI */}
        {Object.entries(guides).map(([key, val]) => {
          const isHorizontal = key.includes("top") || key.includes("bottom");
          const style = isHorizontal
            ? {
                top: `${val * 100}%`,
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
            : {
                left: `${val * 100}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              };

          return (
            <div
              key={`${key}-cursor`}
              className="guide-cursor"
              style={{ ...style, backgroundColor: guideColors[key] }}
              onMouseDown={(e) => handleMouseDown(e, key)}
              title={translations[key]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

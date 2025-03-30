import React, { useRef, useEffect, useState } from "react";
import "../index.css";

const CanvasRenderer = ({ image, guides, onGuideChange }) => {
  const containerRef = useRef();
  const [dragging, setDragging] = useState(null);

  const handleMouseDown = (e, key) => {
    e.preventDefault();
    setDragging({ key });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const isHorizontal = dragging.key.includes("top") || dragging.key.includes("bottom");
    const position = isHorizontal
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width;

    const clamped = Math.max(0, Math.min(1, position));
    onGuideChange(dragging.key, clamped);
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
    <div className="canvas-container" ref={containerRef}>
      <img src={image} alt="Card" className="card-image" />
      {Object.entries(guides).map(([key, val]) => (
        <div
          key={key}
          className={`guide-handle ${key.includes("top") || key.includes("bottom") ? "horizontal" : "vertical"} ${key}`}
          style={
            key.includes("top") || key.includes("bottom")
              ? { top: `${val * 100}%` }
              : { left: `${val * 100}%` }
          }
          onMouseDown={(e) => handleMouseDown(e, key)}
        />
      ))}
    </div>
  );
};

export default CanvasRenderer;

import React, { useRef, useEffect, useState } from "react";
import "../index.css";

const CanvasRenderer = ({ image, guides, onGuideChange }) => {
  const wrapperRef = useRef();
  const imageRef = useRef();
  const [dragging, setDragging] = useState(null);

  const handleMouseDown = (e, key) => {
    e.preventDefault();
    setDragging({ key });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e) => {
    if (!dragging || !wrapperRef.current || !imageRef.current) return;

    const imageRect = imageRef.current.getBoundingClientRect();
    const isHorizontal = dragging.key.includes("top") || dragging.key.includes("bottom");

    const pos = isHorizontal
      ? (e.clientY - imageRect.top) / imageRect.height
      : (e.clientX - imageRect.left) / imageRect.width;

    const clamped = Math.max(0, Math.min(1, pos));
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
    <div className="canvas-container">
      <div className="image-wrapper" ref={wrapperRef}>
        <img src={image} alt="Card" className="card-image" ref={imageRef} />
        {Object.entries(guides).map(([key, val]) => {
          const isHorizontal = key.includes("top") || key.includes("bottom");
          const style = isHorizontal
            ? { top: `${val * 100}%` }
            : { left: `${val * 100}%` };

          return (
            <div
              key={key}
              className={`guide-handle ${isHorizontal ? "horizontal" : "vertical"} ${key}`}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, key)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

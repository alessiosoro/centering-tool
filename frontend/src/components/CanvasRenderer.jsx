import React, { useRef, useEffect, useState } from "react";
import "../index.css";

const cursorOffset = {
  topOuter: -20,
  topInner: 20,
  bottomOuter: -20,
  bottomInner: 20,
  leftOuter: -20,
  leftInner: 20,
  rightOuter: -20,
  rightInner: 20,
};

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
    if (!dragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const isHorizontal = dragging.key.includes("top") || dragging.key.includes("bottom");

    const pos = isHorizontal
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width;

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
            ? {
                top: `${val * 100}%`,
                left: `calc(50% + ${cursorOffset[key]}px)`,
              }
            : {
                left: `${val * 100}%`,
                top: `calc(50% + ${cursorOffset[key]}px)`,
              };

          return (
            <div
              key={key}
              className={`guide-handle ${isHorizontal ? "horizontal" : "vertical"} ${key}`}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, key)}
            >
              <div className="square-cursor" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

import React, { useRef, useEffect, useState } from "react";
import "../index.css";

// Import PNG dei cursori
import up_up from "../assets/up_up.png";
import up_down from "../assets/up_down.png";
import down_up from "../assets/down_up.png";
import down_down from "../assets/down_down.png";
import left_right from "../assets/left_right.png";
import left_left from "../assets/left_left.png";
import right_left from "../assets/right_left.png";
import right_right from "../assets/right_right.png";

// Mappa immagini cursore
const cursorImages = {
  topOuter: up_up,
  topInner: up_down,
  bottomOuter: down_up,
  bottomInner: down_down,
  leftOuter: left_right,
  leftInner: left_left,
  rightOuter: right_left,
  rightInner: right_right,
};

// Offset per sfalsare i cursori tra interno e esterno
const cursorOffset = {
  topOuter: -48,
  topInner: +48,
  bottomOuter: -48,
  bottomInner: +48,
  leftOuter: -48,
  leftInner: +48,
  rightOuter: -48,
  rightInner: +48,
};

const CanvasRenderer = ({ image, guides, onGuideChange }) => {
  const imageRef = useRef();
  const [dragging, setDragging] = useState(null);

  // Inizio drag
  const handleMouseDown = (e, key) => {
    e.preventDefault();
    setDragging({ key });
  };

  // Fine drag
  const handleMouseUp = () => setDragging(null);

  // Drag in corso
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
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div className="canvas-container">
      <div className="image-wrapper">
        <img src={image} alt="Card" className="card-image" ref={imageRef} />

        {Object.entries(guides).map(([key, val]) => {
          const isHorizontal = key.includes("top") || key.includes("bottom");
          const cursor = cursorImages[key];

          const style = isHorizontal
            ? {
                top: `${val * 100}%`,
                left: "50%",
                transform: `translate(-50%, -50%) translateX(${cursorOffset[key]}px)`
              }
            : {
                left: `${val * 100}%`,
                top: "50%",
                transform: `translate(-50%, -50%) translateY(${cursorOffset[key]}px)`
              };

          return (
            <div
              key={key}
              className={`guide-handle ${isHorizontal ? "horizontal" : "vertical"} ${key}`}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, key)}
            >
              <img src={cursor} alt={key} className="cursor-img" draggable={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

// src/components/CanvasRenderer.jsx
import React, { useRef, useEffect, useState } from "react";
import "../index.css";

import up_up from "../assets/up_up.png";
import up_down from "../assets/up_down.png";
import down_up from "../assets/down_up.png";
import down_down from "../assets/down_down.png";
import left_right from "../assets/left_right.png";
import left_left from "../assets/left_left.png";
import right_left from "../assets/right_left.png";
import right_right from "../assets/right_right.png";

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
                left: `0`,
                right: `0`,
              }
            : {
                top: `0`,
                bottom: `0`,
                left: `${val * 100}%`,
              };

          return (
            <div
              key={key}
              className={`guide-handle ${isHorizontal ? "horizontal" : "vertical"} ${key}`}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, key)}
            >
              <img
                src={cursorImages[key]}
                alt={key}
                className="cursor-img"
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

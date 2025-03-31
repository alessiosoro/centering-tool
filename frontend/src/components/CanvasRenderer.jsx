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

  const handleMouseUp = () => setDragging(null);

  const handleMouseMove = (e) => {
    if (!dragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const key = dragging.key;
    const isHorizontal = key.includes("top") || key.includes("bottom");

    let pos;
    if (isHorizontal) {
      pos = (e.clientY - rect.top) / rect.height;
    } else {
      pos = (e.clientX - rect.left) / rect.width;
    }

    const clamped = Math.max(0, Math.min(1, pos));
    onGuideChange(key, clamped);
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
          const lineStyle = {
            position: "absolute",
            [isHorizontal ? "top" : "left"]: `${val * 100}%`,
            width: isHorizontal ? "100%" : "2px",
            height: isHorizontal ? "2px" : "100%",
            backgroundColor: `var(--${key})`,
            zIndex: 5,
          };

          const handleStyle = {
            position: "absolute",
            width: "20px",
            height: "20px",
            backgroundColor: `var(--${key})`,
            borderRadius: "4px",
            border: "2px solid white",
            cursor: "grab",
            zIndex: 10,
            transform: "translate(-50%, -50%)",
            [isHorizontal ? "top" : "left"]: `${val * 100}%`,
            [isHorizontal ? "left" : "top"]: "50%",
          };

          return (
            <React.Fragment key={key}>
              <div className="guide-line" style={lineStyle}></div>
              <div
                className="guide-handle"
                style={handleStyle}
                onMouseDown={(e) => handleMouseDown(e, key)}
              ></div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

import React, { useRef, useEffect, useState } from "react";
import "../index.css";

const CanvasRenderer = ({ image, guides, onGuideChange }) => {
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

    const pos = isHorizontal
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width;

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
      <div className="image-wrapper">
        <img src={image} alt="Card" className="card-image" ref={imageRef} />

        {Object.entries(guides).map(([key, val]) => {
          const isHorizontal = key.includes("top") || key.includes("bottom");

          const guideStyle = {
            position: "absolute",
            backgroundColor: `var(--${key})`,
            [isHorizontal ? "top" : "left"]: `${val * 100}%`,
            width: isHorizontal ? "100%" : "2px",
            height: isHorizontal ? "2px" : "100%",
            zIndex: 5,
          };

          const handleStyle = {
            position: "absolute",
            cursor: "grab",
            width: "20px",
            height: "20px",
            backgroundColor: `var(--${key})`,
            border: "2px solid #fff",
            borderRadius: "4px",
            transform: "translate(-50%, -50%)",
            [isHorizontal ? "left" : "top"]: "50%",
            [isHorizontal ? "top" : "left"]: `${val * 100}%`,
            zIndex: 10,
          };

          return (
            <React.Fragment key={key}>
              <div className={`guide-line ${key}`} style={guideStyle}></div>
              <div
                className={`guide-handle ${isHorizontal ? "horizontal" : "vertical"}`}
                style={handleStyle}
                onMouseDown={(e) => handleMouseDown(e, key)}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasRenderer;

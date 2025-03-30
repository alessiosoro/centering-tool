import React, { useRef, useEffect } from "react";
import "./index.css";

const CanvasRenderer = ({ image, guides, onGuideChange }) => {
  const containerRef = useRef(null);

  const drawLines = (ctx, width, height) => {
    const colorMap = {
      topOuter: "#00ff00",
      topInner: "#00cc00",
      bottomOuter: "#ffcc00",
      bottomInner: "#ffaa00",
      leftOuter: "#ff4444",
      leftInner: "#dd2222",
      rightOuter: "#4488ff",
      rightInner: "#2266ff",
    };

    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;

    Object.entries(guides).forEach(([key, val]) => {
      const pos = key.includes("top") || key.includes("bottom") ? val * height : val * width;
      ctx.beginPath();
      ctx.strokeStyle = colorMap[key] || "#ffffff";

      if (key.includes("top") || key.includes("bottom")) {
        ctx.moveTo(0, pos);
        ctx.lineTo(width, pos);
      } else {
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, height);
      }

      ctx.stroke();
    });

    ctx.setLineDash([]);
  };

  const handleMouseDown = (e, guideKey) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;

    const moveHandler = (moveEvent) => {
      const x = moveEvent.clientX - rect.left;
      const y = moveEvent.clientY - rect.top;

      const val = guideKey.includes("top") || guideKey.includes("bottom") ? y / height : x / width;
      onGuideChange(guideKey, Math.min(Math.max(val, 0), 1));
    };

    const upHandler = () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  };

  return (
    <div ref={containerRef} className="canvas-container">
      {image && (
        <>
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
        </>
      )}
    </div>
  );
};

export default CanvasRenderer;

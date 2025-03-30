import React, { useRef, useEffect, useState } from 'react';

function CanvasRenderer({ image, onGuidesChange }) {
  const canvasRef = useRef(null);
  const [guides, setGuides] = useState({
    topOuter: 0.05,
    bottomOuter: 0.95,
    leftOuter: 0.05,
    rightOuter: 0.95,
    topInner: 0.15,
    bottomInner: 0.85,
    leftInner: 0.15,
    rightInner: 0.85,
  });
  const [draggingGuide, setDraggingGuide] = useState(null);

  const draw = (ctx, img, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    const drawLine = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const drawHandle = (x, y) => {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };

    const lines = {
      topOuter: [0, guides.topOuter * height, width, guides.topOuter * height],
      bottomOuter: [0, guides.bottomOuter * height, width, guides.bottomOuter * height],
      leftOuter: [guides.leftOuter * width, 0, guides.leftOuter * width, height],
      rightOuter: [guides.rightOuter * width, 0, guides.rightOuter * width, height],
      topInner: [0, guides.topInner * height, width, guides.topInner * height],
      bottomInner: [0, guides.bottomInner * height, width, guides.bottomInner * height],
      leftInner: [guides.leftInner * width, 0, guides.leftInner * width, height],
      rightInner: [guides.rightInner * width, 0, guides.rightInner * width, height],
    };

    Object.entries(lines).forEach(([key, [x1, y1, x2, y2]]) => {
      drawLine(x1, y1, x2, y2);
      drawHandle((x1 + x2) / 2, (y1 + y2) / 2);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      draw(ctx, img, img.width, img.height);
    };
    img.src = image;
  }, [image, guides]);

  useEffect(() => {
    if (onGuidesChange) onGuidesChange(guides);
  }, [guides]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const tolerance = 10;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    for (const [key, value] of Object.entries(guides)) {
      const isH = key.includes('top') || key.includes('bottom');
      const linePos = isH ? value * h : value * w;
      const dist = isH ? Math.abs(pos.y - linePos) : Math.abs(pos.x - linePos);
      if (dist < tolerance) {
        setDraggingGuide(key);
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingGuide) return;
    const pos = getMousePos(e);
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const isH = draggingGuide.includes('top') || draggingGuide.includes('bottom');
    const newPos = isH ? pos.y / h : pos.x / w;

    setGuides((prev) => ({
      ...prev,
      [draggingGuide]: Math.max(0, Math.min(1, newPos)),
    }));
  };

  const handleMouseUp = () => setDraggingGuide(null);

  return (
    <canvas
      ref={canvasRef}
      className="centering-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

export default CanvasRenderer;

import React, { useState } from "react";
import "../index.css";

const Tabs = ({ translations }) => {
  const [activeTab, setActiveTab] = useState("istruzioni");
  const t = translations || {};

  return (
    <div className="tabs-container">
      <div className="tab-buttons">
        <button
          className={activeTab === "istruzioni" ? "active" : ""}
          onClick={() => setActiveTab("istruzioni")}
        >
          {t.instructionsTab || "📘 Istruzioni"}
        </button>
        <button
          className={activeTab === "disclaimer" ? "active" : ""}
          onClick={() => setActiveTab("disclaimer")}
        >
          {t.disclaimerTitle || "⚠️ Disclaimer"}
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "istruzioni" && (
          <div className="tab-panel">
            <p>📤 {t.uploadInstruction}</p>
            <p>🎯 {t.dragGuides}</p>
            <p>
              📊 {t.resultTitle} {t.globalCentering?.toLowerCase()} (
              {t.horizontal?.toLowerCase()} / {t.vertical?.toLowerCase()})
            </p>
            <p>📄 {t.downloadButton}</p>
            <p>🔁 {t.resetButton}</p>
          </div>
        )}
        {activeTab === "disclaimer" && (
          <div className="tab-panel">
            {t.disclaimerParagraphs?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;

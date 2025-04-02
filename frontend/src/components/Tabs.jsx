import React, { useState } from "react";

const Tabs = ({ t, language, setLanguage }) => {
  const [tab, setTab] = useState("tool");

  const instructionsLabel = t?.instructionsTab || "📘 Instructions";
  const toolLabel = t?.toolTab || "🛠️ Tool";

  return (
    <div className="tabs">
      <div className="tab-buttons">
        <button onClick={() => setTab("tool")}>{toolLabel}</button>
        <button onClick={() => setTab("instructions")}>{instructionsLabel}</button>
      </div>

      <div className="tab-content">
        {tab === "tool" && (
          <p>{t?.toolContent || "Carica un'immagine e regola le guide per iniziare."}</p>
        )}
        {tab === "instructions" && (
          <div>
            <h2>{instructionsLabel}</h2>
            <ul>
              <li>📤 Carica un'immagine ad alta risoluzione</li>
              <li>🎯 Posiziona i cursori sui bordi della carta</li>
              <li>📊 Visualizza le percentuali e i margini</li>
              <li>📄 Genera e scarica il PDF</li>
            </ul>
          </div>
        )}
      </div>

      <div className="language-switcher">
        🌍
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="it">🇮🇹 Italiano</option>
          <option value="en">🇬🇧 English</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="es">🇪🇸 Español</option>
          <option value="pt">🇵🇹 Português</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="ja">🇯🇵 日本語</option>
          <option value="ko">🇰🇷 한국어</option>
        </select>
      </div>
    </div>
  );
};

export default Tabs;

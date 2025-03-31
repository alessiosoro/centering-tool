import React, { useState } from "react";
import "../index.css";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("istruzioni");

  return (
    <div className="tabs-container">
      <div className="tab-buttons">
        <button
          className={activeTab === "istruzioni" ? "active" : ""}
          onClick={() => setActiveTab("istruzioni")}
        >
          📘 Istruzioni
        </button>
        <button
          className={activeTab === "disclaimer" ? "active" : ""}
          onClick={() => setActiveTab("disclaimer")}
        >
          ⚠️ Disclaimer
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "istruzioni" && (
          <div className="tab-panel">
            <p>📤 Carica l'immagine della tua carta da analizzare.</p>
            <p>🎯 Sposta i cursori colorati per allineare i bordi interni ed esterni.</p>
            <p>📊 I risultati della centratura verranno aggiornati automaticamente mentre muovi i cursori.</p>
            <p>📄 Puoi scaricare un PDF con i risultati e l'immagine annotata.</p>
            <p>🔁 Usa il tasto "Carica nuova immagine" per ripartire da zero.</p>
          </div>
        )}
        {activeTab === "disclaimer" && (
          <div className="tab-panel">
            <p>⚠️ <strong>Attenzione:</strong> questa è un'applicazione amatoriale.</p>
            <p>🎓 È pensata per fornire un'idea preliminare della centratura di una carta.</p>
            <p>❌ I risultati e i voti ipotetici mostrati non sono in alcun modo ufficiali né garantiscono il voto reale da parte delle case di gradazione (PSA, BGS, SGC...)</p>
            <p>🧪 Usala come strumento di pre-analisi, ma considera sempre una valutazione professionale per il grading ufficiale.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;

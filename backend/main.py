from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Dict
from PIL import Image, ImageDraw
import io
import base64
from fpdf import FPDF
import json
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🌍 Traduzioni per i PDF
translations = {
    "it": {
        "title": "RISULTATI CENTERING",
        "horizontal": "Orizzontale",
        "vertical": "Verticale",
        "left": "Sinistra",
        "right": "Destra",
        "top": "Alto",
        "bottom": "Basso",
        "global": "Centratura Globale",
        "psa": "Voto PSA",
        "bgs": "Voto BGS",
        "sgc": "Voto SGC"
    },
    "en": {
        "title": "CENTERING RESULTS",
        "horizontal": "Horizontal",
        "vertical": "Vertical",
        "left": "Left",
        "right": "Right",
        "top": "Top",
        "bottom": "Bottom",
        "global": "Global Centering",
        "psa": "PSA Grade",
        "bgs": "BGS Grade",
        "sgc": "SGC Grade"
    },
    "fr": {
        "title": "RÉSULTATS DU CENTRAGE",
        "horizontal": "Horizontal",
        "vertical": "Vertical",
        "left": "Gauche",
        "right": "Droite",
        "top": "Haut",
        "bottom": "Bas",
        "global": "Centrage Global",
        "psa": "Note PSA",
        "bgs": "Note BGS",
        "sgc": "Note SGC"
    },
    "de": {
        "title": "ZENTRIERUNGSERGEBNISSE",
        "horizontal": "Horizontal",
        "vertical": "Vertikal",
        "left": "Links",
        "right": "Rechts",
        "top": "Oben",
        "bottom": "Unten",
        "global": "Globale Zentrierung",
        "psa": "PSA Bewertung",
        "bgs": "BGS Bewertung",
        "sgc": "SGC Bewertung"
    },
    "es": {
        "title": "RESULTADOS DE CENTRADO",
        "horizontal": "Horizontal",
        "vertical": "Vertical",
        "left": "Izquierda",
        "right": "Derecha",
        "top": "Arriba",
        "bottom": "Abajo",
        "global": "Centrado Global",
        "psa": "Nota PSA",
        "bgs": "Nota BGS",
        "sgc": "Nota SGC"
    },
    "pt": {
        "title": "RESULTADOS DE CENTRALIZAÇÃO",
        "horizontal": "Horizontal",
        "vertical": "Vertical",
        "left": "Esquerda",
        "right": "Direita",
        "top": "Topo",
        "bottom": "Fundo",
        "global": "Centralização Global",
        "psa": "Nota PSA",
        "bgs": "Nota BGS",
        "sgc": "Nota SGC"
    },
    "zh": {
        "title": "居中结果",
        "horizontal": "水平",
        "vertical": "垂直",
        "left": "左边",
        "right": "右边",
        "top": "上边",
        "bottom": "下边",
        "global": "整体居中",
        "psa": "PSA 评分",
        "bgs": "BGS 评分",
        "sgc": "SGC 评分"
    },
    "ko": {
        "title": "중심 결과",
        "horizontal": "수평",
        "vertical": "수직",
        "left": "왼쪽",
        "right": "오른쪽",
        "top": "위",
        "bottom": "아래",
        "global": "전체 중심",
        "psa": "PSA 등급",
        "bgs": "BGS 등급",
        "sgc": "SGC 등급"
    },
    "ja": {
        "title": "センタリング結果",
        "horizontal": "水平",
        "vertical": "垂直",
        "left": "左",
        "right": "右",
        "top": "上",
        "bottom": "下",
        "global": "全体のセンタリング",
        "psa": "PSA評価",
        "bgs": "BGS評価",
        "sgc": "SGC評価"
    },
}

@app.post("/evaluate")
async def evaluate(file: UploadFile, guides: str = Form(...), lang: str = Form("it")):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    w, h = image.size
    g = json.loads(guides)

    # Calcolo dei mm reali
    left = abs((g["leftInner"] - g["leftOuter"]) * w)
    right = abs((g["rightOuter"] - g["rightInner"]) * w)
    top = abs((g["topInner"] - g["topOuter"]) * h)
    bottom = abs((g["bottomOuter"] - g["bottomInner"]) * h)

    totalH = left + right
    totalV = top + bottom

    horPercent = round((left / totalH) * 1000) / 10 if totalH else 0
    verPercent = round((top / totalV) * 1000) / 10 if totalV else 0
    globalPercent = round((horPercent + verPercent) / 2, 1)

    def score(val, tol):
        dev = abs(val - 50)
        if dev <= tol:
            return 10
        elif dev <= tol + 3:
            return 9
        elif dev <= tol + 6:
            return 8
        elif dev <= tol + 10:
            return 7
        else:
            return 6

    psa = score(globalPercent, 5)
    bgs = score(globalPercent, 3)
    sgc = score(globalPercent, 6)

    # Colori linee guida
    colors = {
        "topOuter": "#ff00ff",
        "topInner": "#ff69b4",
        "bottomOuter": "#ffaa00",
        "bottomInner": "#ffcc00",
        "leftOuter": "#ff4444",
        "leftInner": "#dd2222",
        "rightOuter": "#00ffff",
        "rightInner": "#00bfff",
    }

    draw = ImageDraw.Draw(image)
    for key, val in g.items():
        if "top" in key or "bottom" in key:
            y = int(h * val)
            draw.line([(0, y), (w, y)], fill=colors.get(key, "#ffffff"), width=2)
        else:
            x = int(w * val)
            draw.line([(x, 0), (x, h)], fill=colors.get(key, "#ffffff"), width=2)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    # ⬇️ Traduzioni PDF
    tr = translations.get(lang, translations["it"])

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt=tr["title"], ln=True, align="C")
    pdf.set_font("Arial", size=12)
    pdf.ln(10)

    text = (
        f"{tr['horizontal']}: {horPercent}% ({tr['left']}: {left:.2f} mm / {tr['right']}: {right:.2f} mm)\n"
        f"{tr['vertical']}: {verPercent}% ({tr['top']}: {top:.2f} mm / {tr['bottom']}: {bottom:.2f} mm)\n"
        f"{tr['global']}: {globalPercent}%\n\n"
        f"{tr['psa']}: {psa}\n"
        f"{tr['bgs']}: {bgs}\n"
        f"{tr['sgc']}: {sgc}"
    )
    pdf.multi_cell(0, 10, text)
    pdf.image(temp_path, x=30, y=80, w=150)

    pdf_data = pdf.output(dest="S").encode("latin-1")
    pdf_base64 = base64.b64encode(pdf_data).decode()

    return JSONResponse(content={
        "hor_percent": horPercent,
        "ver_percent": verPercent,
        "global_percent": globalPercent,
        "left": round(left, 2),
        "right": round(right, 2),
        "top": round(top, 2),
        "bottom": round(bottom, 2),
        "psa": psa,
        "bgs": bgs,
        "sgc": sgc,
        "pdf_base64": pdf_base64
    })

app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

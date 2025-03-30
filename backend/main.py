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

@app.post("/evaluate")
async def evaluate(file: UploadFile, guides: str = Form(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    w, h = image.size
    g = json.loads(guides)

    # Calcolo distanze in pixel
    left = (g["leftInner"] - g["leftOuter"]) * w
    right = (g["rightOuter"] - g["rightInner"]) * w
    top = (g["topInner"] - g["topOuter"]) * h
    bottom = (g["bottomOuter"] - g["bottomInner"]) * h

    totalH = left + right
    totalV = top + bottom

    # Percentuali realistiche con controllo su zero
    horPercent = round((left / totalH) * 1000) / 10 if totalH > 0 else 0
    verPercent = round((top / totalV) * 1000) / 10 if totalV > 0 else 0

    # ✅ Centratura globale (media degli scostamenti da 50%)
    hor_dev = abs(horPercent - 50)
    ver_dev = abs(verPercent - 50)
    global_centering = round(100 - ((hor_dev + ver_dev) / 2), 1)

    # ✅ Punteggi realistici
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

    psa = score(global_centering, 5)
    bgs = score(global_centering, 3)
    sgc = score(global_centering, 6)

    # Colori delle linee guida
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

    # ✅ Disegno linee guida all'interno dell'immagine
    draw = ImageDraw.Draw(image)
    for key, val in g.items():
        if "top" in key or "bottom" in key:
            y = int(h * val)
            y = max(0, min(h - 1, y))
            draw.line([(0, y), (w, y)], fill=colors.get(key, "#ffffff"), width=2)
        else:
            x = int(w * val)
            x = max(0, min(w - 1, x))
            draw.line([(x, 0), (x, h)], fill=colors.get(key, "#ffffff"), width=2)

    # Salvataggio immagine temporanea
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    # Creo PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="RISULTATI CENTERING", ln=True, align="C")
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    text = f"""Orizzontale: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
Verticale: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)

Centratura Globale: {global_centering}%

PSA: {psa}
BGS: {bgs}
SGC: {sgc}"""
    pdf.multi_cell(0, 10, text)
    pdf.image(temp_path, x=30, y=80, w=150)

    pdf_data = pdf.output(dest="S").encode("latin-1")
    pdf_base64 = base64.b64encode(pdf_data).decode()

    return JSONResponse(content={
        "hor_percent": horPercent,
        "ver_percent": verPercent,
        "left": round(left, 2),
        "right": round(right, 2),
        "top": round(top, 2),
        "bottom": round(bottom, 2),
        "global_centering": global_centering,
        "psa": psa,
        "bgs": bgs,
        "sgc": sgc,
        "pdf_base64": pdf_base64
    })

# Monta frontend
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

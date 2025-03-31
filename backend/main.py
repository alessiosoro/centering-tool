from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Dict
from PIL import Image, ImageDraw
from fpdf import FPDF
import io
import base64
import json
import tempfile
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTE PRINCIPALE
@app.post("/evaluate")
async def evaluate(
    file: UploadFile,
    guides: str = Form(...),
    lang: str = Form("it")
):
    # Carica immagine
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    w, h = image.size
    g = json.loads(guides)

    # Calcolo mm reali
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

    translations = {
        "it": {
            "title": "RISULTATI CENTERING",
            "horizontal": "Orizzontale",
            "vertical": "Verticale",
            "global": "Centratura Globale",
            "left": "Sinistra",
            "right": "Destra",
            "top": "Alto",
            "bottom": "Basso",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "en": {
            "title": "CENTERING RESULTS",
            "horizontal": "Horizontal",
            "vertical": "Vertical",
            "global": "Global Centering",
            "left": "Left",
            "right": "Right",
            "top": "Top",
            "bottom": "Bottom",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "fr": {
            "title": "RÉSULTATS DE CENTRAGE",
            "horizontal": "Horizontal",
            "vertical": "Vertical",
            "global": "Centrage Global",
            "left": "Gauche",
            "right": "Droite",
            "top": "Haut",
            "bottom": "Bas",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        }
    }

    t = translations.get(lang, translations["it"])

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

    print(f"[DEBUG] Immagine salvata in: {temp_path}")
    print("File esiste?", os.path.exists(temp_path))
    print("Dimensione:", os.path.getsize(temp_path) if os.path.exists(temp_path) else "n/a")

    # Genera PDF
    pdf = FPDF()
    pdf.add_page()

    font_path = os.path.join("fonts", "DejaVuSans.ttf")
    font_exists = os.path.exists(font_path)
    print(f"[DEBUG] Font trovato: {font_exists} ({font_path})")

    try:
        if font_exists:
            pdf.add_font("DejaVu", "", font_path, uni=True)
            pdf.set_font("DejaVu", "", 14)
        else:
            pdf.set_font("Arial", "", 14)
    except Exception as e:
        print("[ERRORE FONT]", e)
        pdf.set_font("Arial", "", 14)

    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, txt=t["title"], ln=True, border=1, align="C")
    pdf.ln(10)
    pdf.set_font("DejaVu" if font_exists else "Arial", "", 12)

    text = f"""{t['horizontal']}: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
{t['vertical']}: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)
{t['global']}: {globalPercent}%

{t['psa']}: {psa}
{t['bgs']}: {bgs}
{t['sgc']}: {sgc}"""

    pdf.multi_cell(0, 10, text, border=1)

    if os.path.exists(temp_path):
        pdf.image(temp_path, x=30, y=100, w=150)
        print("[DEBUG] Immagine inserita nel PDF")

    # Export
    pdf_data = pdf.output(dest="S").encode("latin1")
    pdf_base64 = base64.b64encode(pdf_data).decode()

    # Debug PDF locale
    with open("debug_output.pdf", "wb") as f:
        f.write(pdf_data)

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

# Frontend statico
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

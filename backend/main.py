from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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

    # ✅ Calcolo distanze assolute
    left = abs((g["leftInner"] - g["leftOuter"]) * w)
    right = abs((g["rightOuter"] - g["rightInner"]) * w)
    top = abs((g["topInner"] - g["topOuter"]) * h)
    bottom = abs((g["bottomOuter"] - g["bottomInner"]) * h)

    totalH = left + right if (left + right) != 0 else 1
    totalV = top + bottom if (top + bottom) != 0 else 1

    horPercent = round((left / totalH) * 1000) / 10
    verPercent = round((top / totalV) * 1000) / 10
    globalPercent = round(((horPercent + verPercent) / 2) * 10) / 10

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

    psa = score(horPercent, 5)
    bgs = score(horPercent, 3)
    sgc = score(horPercent, 6)

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

    # Immagine temporanea per PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    # 📄 PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="RISULTATI CENTERING", ln=True, align="C")
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    text = f"""Orizzontale: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
Verticale: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)
Centratura Globale: {globalPercent}%

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
        "global_percent": globalPercent,
        "psa": psa,
        "bgs": bgs,
        "sgc": sgc,
        "pdf_base64": pdf_base64
    })

# Frontend
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Dict
from PIL import Image
import io
import base64
from fpdf import FPDF
import json
import os

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

    left = (g["leftInner"] - g["leftOuter"]) * w
    right = (g["rightOuter"] - g["rightInner"]) * w
    top = (g["topInner"] - g["topOuter"]) * h
    bottom = (g["bottomOuter"] - g["bottomInner"]) * h

    totalH = left + right
    totalV = top + bottom

    horPercent = round((left / totalH) * 1000) / 10
    verPercent = round((top / totalV) * 1000) / 10

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

    # ✅ Salva immagine come JPEG reale in cartella sicura
    temp_path = "/tmp/temp_image.jpg"
    image.save(temp_path, format="JPEG")

    # 🧾 Crea PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="RISULTATI CENTERING", ln=True, align="C")
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    text = f"""Orizzontale: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
Verticale: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)

PSA: {psa}
BGS: {bgs}
SGC: {sgc}"""
    pdf.multi_cell(0, 10, text)

    # ✅ Inserisce immagine nel PDF
    pdf.image(temp_path, x=30, y=80, w=150)

    # 📤 Output PDF come base64
    pdf_output = io.BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    pdf_base64 = base64.b64encode(pdf_output.read()).decode()

    return JSONResponse(content={
        "hor_percent": horPercent,
        "ver_percent": verPercent,
        "left": round(left, 2),
        "right": round(right, 2),
        "top": round(top, 2),
        "bottom": round(bottom, 2),
        "psa": psa,
        "bgs": bgs,
        "sgc": sgc,
        "pdf_base64": pdf_base64
    })

# 🖼️ Monta l’interfaccia React buildata
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

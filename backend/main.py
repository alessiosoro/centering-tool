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

@app.post("/evaluate")
async def evaluate(
    file: UploadFile,
    guides: str = Form(...),
    lang: str = Form("it")
):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    w, h = image.size
    g = json.loads(guides)

    # Calcoli
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

    # Traduzioni
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
        "zh": {
            "title": "居中结果",
            "horizontal": "水平",
            "vertical": "垂直",
            "global": "整体居中",
            "left": "左",
            "right": "右",
            "top": "上",
            "bottom": "下",
            "psa": "PSA评分",
            "bgs": "BGS评分",
            "sgc": "SGC评分"
        },
        "ja": {
            "title": "センタリング結果",
            "horizontal": "水平",
            "vertical": "垂直",
            "global": "全体のセンタリング",
            "left": "左",
            "right": "右",
            "top": "上",
            "bottom": "下",
            "psa": "PSA評価",
            "bgs": "BGS評価",
            "sgc": "SGC評価"
        },
        "ko": {
            "title": "중심 정렬 결과",
            "horizontal": "수평",
            "vertical": "수직",
            "global": "전체 중심 정렬",
            "left": "왼쪽",
            "right": "오른쪽",
            "top": "상단",
            "bottom": "하단",
            "psa": "PSA 점수",
            "bgs": "BGS 점수",
            "sgc": "SGC 점수"
        }
    }

    t = translations.get(lang, translations["en"])

    # Disegna linee guida
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

    # Salva immagine temporanea
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    # Font path in base alla lingua
    font_dir = os.path.join(os.path.dirname(__file__), "fonts")
    if lang == "zh":
        font_path = os.path.join(font_dir, "NotoSansSC-Regular.otf")
    elif lang == "ja":
        font_path = os.path.join(font_dir, "NotoSansJP-Regular.otf")
    elif lang == "ko":
        font_path = os.path.join(font_dir, "NotoSansKR-Regular.otf")
    else:
        font_path = os.path.join(font_dir, "Roboto-Regular.ttf")

    # Crea PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.add_font("MainFont", "", font_path, uni=True)
    pdf.set_font("MainFont", "", 14)
    pdf.set_xy(10, 10)
    pdf.cell(190, 10, txt=t["title"], ln=True, align="C")
    pdf.ln(10)

    pdf.set_font("MainFont", "", 12)
    text = f"""{t['horizontal']}: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
{t['vertical']}: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)
{t['global']}: {globalPercent}%

{t['psa']}: {psa}
{t['bgs']}: {bgs}
{t['sgc']}: {sgc}"""

    pdf.set_x(20)
    pdf.multi_cell(0, 10, text)

    # Centra immagine
    img_width = 150
    x_img = (210 - img_width) / 2
    pdf.image(temp_path, x=x_img, y=100, w=img_width)

    # Codifica PDF
    pdf_data = pdf.output(dest="S").encode("latin1")
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

# Static frontend
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")


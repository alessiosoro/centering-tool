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
        },
        "de": {
            "title": "ZENTRIERUNGSERGEBNISSE",
            "horizontal": "Horizontal",
            "vertical": "Vertikal",
            "global": "Globale Zentrierung",
            "left": "Links",
            "right": "Rechts",
            "top": "Oben",
            "bottom": "Unten",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "es": {
            "title": "RESULTADOS DE CENTRADO",
            "horizontal": "Horizontal",
            "vertical": "Vertical",
            "global": "Centrado Global",
            "left": "Izquierda",
            "right": "Derecha",
            "top": "Arriba",
            "bottom": "Abajo",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "pt": {
            "title": "RESULTADOS DE CENTRALIZAÇÃO",
            "horizontal": "Horizontal",
            "vertical": "Vertical",
            "global": "Centralização Global",
            "left": "Esquerda",
            "right": "Direita",
            "top": "Topo",
            "bottom": "Fundo",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "zh": {
            "title": "居中分析结果",
            "horizontal": "水平",
            "vertical": "垂直",
            "global": "整体居中",
            "left": "左侧",
            "right": "右侧",
            "top": "上侧",
            "bottom": "下侧",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        },
        "ko": {
            "title": "중심 정렬 결과",
            "horizontal": "수평",
            "vertical": "수직",
            "global": "전체 중심 정렬",
            "left": "왼쪽",
            "right": "오른쪽",
            "top": "위쪽",
            "bottom": "아래쪽",
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
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
            "psa": "PSA",
            "bgs": "BGS",
            "sgc": "SGC"
        }
    }

    t = translations.get(lang, translations["it"])

    draw = ImageDraw.Draw(image)
    colors = {
        "topOuter": "#ff00ff", "topInner": "#ff69b4",
        "bottomOuter": "#ffaa00", "bottomInner": "#ffcc00",
        "leftOuter": "#ff4444", "leftInner": "#dd2222",
        "rightOuter": "#00ffff", "rightInner": "#00bfff",
    }

    for key, val in g.items():
        pos = int((w if "left" in key or "right" in key else h) * val)
        if "top" in key or "bottom" in key:
            draw.line([(0, pos), (w, pos)], fill=colors[key], width=2)
        else:
            draw.line([(pos, 0), (pos, h)], fill=colors[key], width=2)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    # Font per lingua
    font_dir = os.path.join(os.path.dirname(__file__), "fonts")
    font_map = {
        "zh": ("NotoZH", "NotoSansCJKsc-Regular.otf"),
        "ja": ("NotoJP", "NotoSansCJKjp-Regular.otf"),
        "ko": ("NotoKR", "NotoSansCJKkr-Regular.otf"),
    }

    pdf = FPDF()
    pdf.add_page()

    if lang in font_map:
        font_name, font_file = font_map[lang]
    else:
        font_name, font_file = "Roboto", "Roboto-Regular.ttf"

    font_path = os.path.join(font_dir, font_file)
    pdf.add_font(font_name, "", font_path, uni=True)
    pdf.set_font(font_name, "", 14)

    pdf.cell(200, 10, txt=t["title"], ln=True, align="C")
    pdf.ln(10)
    pdf.set_font(font_name, "", 12)

    text = f"""{t['horizontal']}: {horPercent}% ({left:.2f} mm / {right:.2f} mm)
{t['vertical']}: {verPercent}% ({top:.2f} mm / {bottom:.2f} mm)
{t['global']}: {globalPercent}%

{t['psa']}: {psa}
{t['bgs']}: {bgs}
{t['sgc']}: {sgc}"""

    pdf.multi_cell(0, 10, text)
    x_img = (210 - 150) / 2
    pdf.image(temp_path, x=x_img, y=100, w=150)

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

app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

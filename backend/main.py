from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageDraw
from fpdf import FPDF
import io, base64, json, tempfile, os

app = FastAPI()

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
        if dev <= tol: return 10
        elif dev <= tol + 3: return 9
        elif dev <= tol + 6: return 8
        elif dev <= tol + 10: return 7
        else: return 6

    psa = score(globalPercent, 5)
    bgs = score(globalPercent, 3)
    sgc = score(globalPercent, 6)

    translations = {
        "it": {"title": "RISULTATI CENTERING", "horizontal": "Orizzontale", "vertical": "Verticale", "global": "Centratura Globale", "left": "Sinistra", "right": "Destra", "top": "Alto", "bottom": "Basso", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "en": {"title": "CENTERING RESULTS", "horizontal": "Horizontal", "vertical": "Vertical", "global": "Global Centering", "left": "Left", "right": "Right", "top": "Top", "bottom": "Bottom", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "fr": {"title": "RÉSULTATS DE CENTRAGE", "horizontal": "Horizontal", "vertical": "Vertical", "global": "Centrage Global", "left": "Gauche", "right": "Droite", "top": "Haut", "bottom": "Bas", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "de": {"title": "ZENTRIERUNGSERGEBNISSE", "horizontal": "Horizontal", "vertical": "Vertikal", "global": "Globale Zentrierung", "left": "Links", "right": "Rechts", "top": "Oben", "bottom": "Unten", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "es": {"title": "RESULTADOS DE CENTRADO", "horizontal": "Horizontal", "vertical": "Vertical", "global": "Centrado Global", "left": "Izquierda", "right": "Derecha", "top": "Arriba", "bottom": "Abajo", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "pt": {"title": "RESULTADOS DE CENTRALIZAÇÃO", "horizontal": "Horizontal", "vertical": "Vertical", "global": "Centralização Global", "left": "Esquerda", "right": "Direita", "top": "Superior", "bottom": "Inferior", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "zh": {"title": "居中结果", "horizontal": "水平", "vertical": "垂直", "global": "整体居中", "left": "左", "right": "右", "top": "上", "bottom": "下", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "ko": {"title": "중앙 정렬 결과", "horizontal": "수평", "vertical": "수직", "global": "전체 정렬", "left": "왼쪽", "right": "오른쪽", "top": "위", "bottom": "아래", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
        "ja": {"title": "センタリング結果", "horizontal": "水平", "vertical": "垂直", "global": "全体のセンタリング", "left": "左", "right": "右", "top": "上", "bottom": "下", "psa": "PSA", "bgs": "BGS", "sgc": "SGC"},
    }

    t = translations.get(lang, translations["en"])

    # Disegna linee
    colors = {
        "topOuter": "#ff00ff", "topInner": "#ff69b4",
        "bottomOuter": "#ffaa00", "bottomInner": "#ffcc00",
        "leftOuter": "#ff4444", "leftInner": "#dd2222",
        "rightOuter": "#00ffff", "rightInner": "#00bfff",
    }

    draw = ImageDraw.Draw(image)
    for key, val in g.items():
        coord = int((w if "left" in key or "right" in key else h) * val)
        if "top" in key or "bottom" in key:
            draw.line([(0, coord), (w, coord)], fill=colors[key], width=2)
        else:
            draw.line([(coord, 0), (coord, h)], fill=colors[key], width=2)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_path = tmp.name
        image.save(temp_path, format="JPEG")

    pdf = FPDF()
    pdf.add_page()

    fonts_dir = os.path.join(os.path.dirname(__file__), "fonts")
    font_western = os.path.join(fonts_dir, "Roboto-Regular.ttf")
    font_chinese = os.path.join(fonts_dir, "NotoSansSC-Regular.ttf")
    font_japanese = os.path.join(fonts_dir, "NotoSansJP-Regular.ttf")
    font_korean = os.path.join(fonts_dir, "NotoSansKR-Regular.ttf")

    if lang == "zh":
        font_file = font_chinese
    elif lang == "ja":
        font_file = font_japanese
    elif lang == "ko":
        font_file = font_korean
    else:
        font_file = font_western

    font_name = "CustomFont"
    pdf.add_font(font_name, "", font_file, uni=True)
    pdf.set_font(font_name, "", 14)

    pdf.cell(0, 10, txt=t["title"], ln=True, align="C")
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

    pdf_data = pdf.output(dest="S").encode("latin1" if lang not in ["zh", "ja", "ko"] else "utf-8")
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

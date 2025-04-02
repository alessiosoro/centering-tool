from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fpdf import FPDF
from PIL import Image, ImageDraw
from datetime import datetime
import pytz
import tempfile
import os
import io
import json
import base64
import traceback

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

    # Salva immagine temporanea con le guide
    draw = ImageDraw.Draw(image)
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
    for key, val in g.items():
        if "top" in key or "bottom" in key:
            y = int(h * val)
            draw.line([(0, y), (w, y)], fill=colors.get(key, "#ffffff"), width=2)
        else:
            x = int(w * val)
            draw.line([(x, 0), (x, h)], fill=colors.get(key, "#ffffff"), width=2)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        temp_img_path = tmp.name
        image.save(temp_img_path, format="JPEG")

    # Traduzioni e font
    translations = {
        "it": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "RAPPORTO DI CENTERING",
            "site": "www.alexpuntoesse.com",
            "title": "DETTAGLI DI CENTERING",
            "disclaimer": "Questa è un'applicazione amatoriale. Serve a fornire un'idea preliminare del centraggio di una carta. I risultati e i voti ipotetici non sono ufficiali e non garantiscono la valutazione reale.",
            "table": [
                ("Margine Sinistro", f"{left:.2f} mm"),
                ("Margine Destro", f"{right:.2f} mm"),
                ("Margine Superiore", f"{top:.2f} mm"),
                ("Margine Inferiore", f"{bottom:.2f} mm"),
                ("Centratura Orizzontale", f"{horPercent}%"),
                ("Centratura Verticale", f"{verPercent}%"),
                ("Centratura Globale", f"{globalPercent}%"),
            ]
        },
        "en": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "CENTERING REPORT",
            "site": "www.alexpuntoesse.com",
            "title": "CENTERING DETAILS",
            "disclaimer": "This is an amateur application to give a rough idea of card centering. The results and grades are not official and do not guarantee real grading.",
            "table": [
                ("Left Margin", f"{left:.2f} mm"),
                ("Right Margin", f"{right:.2f} mm"),
                ("Top Margin", f"{top:.2f} mm"),
                ("Bottom Margin", f"{bottom:.2f} mm"),
                ("Horizontal Centering", f"{horPercent}%"),
                ("Vertical Centering", f"{verPercent}%"),
                ("Global Centering", f"{globalPercent}%"),
            ]
        },
        "fr": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "RAPPORT DE CENTRAGE",
            "site": "www.alexpuntoesse.com",
            "title": "DÉTAILS DU CENTRAGE",
            "disclaimer": "Il s'agit d'une application amateur pour donner une idée préliminaire du centrage de la carte. Les résultats et les notes ne sont pas officiels.",
            "table": [
                ("Marge gauche", f"{left:.2f} mm"),
                ("Marge droite", f"{right:.2f} mm"),
                ("Marge supérieure", f"{top:.2f} mm"),
                ("Marge inférieure", f"{bottom:.2f} mm"),
                ("Centrage horizontal", f"{horPercent}%"),
                ("Centrage vertical", f"{verPercent}%"),
                ("Centrage global", f"{globalPercent}%"),
            ]
        },
        "de": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "ZENTRIERUNGSBERICHT",
            "site": "www.alexpuntoesse.com",
            "title": "ZENTRIERUNGSDATEN",
            "disclaimer": "Dies ist eine Amateuranwendung, um einen ersten Eindruck von der Karten-Zentrierung zu vermitteln. Die Ergebnisse sind nicht offiziell.",
            "table": [
                ("Linker Rand", f"{left:.2f} mm"),
                ("Rechter Rand", f"{right:.2f} mm"),
                ("Oberer Rand", f"{top:.2f} mm"),
                ("Unterer Rand", f"{bottom:.2f} mm"),
                ("Horizontale Zentrierung", f"{horPercent}%"),
                ("Vertikale Zentrierung", f"{verPercent}%"),
                ("Gesamtzentrierung", f"{globalPercent}%"),
            ]
        },
        "es": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "INFORME DE CENTRADO",
            "site": "www.alexpuntoesse.com",
            "title": "DETALLES DE CENTRADO",
            "disclaimer": "Esta es una aplicación amateur para dar una idea preliminar del centrado de la carta. Los resultados y puntuaciones no son oficiales.",
            "table": [
                ("Margen izquierdo", f"{left:.2f} mm"),
                ("Margen derecho", f"{right:.2f} mm"),
                ("Margen superior", f"{top:.2f} mm"),
                ("Margen inferior", f"{bottom:.2f} mm"),
                ("Centrado horizontal", f"{horPercent}%"),
                ("Centrado vertical", f"{verPercent}%"),
                ("Centrado global", f"{globalPercent}%"),
            ]
        },
        "pt": {
            "font": "fonts/Roboto-Regular.ttf",
            "report": "RELATÓRIO DE CENTRALIZAÇÃO",
            "site": "www.alexpuntoesse.com",
            "title": "DETALHES DE CENTRALIZAÇÃO",
            "disclaimer": "Este é um aplicativo amador para dar uma ideia do centramento do cartão. Os resultados e pontuações não são oficiais.",
            "table": [
                ("Margem esquerda", f"{left:.2f} mm"),
                ("Margem direita", f"{right:.2f} mm"),
                ("Margem superior", f"{top:.2f} mm"),
                ("Margem inferior", f"{bottom:.2f} mm"),
                ("Centralização horizontal", f"{horPercent}%"),
                ("Centralização vertical", f"{verPercent}%"),
                ("Centralização global", f"{globalPercent}%"),
            ]
        },
        "zh": {
            "font": "fonts/NotoSansSC-Regular.ttf",
            "report": "报告",
            "site": "www.alexpuntoesse.com",
            "title": "居中详情",
            "disclaimer": "这是一个业余应用程序，旨在提供卡片居中的初步概念。结果和评分并非官方。",
            "table": [
                ("左边距", f"{left:.2f} mm"),
                ("右边距", f"{right:.2f} mm"),
                ("上边距", f"{top:.2f} mm"),
                ("下边距", f"{bottom:.2f} mm"),
                ("水平居中", f"{horPercent}%"),
                ("垂直居中", f"{verPercent}%"),
                ("整体居中", f"{globalPercent}%"),
            ]
        },
        "ko": {
            "font": "fonts/NotoSansKR-Regular.ttf",
            "report": "보고서",
            "site": "www.alexpuntoesse.com",
            "title": "센터링 세부 정보",
            "disclaimer": "이것은 카드 센터링에 대한 아이디어를 제공하기 위한 아마추어 앱입니다. 결과와 등급은 공식적인 것이 아닙니다.",
            "table": [
                ("왼쪽 여백", f"{left:.2f} mm"),
                ("오른쪽 여백", f"{right:.2f} mm"),
                ("상단 여백", f"{top:.2f} mm"),
                ("하단 여백", f"{bottom:.2f} mm"),
                ("수평 센터링", f"{horPercent}%"),
                ("수직 센터링", f"{verPercent}%"),
                ("전체 센터링", f"{globalPercent}%"),
            ]
        },
        "ja": {
            "font": "fonts/NotoSansJP-Regular.ttf",
            "report": "センタリングレポート",
            "site": "www.alexpuntoesse.com",
            "title": "センタリング詳細",
            "disclaimer": "これはカードのセンタリングを示すアマチュアアプリです。結果とスコアは公式なものではありません。",
            "table": [
                ("左マージン", f"{left:.2f} mm"),
                ("右マージン", f"{right:.2f} mm"),
                ("上マージン", f"{top:.2f} mm"),
                ("下マージン", f"{bottom:.2f} mm"),
                ("水平センタリング", f"{horPercent}%"),
                ("垂直センタリング", f"{verPercent}%"),
                ("全体のセンタリング", f"{globalPercent}%"),
            ]
        }
    }

    t = translations.get(lang, translations["en"])
    font_path = t["font"]

    # Immagini
    assets_path = "assets"
    logo_path = os.path.join(assets_path, "logo.png")
    trainer_path = os.path.join(assets_path, "trainer.png")
    stamp_path = os.path.join(assets_path, "stamp.png")
    psa_path = os.path.join(assets_path, f"PSA_{psa}.png")
    bgs_path = os.path.join(assets_path, f"BGS_{bgs}.png")
    sgc_path = os.path.join(assets_path, f"SGC_{sgc}.png")

    # Crea PDF
    pdf = FPDF("P", "mm", "A4")
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.set_fill_color(0, 0, 0)
    pdf.rect(0, 0, 210, 297, "F")

    try:
        pdf.add_font("LANG", "", font_path, uni=True)
        pdf.set_text_color(255, 255, 255)

        pdf.set_font("LANG", "", 28)
        pdf.set_xy(10, 10)
        pdf.cell(100, 10, t["report"], ln=0)

        pdf.set_font("LANG", "", 14)
        pdf.set_xy(10, 22)
        italy_time = datetime.now(pytz.timezone("Europe/Rome")).strftime("%Y.%m.%d - %H:%M")
        pdf.cell(100, 10, italy_time, ln=0)

        pdf.set_font("LANG", "", 20)
        pdf.set_xy(110, 10)
        pdf.cell(90, 10, t["site"], align="R")

        pdf.image(logo_path, x=10, y=40, w=80)
        pdf.image(trainer_path, x=135, y=26, w=60)

        pdf.set_font("LANG", "", 18)
        pdf.set_xy(10, 60)
        pdf.cell(190, 10, t["title"], ln=1)

        pdf.set_font("LANG", "", 11)
        pdf.set_text_color(98, 119, 172)
        pdf.set_xy(10, 70)
        pdf.multi_cell(120, 6, t["disclaimer"])

        pdf.set_text_color(255, 255, 255)
        start_y = 105
        row_height = 10
        for i, row in enumerate(t["table"]):
            bg_color = 35 if i % 2 == 0 else 0
            pdf.set_fill_color(bg_color, bg_color, bg_color)
            pdf.set_xy(10, start_y + i * row_height)
            pdf.cell(100, row_height, row[0], fill=True)
            pdf.cell(90, row_height, row[1], align="R", fill=True)

        pdf.image(psa_path, x=10, y=180, w=55)
        pdf.image(bgs_path, x=77, y=180, w=55)
        pdf.image(sgc_path, x=144, y=180, w=55)
        pdf.image(stamp_path, x=160, y=268, w=30)

    except Exception as e:
        return JSONResponse(content={"error": traceback.format_exc()}, status_code=500)

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

# Serve frontend React
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

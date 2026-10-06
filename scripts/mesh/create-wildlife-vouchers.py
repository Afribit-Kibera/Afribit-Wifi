"""Build sample-only photographic Mesh voucher artwork. No issuance or API calls."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, CMYKColorSep
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fontTools.ttLib import TTFont as Font
from fontTools.varLib.instancer import instantiateVariableFont
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/mesh-voucher-design/wildlife'
OUT.mkdir(parents=True, exist_ok=True)
FONT = ROOT / 'artifacts/mesh-catalogue-design/geist-latin.woff2'
for weight in (400, 550, 750):
    f = Font(FONT)
    f.flavor = None
    f = instantiateVariableFont(f, {'wght': weight}, inplace=True)
    # Give each static instance a distinct PostScript name for PDF embedding.
    for rec in f['name'].names:
        if rec.nameID in (1, 4, 6):
            rec.string = f'GeistWildlife{weight}'.encode(rec.getEncoding())
    target = OUT / f'geist-{weight}.ttf'
    f.save(target)
    pdfmetrics.registerFont(TTFont(f'G{weight}', str(target)))

PAPER = HexColor('#fffaf2')
INK = HexColor('#203c32')
ORANGE = HexColor('#f7931a')
WHITE = HexColor('#ffffff')
PLANS = [('daily', 'Daily', '30', '24 hours', 'cheetah'),
         ('weekly', 'Weekly', '140', '7 days', 'lioness'),
         ('monthly', 'Monthly', '450', '1 month', 'tiger')]

def text(c, x, y, s, size=8, weight=400, color=INK):
    c.setFillColor(color)
    c.setFont(f'G{weight}', size)
    c.drawString(x*mm, y*mm, s)

def mark(c, x, y, size=7, color=WHITE):
    c.saveState()
    c.translate(x*mm, (y+size)*mm)
    c.scale(size*mm/36, -size*mm/36)
    c.setStrokeColor(color)
    c.setLineWidth(2.8)
    c.setLineCap(1)
    p = c.beginPath()
    # Preserves the existing continuous woven Mesh geometry.
    p.moveTo(4, 26); p.lineTo(4, 12)
    p.curveTo(4, 4, 16, 4, 16, 12); p.lineTo(16, 24)
    p.curveTo(16, 32, 28, 32, 28, 24); p.lineTo(28, 10)
    p.moveTo(10, 26); p.lineTo(10, 12)
    p.curveTo(10, 4, 22, 4, 22, 12); p.lineTo(22, 24)
    p.curveTo(22, 32, 34, 32, 34, 24); p.lineTo(34, 10)
    c.drawPath(p)
    c.restoreState()

def trim(c):
    c.setTrimBox((3*mm, 3*mm, 53*mm, 43*mm))
    c.setBleedBox((0, 0, 56*mm, 46*mm))

def front(c, plan, set_trim=True):
    key, label, amount, duration, animal = plan
    if set_trim:
        trim(c)
    c.drawImage(str(OUT / f'{animal}-backdrop.png'), 0, 0, width=56*mm, height=46*mm,
                preserveAspectRatio=False)
    c.setFillColor(INK)
    c.setFillAlpha(.25)
    c.rect(0, 0, 56*mm, 46*mm, fill=1, stroke=0)
    c.setFillAlpha(1)
    c.setFillColor(ORANGE)
    c.rect(0, 0, 56*mm, 13*mm, fill=1, stroke=0)
    mark(c, 6, 30.7, 6.5)
    text(c, 13.5, 31.8, 'Mesh', 19, 750, WHITE)
    text(c, 6, 25, label.upper(), 9.5, 750, WHITE)
    text(c, 6, 20.5, 'INTERNET PASS', 6.5, 550, WHITE)
    text(c, 6, 7, f'KES {amount}', 16, 750, INK)
    # Duration aligned independently from price to avoid crowded three-digit amounts.
    c.setFillColor(INK); c.setFont('G550', 7.5)
    c.drawRightString(50*mm, 8.6*mm, duration)
    c.setFont('G400', 5.5)
    c.drawRightString(50*mm, 5.2*mm, 'SAMPLE / NOT VALID')

def back(c, plan, coated=False, set_trim=True):
    if set_trim:
        trim(c)
    c.setFillColor(PAPER); c.rect(0, 0, 56*mm, 46*mm, fill=1, stroke=0)
    c.setFillColor(ORANGE); c.rect(0, 42*mm, 56*mm, 4*mm, fill=1, stroke=0)
    text(c, 6, 36, 'Scratch. Connect.', 11.2, 750)
    text(c, 6, 31.2, '1  Join the Mesh Wi-Fi.', 7.3)
    text(c, 6, 27.3, '2  Scratch to reveal your code.', 7.3)
    text(c, 6, 23.4, '3  Tap Voucher. Enter the code.', 7.3)
    # Trim-relative x9/y10.5: consistent with the original scratch plate.
    if coated:
        c.setFillColor(HexColor('#b8bfc0'))
        c.roundRect(12*mm, 13.5*mm, 32*mm, 8*mm, 1*mm, fill=1, stroke=0)
        c.setStrokeColor(HexColor('#dbe0e0')); c.setLineWidth(.2)
        for i in range(19):
            y = (14+i*.37)*mm
            c.line(13*mm, y, 43*mm, y)
        c.setFillColor(INK); c.setFont('G750', 8.2)
        c.drawCentredString(28*mm, 16.4*mm, 'SCRATCH HERE')
    else:
        c.setStrokeColor(HexColor('#d3c7b5')); c.setDash(1, 2)
        c.rect(12*mm, 13.5*mm, 32*mm, 8*mm, fill=0, stroke=1)
        c.setDash()
        c.setFont('G750', 16); c.setFillColor(INK)
        c.drawCentredString(28*mm, 16*mm, '1 2 3 4 5 6')
    text(c, 6, 10.4, 'One device. Keep your code private.', 6.8, 550)
    text(c, 6, 6.6, 'SAMPLE / NOT VALID', 5.7, 550)
    text(c, 36, 6.6, 'DEMO-00001', 5.3)

def render(path, dpi=600):
    doc = pymupdf.open(path)
    for i, page in enumerate(doc):
        page.get_pixmap(dpi=dpi).save(OUT / f'{path.stem}-{i+1}.png')

for plan in PLANS:
    p = OUT / f'{plan[0]}-voucher-master.pdf'
    c = canvas.Canvas(str(p), pagesize=(56*mm,46*mm))
    c.setTitle(f'Mesh {plan[1]} voucher specimen: front and underprint')
    front(c, plan); c.showPage(); back(c, plan); c.showPage(); c.save(); render(p)

c = canvas.Canvas(str(OUT / 'scratch-finish-guide.pdf'), pagesize=(56*mm,46*mm))
trim(c)
c.setFillColor(CMYKColorSep(0, 0, 0, 100, spotName='SCRATCH_PANEL'))
c.rect(12*mm, 13.5*mm, 32*mm, 8*mm, fill=1, stroke=0)
c.save()

c = canvas.Canvas(str(OUT / 'coated-reverse-proofs.pdf'), pagesize=(56*mm,46*mm))
for plan in PLANS:
    back(c, plan, True); c.showPage()
c.save(); render(OUT / 'coated-reverse-proofs.pdf')

c = canvas.Canvas(str(OUT / 'wildlife-vouchers-preview.pdf'), pagesize=(297*mm,210*mm))
text(c, 14, 190, 'Mesh. Three moments.', 26, 750)
text(c, 14, 178, 'Daily / Weekly / Monthly - photo-inspired scratch vouchers', 10)
for index, plan in enumerate(PLANS):
    x = 14+index*91
    text(c, x, 160, f'{plan[1]} / KES {plan[2]}', 12, 750)
    c.saveState(); c.translate(x*mm, 89*mm); c.scale(1.4, 1.4); front(c, plan, False); c.restoreState()
    text(c, x, 84, 'Front', 7.5)
    c.saveState(); c.translate(x*mm, 16*mm); c.scale(1.4, 1.4); back(c, plan, True, False); c.restoreState()
    text(c, x, 11, 'Reverse / silver scratch coating simulated', 7)
c.save(); render(OUT / 'wildlife-vouchers-preview.pdf', 180)

checks = []
for plan in PLANS:
    d = pymupdf.open(OUT / f'{plan[0]}-voucher-master.pdf')
    assert len(d) == 2
    for page in d:
        assert abs(page.rect.width/mm - 56) < .1
        assert abs(page.rect.height/mm - 46) < .1
        assert abs(page.trimbox.width/mm - 50) < .1
        assert abs(page.trimbox.height/mm - 40) < .1
    assert '123456' in ''.join(d[1].get_text().split())
    checks.append({'plan': plan[0], 'priceKes':int(plan[2]), 'pages':2, 'mediaMm':[56,46], 'trimMm':[50,40]})
(OUT / 'verification.json').write_text(json.dumps({'sampleOnly':True,'masters':checks}, indent=2))
print(json.dumps({'output':str(OUT), 'pdfCount':6, 'sampleOnly':True}))

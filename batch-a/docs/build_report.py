#!/usr/bin/env python3
"""Build the consolidated Batch A report PDF from the project's docs + sources.

Pure-Python (reportlab); needs only the DejaVu TTFs for full Unicode coverage
(ε, σ, →, ≤, ×, Σ, …). Renders a markdown subset: headings, paragraphs with
**bold**/*italic*/`code`, bullet & ordered lists, GitHub pipe tables, fenced
code blocks, blockquotes, and rules. Assembles authored front/connective matter
with the existing docs and live code excerpts, then typesets a title page,
auto-numbered table of contents, and page numbers.

    python docs/build_report.py            # -> docs/Batch_A_Full_Report.pdf
"""

from __future__ import annotations

import html
import re
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Preformatted, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = DOCS / "Batch_A_Full_Report.pdf"

# --------------------------------------------------------------------------
# Fonts
# --------------------------------------------------------------------------
FDIR = "/usr/share/fonts/truetype/dejavu"
LDIR = "/usr/share/fonts/truetype/liberation"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FDIR}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", f"{FDIR}/DejaVuSans-Bold.ttf"))
# DejaVu Sans has no oblique on this system; Liberation supplies true italics
# (full Latin coverage — italic spans here are emphasis on Latin words).
pdfmetrics.registerFont(TTFont("DejaVu-Oblique", f"{LDIR}/LiberationSans-Italic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-BoldOblique",
                               f"{LDIR}/LiberationSans-BoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("Mono", f"{FDIR}/DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", f"{FDIR}/DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFontFamily(
    "DejaVu", normal="DejaVu", bold="DejaVu-Bold",
    italic="DejaVu-Oblique", boldItalic="DejaVu-BoldOblique")

INK = colors.HexColor("#1a1a1a")
ACCENT = colors.HexColor("#1f4e5f")
ACCENT2 = colors.HexColor("#2c6e7f")
MUTED = colors.HexColor("#555555")
RULE = colors.HexColor("#b9c7cc")
CODEBG = colors.HexColor("#f4f6f7")
HEADBG = colors.HexColor("#1f4e5f")
ROWBG = colors.HexColor("#eef3f4")

# --------------------------------------------------------------------------
# Styles
# --------------------------------------------------------------------------
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="DejaVu", fontSize=10, leading=14, textColor=INK,
                spaceBefore=0, spaceAfter=6, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "body": style("body", spaceAfter=7, leading=14.5),
    "h1": style("H1", fontName="DejaVu-Bold", fontSize=19, leading=23,
                textColor=ACCENT, spaceBefore=4, spaceAfter=12),
    "h2": style("H2", fontName="DejaVu-Bold", fontSize=14, leading=18,
                textColor=ACCENT2, spaceBefore=14, spaceAfter=6),
    "h3": style("H3", fontName="DejaVu-Bold", fontSize=11.5, leading=15,
                textColor=INK, spaceBefore=10, spaceAfter=4),
    "h4": style("H4", fontName="DejaVu-BoldOblique", fontSize=10.5, leading=14,
                textColor=MUTED, spaceBefore=8, spaceAfter=3),
    "li": style("li", spaceAfter=3, leading=14, leftIndent=14, bulletIndent=4),
    "li2": style("li2", spaceAfter=2, leading=13.5, leftIndent=30, bulletIndent=18,
                 fontSize=9.5),
    "quote": style("quote", leftIndent=12, textColor=MUTED,
                   fontName="DejaVu-Oblique", borderColor=RULE, spaceAfter=7),
    "code": style("code", fontName="Mono", fontSize=7.6, leading=9.8,
                  textColor=colors.HexColor("#10303a"), backColor=CODEBG,
                  borderColor=RULE, borderWidth=0.5, borderPadding=6,
                  spaceBefore=2, spaceAfter=6),
    "cell": style("cell", fontSize=8.2, leading=10.5, spaceAfter=0),
    "cellh": style("cellh", fontSize=8.4, leading=10.8, spaceAfter=0,
                   fontName="DejaVu-Bold", textColor=colors.white),
    "title": style("title", fontName="DejaVu-Bold", fontSize=30, leading=36,
                   textColor=ACCENT, alignment=TA_CENTER, spaceAfter=10),
    "subtitle": style("subtitle", fontSize=14, leading=20, textColor=ACCENT2,
                      alignment=TA_CENTER, spaceAfter=6),
    "tmeta": style("tmeta", fontSize=10.5, leading=16, textColor=MUTED,
                   alignment=TA_CENTER),
    "toctitle": style("toctitle", fontName="DejaVu-Bold", fontSize=16,
                      textColor=ACCENT, spaceAfter=10),
}

TOC_STYLES = [
    ParagraphStyle("toc0", fontName="DejaVu-Bold", fontSize=11, leading=18,
                   textColor=ACCENT, spaceBefore=6),
    ParagraphStyle("toc1", fontName="DejaVu", fontSize=9.5, leading=14,
                   leftIndent=16, textColor=INK),
    ParagraphStyle("toc2", fontName="DejaVu", fontSize=9, leading=13,
                   leftIndent=32, textColor=MUTED),
]


# --------------------------------------------------------------------------
# Inline markdown -> reportlab markup
# --------------------------------------------------------------------------
_CODE = re.compile(r"`([^`]+)`")
_BOLD = re.compile(r"\*\*([^*]+)\*\*")
_ITAL = re.compile(r"(?<![\*\w])\*([^*\n]+)\*(?![\*\w])")
_LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    # protect code spans first
    spans = []

    def _stash(m):
        spans.append(m.group(1))
        return f"\x00{len(spans)-1}\x00"

    text = _CODE.sub(_stash, text)
    text = _LINK.sub(r'<font color="#1f6f8b">\1</font>', text)
    text = _BOLD.sub(r"<b>\1</b>", text)
    text = _ITAL.sub(r"<i>\1</i>", text)

    def _unstash(m):
        code = spans[int(m.group(1))]
        return (f'<font face="Mono" size="8" color="#10303a"> {code} </font>')

    text = re.sub(r"\x00(\d+)\x00", _unstash, text)
    return text


# --------------------------------------------------------------------------
# Block parser
# --------------------------------------------------------------------------
def parse_blocks(md: str):
    lines = md.split("\n")
    blocks = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        # fenced code
        if stripped.startswith("```"):
            lang = stripped[3:].strip()
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1  # closing fence
            blocks.append(("code", lang, buf))
            continue

        # blank
        if not stripped:
            i += 1
            continue

        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            blocks.append(("h", len(m.group(1)), m.group(2).strip()))
            i += 1
            continue

        # horizontal rule
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            blocks.append(("hr",))
            i += 1
            continue

        # table: a pipe line followed by a separator line
        if "|" in line and i + 1 < n and re.match(
                r"^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$", lines[i + 1]) and "|" in lines[i + 1]:
            tbl = [line]
            i += 1  # header
            i += 1  # separator
            while i < n and "|" in lines[i] and lines[i].strip():
                tbl.append(lines[i])
                i += 1
            blocks.append(("table", tbl))
            continue

        # blockquote
        if stripped.startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            blocks.append(("quote", " ".join(buf)))
            continue

        # lists
        if re.match(r"^\s*([-*])\s+", line) or re.match(r"^\s*\d+\.\s+", line):
            items = []
            while i < n and (re.match(r"^\s*([-*])\s+", lines[i])
                             or re.match(r"^\s*\d+\.\s+", lines[i])):
                raw = lines[i]
                indent = len(raw) - len(raw.lstrip())
                om = re.match(r"^\s*(\d+)\.\s+(.*)$", raw)
                if om:
                    items.append((indent, "o", om.group(1), om.group(2)))
                else:
                    um = re.match(r"^\s*[-*]\s+(.*)$", raw)
                    items.append((indent, "u", None, um.group(1)))
                i += 1
            blocks.append(("list", items))
            continue

        # paragraph
        buf = [stripped]
        i += 1
        while i < n and lines[i].strip() and not re.match(
                r"^(#{1,6}\s|```|>|\s*[-*]\s|\s*\d+\.\s)", lines[i]) \
                and not ("|" in lines[i] and i + 1 < n):
            buf.append(lines[i].strip())
            i += 1
        blocks.append(("para", " ".join(buf)))
    return blocks


# --------------------------------------------------------------------------
# Blocks -> flowables
# --------------------------------------------------------------------------
USABLE_W = A4[0] - 2 * 2.0 * cm


def make_table(tbl_lines):
    def cells(row):
        row = row.strip()
        if row.startswith("|"):
            row = row[1:]
        if row.endswith("|"):
            row = row[:-1]
        return [c.strip() for c in row.split("|")]

    header = cells(tbl_lines[0])
    rows = [cells(r) for r in tbl_lines[1:]]
    ncol = len(header)
    rows = [r + [""] * (ncol - len(r)) if len(r) < ncol else r[:ncol] for r in rows]

    # column widths weighted by max content length (sqrt-damped), clamped
    maxlen = [max([len(header[c])] + [len(r[c]) for r in rows]) for c in range(ncol)]
    weights = [max(2.0, ml ** 0.62) for ml in maxlen]
    tot = sum(weights)
    widths = [USABLE_W * w / tot for w in weights]

    data = [[Paragraph(inline(h), S["cellh"]) for h in header]]
    for r in rows:
        data.append([Paragraph(inline(c), S["cell"]) for c in r])

    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tstyle = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADBG),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, ACCENT),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
    ]
    for ri in range(1, len(data)):
        if ri % 2 == 0:
            tstyle.append(("BACKGROUND", (0, ri), (-1, ri), ROWBG))
    t.setStyle(TableStyle(tstyle))
    return t


def code_flowable(lines):
    # Preformatted splits across page boundaries (a single Table cell cannot),
    # so long listings (e.g. base.yaml) page-break cleanly. Background/border
    # come from the paragraph style. It renders text literally (no entity/tag
    # parsing), so pass raw source — escaping would show '&lt;' verbatim.
    text = "\n".join(lines) if lines else " "
    return Preformatted(text, S["code"])


def hr_flowable():
    t = Table([[""]], colWidths=[USABLE_W])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.7, RULE)]))
    return t


class HEntry(Paragraph):
    """Paragraph that remembers its heading level for TOC notification."""
    def __init__(self, text, st, level):
        super().__init__(text, st)
        self.toc_level = level


def blocks_to_flowables(blocks):
    flow = []
    for b in blocks:
        kind = b[0]
        if kind == "h":
            level, text = b[1], b[2]
            if level == 1:
                flow.append(PageBreak())
                flow.append(HEntry(inline(text), S["h1"], 0))
                flow.append(hr_flowable())
                flow.append(Spacer(1, 6))
            elif level == 2:
                flow.append(HEntry(inline(text), S["h2"], 1))
            elif level == 3:
                flow.append(HEntry(inline(text), S["h3"], 2))
            else:
                flow.append(Paragraph(inline(text), S["h4"]))
        elif kind == "para":
            flow.append(Paragraph(inline(b[1]), S["body"]))
        elif kind == "list":
            for indent, typ, num, text in b[1]:
                st = S["li2"] if indent >= 2 else S["li"]
                bullet = f"{num}." if typ == "o" else "•"
                flow.append(Paragraph(inline(text), st, bulletText=bullet))
        elif kind == "table":
            flow.append(Spacer(1, 2))
            flow.append(make_table(b[1]))
            flow.append(Spacer(1, 6))
        elif kind == "code":
            flow.append(Spacer(1, 2))
            flow.append(code_flowable(b[2]))
            flow.append(Spacer(1, 6))
        elif kind == "quote":
            flow.append(Paragraph(inline(b[1]), S["quote"]))
        elif kind == "hr":
            flow.append(Spacer(1, 3))
            flow.append(hr_flowable())
            flow.append(Spacer(1, 5))
    return flow


# --------------------------------------------------------------------------
# Document template (title page + TOC + numbered pages)
# --------------------------------------------------------------------------
class Report(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4,
                         leftMargin=2.0 * cm, rightMargin=2.0 * cm,
                         topMargin=2.0 * cm, bottomMargin=1.8 * cm, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin,
                      self.width, self.height, id="main")
        cover = PageTemplate(id="cover", frames=[frame])
        body = PageTemplate(id="body", frames=[frame], onPage=self._footer)
        self.addPageTemplates([cover, body])

    def _footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("DejaVu", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(2.0 * cm, 1.1 * cm, "Batch A — Specification & Report")
        canvas.drawRightString(A4[0] - 2.0 * cm, 1.1 * cm, f"{doc.page}")
        canvas.setStrokeColor(RULE)
        canvas.line(2.0 * cm, 1.45 * cm, A4[0] - 2.0 * cm, 1.45 * cm)
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, HEntry):
            text = re.sub(r"<[^>]+>", "", flowable.getPlainText())
            self.notify("TOCEntry", (flowable.toc_level, text, self.page))


def title_page():
    el = [Spacer(1, 3.2 * cm),
          Paragraph("Batch A", S["title"]),
          Paragraph("Foundational Ecological Cases A1–A4", S["subtitle"]),
          Paragraph("Specification, Implementation &amp; Reporting Plan", S["subtitle"]),
          Spacer(1, 0.8 * cm), hr_flowable(), Spacer(1, 0.5 * cm),
          Paragraph("An agent-based model of agents that survive a fixed ecology by "
                    "optimizing among competing physical needs — built as the "
                    "substrate the lab's humanistic work (Batch B) stands on.",
                    style("lead", fontSize=11.5, leading=17, alignment=TA_CENTER,
                          textColor=MUTED, spaceAfter=4)),
          Spacer(1, 1.4 * cm)]
    meta = [
        "Complete implementation of cases A1–A4 · ODD protocol specification",
        "Parameter table · Experimental design · Ablation controls · Results",
        "Deterministic · config-driven · reproducible from (code, config, seed)",
    ]
    for m in meta:
        el.append(Paragraph(m, S["tmeta"]))
    el.append(Spacer(1, 2.0 * cm))
    el.append(Paragraph("Generated from the project sources, configuration, and "
                        "measured calibration runs.",
                        style("gen", fontSize=9, leading=13, alignment=TA_CENTER,
                              textColor=RULE)))
    el.append(NextPageTemplate("body"))
    el.append(PageBreak())
    return el


def toc_page():
    toc = TableOfContents()
    toc.levelStyles = TOC_STYLES
    return [Paragraph("Contents", S["toctitle"]), toc,
            NextPageTemplate("body"), PageBreak()]


# --------------------------------------------------------------------------
# Content assembly
# --------------------------------------------------------------------------
def read(path):
    return (DOCS / path).read_text() if (DOCS / path).exists() else \
        (ROOT / path).read_text()


def grab(relpath, start, end=None):
    """Extract source lines from the first line starting with `start` up to
    (but excluding) the first later line starting with `end`."""
    text = (ROOT / relpath).read_text().split("\n")
    out, on = [], False
    for ln in text:
        if not on and ln.startswith(start):
            on = True
        if on:
            if end is not None and ln.startswith(end) and out:
                break
            out.append(ln)
    return "\n".join(out)


def file_tree():
    res = subprocess.run(
        ["bash", "-c",
         "cd '%s' && find . -type f -not -path './runs/*' "
         "-not -path '*/__pycache__/*' -not -path './.pytest_cache/*' "
         "-not -name '*.pdf' | sort" % ROOT],
        capture_output=True, text=True)
    return res.stdout.strip()


from report_content import build_markdown  # noqa: E402  (assembled below)


def main():
    md = build_markdown(read=read, grab=grab, file_tree=file_tree)
    blocks = parse_blocks(md)
    story = title_page() + toc_page() + blocks_to_flowables(blocks)
    doc = Report(str(OUT))
    doc.multiBuild(story)
    print(f"Wrote {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(DOCS))
    main()

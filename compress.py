# Shrinks scanned papers in place: every image becomes grayscale JPEG, at most
# MAX pixels on its long side. A file is only replaced if the result is smaller.
# Usage: python compress.py [file.pdf ...]   (default: every PDF in public/papers)
import pathlib, sys
import pymupdf

MAX, QUALITY = 1754, 60  # 1754 px = A4 height at 150 dpi


def shrink(doc, xref):
    info = doc.extract_image(xref)
    w, h = info['width'], info['height']
    if info['ext'] == 'jpeg' and info['colorspace'] == 1 and max(w, h) <= MAX:
        return None  # already done, don't re-encode
    pix = pymupdf.Pixmap(doc, xref)
    if not pix.colorspace:
        return None  # a stencil mask, already tiny
    if pix.alpha:
        pix = pymupdf.Pixmap(pix, 0)
    pix = pymupdf.Pixmap(pymupdf.csGRAY, pix)
    scale = min(1, MAX / max(w, h))
    pix = pymupdf.Pixmap(pix, round(w * scale), round(h * scale), None)
    return pix.tobytes('jpeg', jpg_quality=QUALITY)


files = sys.argv[1:] or pathlib.Path(__file__).parent.glob('public/papers/**/*.pdf')
for path in map(pathlib.Path, files):
    doc = pymupdf.open(path)
    seen = set()
    for page in doc:
        for xref, *_ in page.get_images():
            if xref not in seen and (jpeg := shrink(doc, xref)):
                page.replace_image(xref, stream=jpeg)
            seen.add(xref)
    data = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    before = path.stat().st_size
    if len(data) < before:
        path.write_bytes(data)
    print(f'{path.name}: {before // 1024} KB -> {min(len(data), before) // 1024} KB')

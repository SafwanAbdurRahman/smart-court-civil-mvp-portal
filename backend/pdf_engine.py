import fitz  # PyMuPDF

MAX_PDF_PAGES = 6
RENDER_ZOOM = 2.0  # ~144 DPI — sharp enough for OCR without blowing up payload size


def render_pdf_pages_to_png(pdf_bytes: bytes, max_pages: int = MAX_PDF_PAGES) -> list[bytes]:
    """Rasterizes the first `max_pages` pages of a PDF into PNG bytes so they can
    be handed to the vision model the same way a photographed document would be."""
    images: list[bytes] = []
    matrix = fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM)

    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        if doc.page_count == 0:
            raise ValueError("The uploaded PDF has no pages.")

        for page_index in range(min(doc.page_count, max_pages)):
            page = doc.load_page(page_index)
            pixmap = page.get_pixmap(matrix=matrix)
            images.append(pixmap.tobytes("png"))

    return images

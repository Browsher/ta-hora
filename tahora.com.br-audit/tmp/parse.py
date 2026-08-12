# -*- coding: utf-8 -*-
import re, json, os, sys
from html.parser import HTMLParser

IN_DIR = os.path.dirname(os.path.abspath(__file__)) + "/html"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

SKIP_TAGS = {"script", "style", "noscript", "svg", "path", "template"}

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self.meta = {}
        self.headings = []  # (level, text)
        self.canonical = None
        self.jsonld = []
        self._skip_depth = 0
        self._cur_tag_stack = []
        self._in_title = False
        self._in_heading = None
        self._heading_buf = []
        self._in_jsonld = False
        self._jsonld_buf = []
        self.text_parts = []
        self._link_texts = []
        self._in_a = False
        self._a_buf = []
        self._a_href = None
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in SKIP_TAGS:
            self._skip_depth += 1
            if tag == "script" and attrs.get("type") == "application/ld+json":
                self._in_jsonld = True
                self._jsonld_buf = []
            return
        if self._skip_depth > 0:
            return
        if tag == "title":
            self._in_title = True
            self._title_buf = []
        elif tag == "meta":
            name = attrs.get("name") or attrs.get("property")
            if name:
                self.meta[name.lower()] = attrs.get("content", "")
        elif tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        elif tag in ("h1", "h2", "h3", "h4"):
            self._in_heading = tag
            self._heading_buf = []
        elif tag == "a":
            self._in_a = True
            self._a_buf = []
            self._a_href = attrs.get("href")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            if self._skip_depth > 0:
                self._skip_depth -= 1
            if tag == "script" and self._in_jsonld:
                text = "".join(self._jsonld_buf)
                self.jsonld.append(text)
                self._in_jsonld = False
            return
        if self._skip_depth > 0:
            return
        if tag == "title" and self._in_title:
            self.title = "".join(self._title_buf).strip()
            self._in_title = False
        elif tag in ("h1", "h2", "h3", "h4") and self._in_heading == tag:
            text = "".join(self._heading_buf).strip()
            text = re.sub(r"\s+", " ", text)
            if text:
                self.headings.append((tag, text))
            self._in_heading = None
        elif tag == "a" and self._in_a:
            text = "".join(self._a_buf).strip()
            text = re.sub(r"\s+", " ", text)
            self.links.append((text, self._a_href))
            self._in_a = False

    def handle_data(self, data):
        if self._skip_depth > 0:
            if self._in_jsonld:
                self._jsonld_buf.append(data)
            return
        if self._in_title:
            self._title_buf.append(data)
        if self._in_heading:
            self._heading_buf.append(data)
        if self._in_a:
            self._a_buf.append(data)
        self.text_parts.append(data)


def get_visible_text(html_str):
    ex = Extractor()
    ex.feed(html_str)
    raw_text = "".join(ex.text_parts)
    # collapse whitespace but keep sentence breaks roughly
    lines = [l.strip() for l in re.split(r"\n+", raw_text)]
    lines = [re.sub(r"\s+", " ", l) for l in lines if l.strip()]
    text = "\n".join(lines)
    return ex, text


def main():
    results = {}
    for fname in sorted(os.listdir(IN_DIR)):
        if not fname.endswith(".html"):
            continue
        name = fname[:-5]
        with open(os.path.join(IN_DIR, fname), encoding="utf-8", errors="replace") as f:
            html_str = f.read()
        ex, text = get_visible_text(html_str)
        results[name] = {
            "title": ex.title,
            "meta_description": ex.meta.get("description"),
            "og_title": ex.meta.get("og:title"),
            "og_description": ex.meta.get("og:description"),
            "canonical": ex.canonical,
            "headings": ex.headings,
            "text": text,
            "text_len_chars": len(text),
            "word_count": len(re.findall(r"\w+", text, re.UNICODE)),
            "jsonld": ex.jsonld,
            "links": ex.links,
        }
    with open(os.path.join(OUT_DIR, "parsed.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Wrote parsed.json with", len(results), "pages")

if __name__ == "__main__":
    main()

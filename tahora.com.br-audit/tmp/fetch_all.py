import sys, json, importlib.util

spec = importlib.util.spec_from_file_location("render_page", r"C:\Users\ADM\.claude\skills\seo\scripts\render_page.py")
rp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rp)

urls = [
    "https://www.tahora.com.br/",
    "https://www.tahora.com.br/catalogo",
    "https://www.tahora.com.br/sobre-nos",
    "https://www.tahora.com.br/suporte",
    "https://www.tahora.com.br/politica-de-privacidade",
    "https://www.tahora.com.br/termos-de-uso",
    "https://www.tahora.com.br/trocas-e-devolucoes",
    "https://www.tahora.com.br/produtos/camera-seguranca-a31h",
    "https://www.tahora.com.br/produtos/camera-seguranca-es-p9",
    "https://www.tahora.com.br/produtos/camera-seguranca-q6",
    "https://www.tahora.com.br/produtos/camera-lampada",
    "https://www.tahora.com.br/produtos/camera-seguranca-a38",
    "https://www.tahora.com.br/produtos/camera-seguranca-q8",
    "https://www.tahora.com.br/produtos/camera-seguranca-s8",
]

out_dir = r"C:\Users\ADM\projetos\ta hora\site-ta-hora\tahora.com.br-audit\tmp"

for url in urls:
    name = url.replace("https://www.tahora.com.br/", "").replace("/", "_")
    if not name:
        name = "home"
    print("Fetching", url, "->", name, file=sys.stderr)
    result = rp.render_page(url, mode="auto", extract_content=True)
    with open(f"{out_dir}/{name}_full.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
print("DONE", file=sys.stderr)

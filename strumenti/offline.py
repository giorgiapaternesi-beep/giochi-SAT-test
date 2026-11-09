#!/usr/bin/env python3
"""Prepara assets/offline/ per la copia scaricata del sito.

Aperto con doppio clic (indirizzi file://), il browser non lascia leggere i
file del sito con fetch, non lascia usare le immagini su un canvas e blocca i
caratteri. Questo script copia quei file dentro due file che il browser carica
sempre:

  assets/offline/file.js   testi (domande, pezzi del satellite) e immagini
                           (come data URL), letti da GiochiSAT.leggiFile
  assets/offline/font.css  i caratteri di assets/css/giochisat.css, incorporati

Non serve lanciarlo a mano: su GitHub lo fa l'azione "Copia scaricabile"
(.github/workflows/copia-offline.yml) ogni volta che cambiano questi file.
A mano, dalla cartella del sito:  python3 strumenti/offline.py
"""
import base64, json, mimetypes, re
from pathlib import Path

SITO = Path(__file__).resolve().parent.parent
USCITA = SITO / "assets" / "offline"

# File letti dal codice con GiochiSAT.leggiFile / indirizzoFile.
# Se un gioco nuovo legge altri file, aggiungili qui.
TESTI = ["assets/quiz/domande.txt", "assets/satellite/pezzi/*.svg"]
IMMAGINI = ["assets/logo-arpa-lazio.jpg"]
CSS_CARATTERI = "assets/css/giochisat.css"

AVVISO = "File generato da strumenti/offline.py: non modificarlo a mano."


def elenco(modelli):
    for m in modelli:
        trovati = sorted(SITO.glob(m))
        if not trovati:
            raise SystemExit(f"Nessun file per {m}")
        yield from trovati


def data_url(percorso):
    tipo = mimetypes.guess_type(percorso.name)[0] or "application/octet-stream"
    return f"data:{tipo};base64," + base64.b64encode(percorso.read_bytes()).decode("ascii")


def file_js():
    dati = {}
    for p in elenco(TESTI):
        dati[p.relative_to(SITO).as_posix()] = p.read_text(encoding="utf-8")
    for p in elenco(IMMAGINI):
        dati[p.relative_to(SITO).as_posix()] = data_url(p)
    corpo = json.dumps(dati, ensure_ascii=False, indent=0, sort_keys=True)
    return f"/* {AVVISO} */\nwindow.GIOCHISAT_FILE = {corpo};\n"


def font_css():
    css = (SITO / CSS_CARATTERI).read_text(encoding="utf-8")
    cartella = (SITO / CSS_CARATTERI).parent
    regole = re.findall(r"@font-face\s*\{[^}]*\}", css)
    if not regole:
        raise SystemExit(f"Nessun @font-face in {CSS_CARATTERI}")

    def incorpora(m):
        return 'url("' + data_url((cartella / m.group(1)).resolve()) + '")'

    return f"/* {AVVISO} */\n" + "\n".join(re.sub(r'url\("?([^")]+)"?\)', incorpora, r) for r in regole) + "\n"


def scrivi(nome, contenuto):
    p = USCITA / nome
    vecchio = p.read_text(encoding="utf-8") if p.exists() else None
    if vecchio != contenuto:
        p.write_text(contenuto, encoding="utf-8")
        print("aggiornato", p.relative_to(SITO))
    else:
        print("già aggiornato", p.relative_to(SITO))


if __name__ == "__main__":
    USCITA.mkdir(parents=True, exist_ok=True)
    scrivi("file.js", file_js())
    scrivi("font.css", font_css())

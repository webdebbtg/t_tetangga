from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Tengok Tetangga - NLP Routing Service",
    description="AI-powered OPD routing engine untuk laporan sosial",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────
# Schema
# ──────────────────────────────────────────
class RoutingRequest(BaseModel):
    catatan_observasi: Optional[str] = ""
    kesimpulan_otomatis: Optional[str] = ""
    kategori_urusan: Optional[str] = ""
    skor_akhir: Optional[int] = 0
    skor_maksimal: Optional[int] = 100

class RoutingResponse(BaseModel):
    kategori_opd: str
    confidence: float
    alasan: str
    keywords: list[str]


# ──────────────────────────────────────────
# Rule-based NLP Keyword Engine
# ──────────────────────────────────────────
KEYWORD_MAP = {
    "EKONOMI": [
        "miskin", "kemiskinan", "pengangguran", "tidak bekerja", "tidak punya penghasilan",
        "utang", "tidak mampu", "kurang mampu", "bantuan sosial", "pkh", "blt",
        "sembako", "lapar", "kelaparan", "ekonomi", "pendapatan rendah", "kkm",
    ],
    "KESEHATAN": [
        "sakit", "penyakit", "gizi buruk", "stunting", "balita", "lansia sakit",
        "tidak bisa berobat", "tidak ada biaya berobat", "bpjs", "puskesmas",
        "rumah sakit", "kesehatan", "tb", "tbc", "gizi", "malnutrisi", "difabel",
        "disabilitas", "cacat", "ibu hamil", "nifas",
    ],
    "PERMUKIMAN": [
        "rumah rusak", "atap bocor", "dinding rapuh", "tidak layak huni",
        "kumuh", "bantaran sungai", "banjir", "tidak ada wc", "mck",
        "sanitasi", "air bersih", "listrik", "perumahan", "permukiman",
        "kontrakan", "sewa rumah", "tidak punya rumah", "gelandangan",
    ],
    "PENDIDIKAN": [
        "putus sekolah", "tidak sekolah", "anak jalanan", "tidak bisa sekolah",
        "biaya pendidikan", "spp", "buku", "seragam", "beasiswa",
        "buta huruf", "tidak bisa baca", "pendidikan", "siswa", "anak usia sekolah",
    ],
}

def extract_keywords(text: str) -> dict[str, list[str]]:
    """Ekstrak keyword per kategori dari teks narasi."""
    text_lower = text.lower()
    found = {}
    for kategori, keywords in KEYWORD_MAP.items():
        matched = [kw for kw in keywords if kw in text_lower]
        if matched:
            found[kategori] = matched
    return found

def route_by_rules(request: RoutingRequest) -> RoutingResponse:
    """Rule-based routing berdasarkan keyword + kesimpulan + kategori."""
    narasi = f"{request.catatan_observasi} {request.kesimpulan_otomatis}".strip()

    # 1. Keyword extraction dari narasi
    keyword_hits = extract_keywords(narasi)

    # 2. Bobot dari kesimpulan_otomatis
    kesimpulan_map = {
        "Kemiskinan_Ekstrem": "EKONOMI",
        "Rentan_Miskin": "EKONOMI",
        "Darurat_Kesehatan": "KESEHATAN",
        "Perlu_Bantuan_Kesehatan": "KESEHATAN",
        "Permukiman_Tidak_Layak": "PERMUKIMAN",
        "Permukiman_Kurang_Layak": "PERMUKIMAN",
        "Putus_Sekolah_Kritis": "PENDIDIKAN",
        "Risiko_Putus_Sekolah": "PENDIDIKAN",
    }

    score = {k: 0.0 for k in KEYWORD_MAP}

    # Bobot keyword (1 poin per keyword)
    for kat, kws in keyword_hits.items():
        score[kat] += len(kws) * 1.0

    # Bobot kesimpulan (5 poin)
    if request.kesimpulan_otomatis in kesimpulan_map:
        target = kesimpulan_map[request.kesimpulan_otomatis]
        score[target] += 5.0

    # Bobot kategori_urusan (3 poin)
    if request.kategori_urusan and request.kategori_urusan in score:
        score[request.kategori_urusan] += 3.0

    # Tentukan pemenang
    if max(score.values()) == 0:
        # Default fallback berdasarkan skor tertinggi kuesioner
        winner = request.kategori_urusan or "EKONOMI"
        confidence = 0.5
    else:
        winner = max(score, key=score.get)
        total = sum(score.values())
        confidence = round(score[winner] / total, 3) if total > 0 else 0.5

    all_keywords = []
    for kws in keyword_hits.values():
        all_keywords.extend(kws)

    alasan = (
        f"Routing ke '{winner}' berdasarkan: "
        f"Kesimpulan otomatis '{request.kesimpulan_otomatis}', "
        f"kategori skor '{request.kategori_urusan}', "
        f"dan {len(all_keywords)} keyword relevan ditemukan dalam narasi."
    )

    return RoutingResponse(
        kategori_opd=winner,
        confidence=confidence,
        alasan=alasan,
        keywords=all_keywords[:10],
    )


# ──────────────────────────────────────────
# LLM-based routing (opsional, jika ada API key)
# ──────────────────────────────────────────
async def route_by_llm(request: RoutingRequest) -> Optional[RoutingResponse]:
    """Routing menggunakan LLM (OpenAI/Groq). Return None jika API key tidak tersedia."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from openai import AsyncOpenAI

        base_url = "https://api.groq.com/openai/v1" if os.getenv("GROQ_API_KEY") else None
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)

        prompt = f"""Kamu adalah sistem routing laporan sosial di Indonesia.
Berdasarkan informasi berikut, tentukan kategori OPD yang paling tepat menangani kasus ini.

Narasi observasi: "{request.catatan_observasi}"
Kesimpulan otomatis sistem: "{request.kesimpulan_otomatis}"
Kategori skor tertinggi: "{request.kategori_urusan}"

Pilih SATU dari: EKONOMI, KESEHATAN, PERMUKIMAN, PENDIDIKAN
Jawab hanya dengan format JSON:
{{"kategori": "KATEGORI", "alasan": "penjelasan singkat", "keywords": ["kata kunci 1", "kata kunci 2"]}}"""

        response = await client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200,
        )

        content = response.choices[0].message.content
        # Parse JSON response
        import json
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return RoutingResponse(
                kategori_opd=data.get("kategori", "EKONOMI"),
                confidence=0.88,
                alasan=data.get("alasan", "LLM routing"),
                keywords=data.get("keywords", []),
            )
    except Exception as e:
        print(f"[LLM] Error: {e}")
    return None


# ──────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "service": "Tengok Tetangga NLP Routing", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/route", response_model=RoutingResponse)
async def route_laporan(request: RoutingRequest):
    """
    Endpoint utama: routing laporan ke OPD berdasarkan NLP.
    1. Coba LLM (jika API key tersedia)
    2. Fallback ke rule-based keyword engine
    """
    # Coba LLM terlebih dahulu
    result = await route_by_llm(request)
    if result:
        return result

    # Fallback ke rule-based
    return route_by_rules(request)

@app.post("/analyze")
async def analyze_narasi(request: RoutingRequest):
    """Analisis lengkap narasi (keyword, skor per kategori)."""
    narasi = f"{request.catatan_observasi} {request.kesimpulan_otomatis}".strip()
    keyword_hits = extract_keywords(narasi)

    return {
        "narasi_length": len(narasi),
        "keyword_hits": keyword_hits,
        "kategori_terdeteksi": list(keyword_hits.keys()),
        "routing_rekomendasi": route_by_rules(request),
    }

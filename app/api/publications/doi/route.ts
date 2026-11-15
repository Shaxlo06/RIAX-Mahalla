import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const doi = request.nextUrl.searchParams.get("doi")?.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!doi || !/^10\.\d{4,9}\/.+/.test(doi)) return Response.json({ message: "To‘g‘ri DOI kiriting." }, { status: 400 });
  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { "User-Agent": "SMART-RIAX/1.0 (TSUE academic metadata client)" },
      cache: "no-store",
    });
    if (!response.ok) return Response.json({ message: "Crossref bazasida ushbu DOI topilmadi." }, { status: 404 });
    const payload = await response.json();
    const work = payload.message;
    const year = work.published?.["date-parts"]?.[0]?.[0] || work.created?.["date-parts"]?.[0]?.[0];
    return Response.json({
      title: work.title?.[0] || "",
      authors: (work.author || []).map((author: { given?: string; family?: string }) => [author.given, author.family].filter(Boolean).join(" ")).join(", "),
      journal_or_conference: work["container-title"]?.[0] || work.publisher || "",
      publication_year: year || null,
      doi: work.DOI || doi,
      issn: work.ISSN?.join(", ") || "",
      publication_url: work.URL || `https://doi.org/${doi}`,
      source: "crossref",
      verification_status: "imported",
      is_scopus_indexed: false,
      is_wos_indexed: false,
      note: "Crossref metama’lumoti import qilindi. Scopus/WoS indeksatsiyasi alohida vakolatli manba bilan tekshirilishi kerak.",
    });
  } catch {
    return Response.json({ message: "Crossref xizmatiga ulanib bo‘lmadi." }, { status: 502 });
  }
}

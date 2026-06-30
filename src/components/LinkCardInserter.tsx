"use client";

import { useState } from "react";

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
}

interface Props {
  onInsert: (html: string) => void;
}

export default function LinkCardInserter({ onInsert }: Props) {
  const [url, setUrl] = useState("");
  const [og, setOg] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOG = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setOg(null);
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) throw new Error("불러오기 실패");
      setOg(await res.json());
    } catch {
      setError("URL을 불러올 수 없어요. 주소를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const insert = () => {
    if (!og) return;
    let domain = "";
    try { domain = new URL(og.url || url).hostname; } catch {}

    const html = `<a href="${og.url || url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;margin:16px 0;background:rgba(255,255,255,0.03);text-decoration:none;color:inherit;">
${og.image ? `<img src="${og.image}" style="width:120px;height:90px;object-fit:cover;flex-shrink:0;" />` : ""}
<div style="padding:12px 16px;flex:1;min-width:0;overflow:hidden;">
<p style="font-weight:bold;font-size:14px;color:#fff;margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${og.title}</p>
<p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${og.description}</p>
<p style="font-size:11px;color:rgba(212,175,55,0.7);margin:0;">${domain}</p>
</div>
</a><p><br></p>`;

    onInsert(html);
    setUrl("");
    setOg(null);
  };

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
        링크 카드 삽입
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchOG()}
          placeholder="https://..."
          style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13 }}
        />
        <button
          onClick={fetchOG}
          disabled={loading || !url.trim()}
          style={{ background: "#D4AF37", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 900, fontSize: 12, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "로딩..." : "미리보기"}
        </button>
      </div>

      {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</p>}

      {og && (
        <div style={{ marginTop: 12 }}>
          {/* 카드 미리보기 */}
          <a href={og.url || url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.03)", textDecoration: "none", color: "inherit" }}>
            {og.image && <img src={og.image} alt="" style={{ width: 100, height: 75, objectFit: "cover", flexShrink: 0 }} />}
            <div style={{ padding: "10px 14px", flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: "bold", fontSize: 13, color: "#fff", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{og.title}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 5px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{og.description}</p>
              <p style={{ fontSize: 10, color: "rgba(212,175,55,0.7)", margin: 0 }}>
                {(() => { try { return new URL(og.url || url).hostname; } catch { return ""; } })()}
              </p>
            </div>
          </a>
          <button
            onClick={insert}
            style={{ marginTop: 10, width: "100%", background: "#222", border: "1px solid #D4AF37", color: "#D4AF37", borderRadius: 8, padding: "8px 0", fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: "0.1em" }}
          >
            ↑ 본문에 삽입
          </button>
        </div>
      )}
    </div>
  );
}

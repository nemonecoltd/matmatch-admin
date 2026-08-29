"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

const GOLD = "#D4AF37";
const BLUE = "#4a9eff";

interface Product {
  id: number;
  label: string;
  coupang_url: string;
  image_url: string | null;
  match_keywords: string[];
}

export default function ProductsDesk() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState("");
  const [coupangUrl, setCoupangUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/affiliate-products")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data.items) ? data.items : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "authenticated") fetchProducts();
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) signIn("google");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0c0c0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: GOLD, fontStyle: "italic", letterSpacing: "0.2em" }}>Authenticating...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "#0c0c0c", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: GOLD, fontStyle: "italic", letterSpacing: "0.2em" }}>Access Denied. Please sign in as an admin.</p>
        <button onClick={() => signIn("google")} style={{ background: GOLD, color: "#0c0c0c", border: "none", padding: "0.8rem 1.5rem", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Sign In with Google</button>
      </div>
    );
  }

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`[${label}]을(를) 정말 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/affiliate-products/${id}`, { method: "DELETE" });
    if (res.ok) fetchProducts();
    else alert("삭제 처리에 실패했습니다.");
  };

  const handleCreate = async () => {
    if (!label || !coupangUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliate-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          coupang_url: coupangUrl,
          image_url: imageUrl || null,
          match_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          sort_order: 99,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLabel("");
      setCoupangUrl("");
      setImageUrl("");
      setKeywords("");
      fetchProducts();
    } catch (e) {
      alert(`추가 실패: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111",
    border: "1.5px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "0.6rem 0.8rem",
    color: "#fff",
    fontSize: 13,
  };
  const labelStyle: React.CSSProperties = { color: "#888", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" };

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#e8e8e8", minHeight: "100vh", padding: "2rem" }}>
      <header style={{ background: "#0c0c0c", borderBottom: `4px solid ${BLUE}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(145deg, ${BLUE}, #2a6fd0)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, fontStyle: "italic", color: "#0c0c0c" }}>
            {products.length}
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>Products Desk.</h1>
            <p style={{ color: BLUE, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>쿠팡 파트너스 상품 관리</p>
          </div>
        </div>
        <Link href="/">
          <button style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "0.6rem 1.4rem", color: "#ccc", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}>
            BACK TO HOME
          </button>
        </Link>
      </header>

      <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ border: `1.5px solid ${BLUE}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "1rem", textTransform: "uppercase" }}>PRODUCT LIST</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#999", fontStyle: "italic", padding: "40px" }}>Fetching Database...</p>
            ) : products.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>등록된 상품이 없습니다.</p>
            ) : (
              products.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0, background: "#0c0c0c", border: `2px solid ${BLUE}`, borderRadius: 16, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: "#1a1a1a", flexShrink: 0 }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#fff", fontSize: 15, fontStyle: "italic", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</p>
                      <p style={{ color: "#888", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.match_keywords.join(", ")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.label)}
                    style={{ width: 90, padding: "0.6rem 0", border: "2px solid #ef4444", color: "#ef4444", background: "#1a0000", fontSize: 11, fontWeight: 700, fontStyle: "italic", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}
                  >
                    DELETE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "1.5rem" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "1rem", textTransform: "uppercase" }}>새 상품 추가</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 480 }}>
            <div>
              <label style={labelStyle}>상품명(표시용)</label>
              <input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 재테크 다이어리" />
            </div>
            <div>
              <label style={labelStyle}>쿠팡 파트너스 링크</label>
              <input style={inputStyle} value={coupangUrl} onChange={(e) => setCoupangUrl(e.target.value)} placeholder="https://link.coupang.com/a/..." />
            </div>
            <div>
              <label style={labelStyle}>상품 이미지 URL(선택)</label>
              <input style={inputStyle} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>매칭 키워드(콤마로 구분)</label>
              <input style={inputStyle} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="예: 부동산, 청약" />
            </div>
            <button
              onClick={handleCreate}
              disabled={submitting || !label || !coupangUrl}
              style={{ alignSelf: "flex-start", background: `linear-gradient(to bottom, ${BLUE}, #2a6fd0)`, color: "#0c0c0c", border: "none", borderRadius: 10, padding: "0.6rem 1.6rem", fontWeight: 700, fontStyle: "italic", fontSize: 13, cursor: submitting ? "default" : "pointer", opacity: submitting || !label || !coupangUrl ? 0.5 : 1 }}
            >
              {submitting ? "추가 중..." : "+ 추가"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

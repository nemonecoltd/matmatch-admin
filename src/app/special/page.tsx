"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";

export default function SpecialDesk() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [specials, setSpecials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchSpecials = () => {
    setLoading(true);
    fetch("/api/specials")
      .then((res) => res.json())
      .then((data) => {
        setSpecials(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setSpecials([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSpecials();
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      signIn("google");
    }
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

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`[${title}] 스페셜을 정말 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/specials/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("성공적으로 삭제되었습니다.");
        fetchSpecials();
      } else {
        alert("삭제 처리에 실패했습니다.");
      }
    } catch (err) {
      alert("서버와 통신할 수 없습니다.");
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#e8e8e8", minHeight: "100vh", padding: "2rem" }}>
      
      {/* ── HEADER ── */}
      <header style={{ background: "#0c0c0c", borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(145deg, #27c93f, #1e9d31)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, fontStyle: "italic", color: "#0c0c0c", boxShadow: `0 0 18px rgba(39,201,63,0.5)`, position: "relative" }}>
            <span style={{ position: "absolute", top: 6, left: 8, width: 7, height: 7, borderRadius: "50%", background: "#0c0c0c", opacity: 0.5 }} />
            {specials.length}
          </div>
          <div>
            <p style={{ color: "#888", fontSize: 10, margin: 0 }}>"use client"</p>
            <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>SPECIAL Desk.</h1>
            <p style={{ color: "#27c93f", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>네모네AIM Series Management</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/">
            <button style={{ background: "transparent", border: `2px solid rgba(255,255,255,0.2)`, borderRadius: 10, padding: "0.6rem 1.4rem", color: "#ccc", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}>
              BACK TO HOME
            </button>
          </Link>
          <Link href="/special/new">
            <button style={{ background: `linear-gradient(to bottom, #27c93f, #1e9d31)`, color: "#0c0c0c", border: "none", borderRadius: 10, padding: "0.6rem 1.4rem", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 14px rgba(39,201,63,0.4)" }}>
              + NEW SPECIAL
            </button>
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem 2rem 2.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        
        <div style={{ border: `1.5px solid #27c93f`, borderRadius: 8, padding: "1.5rem" }}>
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "1rem", textTransform: "uppercase" }}>SPECIAL LIST</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loading ? (
                <p style={{ textAlign: "center", color: "#999", fontStyle: "italic", padding: "40px" }}>Fetching Database...</p>
              ) : specials.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>등록된 스페셜이 없습니다.</p>
              ) : (
                specials.map((special) => (
                  <div key={special.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ flex: 1, minWidth: 0, background: "#0c0c0c", border: `2px solid ${special.is_main ? GOLD : CYAN}`, borderRadius: 24, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", boxShadow: `0 4px 24px rgba(0,0,0,0.5)` }}>
                      <div style={{ width: 72, height: 72, minWidth: 72, borderRadius: "50%", border: `3px solid ${special.is_main ? GOLD : CYAN}`, display: "flex", alignItems: "center", justifyContent: "center", color: special.is_main ? GOLD : CYAN, fontSize: 22, fontWeight: 900, fontStyle: "italic", flexShrink: 0 }}>
                        #{special.id}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {special.is_main === 1 && <span style={{ color: "#0c0c0c", background: GOLD, padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 900, flexShrink: 0 }}>MAIN</span>}
                          <p style={{ color: "#27c93f", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0, flexShrink: 0 }}>SPECIAL SERIES</p>
                        </div>
                        <p style={{ color: "#fff", fontSize: 16, fontStyle: "italic", fontWeight: 300, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{special.title}</p>
                        <p style={{ color: "#888", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{special.description}</p>
                      </div>
                      {special.bg_image_url && (
                         <img src={special.bg_image_url} style={{ width: 100, height: 60, minWidth: 100, objectFit: "cover", borderRadius: 8, opacity: 0.8, flexShrink: 0 }} alt="" />
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                      <Link href={`/special/edit/${special.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ width: 110, padding: "0.45rem 0", border: `2px solid #27c93f`, background: "#0c0c0c", color: "#fff", fontSize: 11, fontWeight: 700, fontStyle: "italic", borderRadius: 6, cursor: "pointer" }}>EDIT</button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(special.id, special.title)}
                        style={{ width: 110, padding: "0.45rem 0", border: "2px solid #ef4444", color: "#ef4444", background: "#1a0000", fontSize: 11, fontWeight: 700, fontStyle: "italic", borderRadius: 6, cursor: "pointer" }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

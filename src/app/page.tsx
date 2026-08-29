"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react"; // NextAuth.js 훅 임포트

// 클로드의 정밀 디자인 상수 고정
const GOLD = "#D4AF37";
const CYAN = "#22d3ee";

export default function CMSDesk() {
  const router = useRouter();
  const { data: session, status } = useSession(); // 세션 정보 가져오기
  
  // [무결성 로직 1: 상태 관리]
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  
  // 카테고리 업데이트 (이전의 하드코딩된 카테고리에서 새 카테고리로 변경)
  const categories = ["ALL", "Taste", "Culture", "Life", "Tech"]; 

  // [무결성 로직 2: 데이터 실시간 동기화]
  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/posts?limit=500")
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        const all = Array.isArray(data) ? data : (data.posts || []);
        const filtered = activeCategory === "ALL" ? all : all.filter((p: any) => p.category === activeCategory);
        setPosts(filtered);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 세션이 로드된 후 또는 세션 상태 변경 시 fetchPosts 호출
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, activeCategory]); // status와 activeCategory 변경 시 fetch

  // 검색어는 프론트/어드민이 동일한 백엔드 검색(title+본문+태그+카테고리, ILIKE)을 쓰도록
  // 서버에 위임 — 기존엔 admin이 title/#id만, 프론트는 title+본문+태그를 각자 다르게(그리고
  // admin은 최대 500개, 프론트는 기본 100개까지만) 봐서 같은 검색어에도 결과가 달랐던 문제.
  useEffect(() => {
    if (status !== "authenticated") return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/posts?limit=500&q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : { posts: [] }))
        .then((data) => {
          const all = Array.isArray(data) ? data : (data.posts || []);
          setSearchResults(activeCategory === "ALL" ? all : all.filter((p: any) => p.category === activeCategory));
        })
        .catch((err) => {
          console.error("Search Fetch Error:", err);
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, activeCategory, status]);

  // 인증 로직 (최우선)
  useEffect(() => {
    if (status === "loading") return; // 세션 로딩 중
    if (!session) {
      signIn("google"); // Google 로그인 페이지로 바로 이동
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


  // [무결성 로직 3: 삭제 방어선]
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`[${title}] 글을 정말 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("성공적으로 삭제되었습니다.");
        fetchPosts();
      } else {
        alert("삭제 처리에 실패했습니다.");
      }
    } catch (err) {
      alert("서버와 통신할 수 없습니다.");
    }
  };



  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#e8e8e8", minHeight: "100vh", padding: "2rem" }}>
      
      {/* ── HEADER: 클로드의 고급 디자인 재현 ── */}
      <header style={{ background: "#0c0c0c", borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(145deg, ${GOLD}, #a07820)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, fontStyle: "italic", color: "#0c0c0c", boxShadow: `0 0 18px rgba(212,175,55,0.5)`, position: "relative" }}>
            <span style={{ position: "absolute", top: 6, left: 8, width: 7, height: 7, borderRadius: "50%", background: "#0c0c0c", opacity: 0.5 }} />
            {posts.length}
          </div>
          <div>
            <p style={{ color: "#888", fontSize: 10, margin: 0 }}>"use client"</p>
            <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>CMS Desk.</h1>
            <p style={{ color: GOLD, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>네모네AIM Admin System v1.0</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => signOut()} style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "0.6rem 1rem", color: "#aaa", fontSize: 11, fontWeight: 700, fontStyle: "italic", cursor: "pointer" }}>Sign Out</button>
          <Link href="/data">
            <button style={{ background: "transparent", border: `2px solid ${GOLD}`, borderRadius: 10, padding: "0.6rem 1.4rem", color: GOLD, fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}>
              DATA
            </button>
          </Link>
          <Link href="/special">
            <button style={{ background: "transparent", border: `2px solid #27c93f`, borderRadius: 10, padding: "0.6rem 1.4rem", color: "#27c93f", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}>
              SPECIAL
            </button>
          </Link>
          <Link href="/products">
            <button style={{ background: "transparent", border: `2px solid #4a9eff`, borderRadius: 10, padding: "0.6rem 1.4rem", color: "#4a9eff", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}>
              PRODUCTS
            </button>
          </Link>
          <Link href="/new">
            <button style={{ background: `linear-gradient(to bottom, ${GOLD}, #a07820)`, color: "#0c0c0c", border: "none", borderRadius: 10, padding: "0.6rem 1.4rem", fontWeight: 700, fontStyle: "italic", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>
              + NEW POST
            </button>
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem 2rem 2.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        
        {/* 클로드 스타일의 내부 골드 디바이더 */}
        <div style={{ border: `1.5px solid ${GOLD}`, borderRadius: 8, padding: "1.5rem" }}>
          
          {/* SEARCH SECTION */}
          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "0.75rem", textTransform: "uppercase" }}>SEARCH</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목·본문·태그 또는 번호(#id) 검색..."
                style={{ flex: 1, padding: "0.55rem 1rem", border: `2px solid ${searchQuery ? GOLD : "#ccc"}`, borderRadius: 8, fontSize: 13, fontStyle: "italic", background: "#fff", outline: "none", transition: "border 0.2s" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ padding: "0.55rem 0.9rem", border: "2px solid #ccc", borderRadius: 8, background: "#fff", color: "#888", fontSize: 12, cursor: "pointer" }}>✕</button>
              )}
            </div>
          </section>

          {/* CATEGORY SECTION: 필터 기능 활성화 */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "0.75rem", textTransform: "uppercase" }}>CATEGORY</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{ padding: "0.4rem 0.9rem", border: cat === activeCategory ? `2px solid ${GOLD}` : "2px solid #ccc", borderRadius: 6, fontSize: 11, fontWeight: 700, fontStyle: "italic", color: cat === activeCategory ? GOLD : "#888", background: "#fff", cursor: "pointer", transition: "0.2s" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* LIST SECTION: 실제 DB 데이터 루프 */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#1a1a1a", marginBottom: "1rem", textTransform: "uppercase" }}>
              LIST {searchQuery && <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 400, textTransform: "none", fontSize: 12 }}>— "{searchQuery}" 검색 결과</span>}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loading ? (
                <p style={{ textAlign: "center", color: "#999", fontStyle: "italic", padding: "40px" }}>Fetching Database...</p>
              ) : searchQuery.trim() && searching ? (
                <p style={{ textAlign: "center", color: "#999", fontStyle: "italic", padding: "40px" }}>Searching...</p>
              ) : (() => {
                const filtered = searchQuery.trim() ? (searchResults ?? []) : posts;
                return filtered.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>{searchQuery ? "검색 결과가 없습니다." : "등록된 글이 없습니다."}</p>
                ) : filtered.map((post) => (
                  <div key={post.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* CARD BODY: 네온 블루 보더 강제 적용 */}
                    <div style={{ flex: 1, background: "#0c0c0c", border: `2px solid ${CYAN}`, borderRadius: 24, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", boxShadow: `0 4px 24px rgba(0,0,0,0.5)` }}>
                      <div style={{ width: 72, height: 72, minWidth: 72, borderRadius: "50%", border: `3px solid ${CYAN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 22, fontWeight: 900, fontStyle: "italic" }}>
                        #{post.id}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>{post.category}</p>
                        <p style={{ color: "#fff", fontSize: 16, fontStyle: "italic", fontWeight: 300, margin: 0 }}>{post.title}</p>
                      </div>
                    </div>

                    {/* ACTION BUTTONS: 링크 및 삭제 함수 연결 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <Link href={`/edit/${post.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ width: 110, padding: "0.45rem 0", border: `2px solid ${GOLD}`, background: "#0c0c0c", color: "#fff", fontSize: 11, fontWeight: 700, fontStyle: "italic", borderRadius: 6, cursor: "pointer" }}>EDIT</button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.id, post.title)}
                        style={{ width: 110, padding: "0.45rem 0", border: "2px solid #ef4444", color: "#ef4444", background: "#1a0000", fontSize: 11, fontWeight: 700, fontStyle: "italic", borderRadius: 6, cursor: "pointer" }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
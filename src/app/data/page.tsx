"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BarChart2, TrendingUp, ArrowLeft, Users, ExternalLink } from 'lucide-react';

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";
const BLACK = "#0c0c0c";

interface RankingItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
  view_count: number;
  comment_count: number;
  like_count: number;
  score: number;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [members, setMembers] = useState<{ total: number; google: number; email: number; kakao: number; naver: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin/ranking/top10")
        .then(res => res.json())
        .then(setRanking)
        .catch(console.error)
        .finally(() => setLoading(false));

      fetch("/api/users/count")
        .then(res => res.json())
        .then(setMembers)
        .catch(console.error);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: BLACK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: GOLD, fontStyle: "italic", letterSpacing: "0.2em" }}>FETCHING INSIGHTS...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <div className="dpg-wrap" style={{ fontFamily: "'Georgia', serif", background: "#e8e8e8", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* HEADER */}
        <header className="dpg-header" style={{ background: BLACK, borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="dpg-logo" style={{ width: 56, height: 56, background: `linear-gradient(145deg, ${GOLD}, #a07820)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: BLACK, flexShrink: 0 }}>
              <BarChart2 size={28} />
            </div>
            <div>
              <h1 className="dpg-title" style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>Data Insight.</h1>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>Weekly TOP 10 (하루 2회 갱신)</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => signOut()} style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "0.6rem 1rem", color: "#aaa", fontSize: 11, fontWeight: 700, fontStyle: "italic", cursor: "pointer" }}>Sign Out</button>
            <Link href="/">
              <button style={{ background: "transparent", border: `2px solid ${GOLD}`, borderRadius: 10, padding: "0.6rem 1.4rem", color: GOLD, fontWeight: 700, fontStyle: "italic", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ArrowLeft size={16} /> BACK
              </button>
            </Link>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="dpg-main" style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

          {/* MEMBERS */}
          <div className="dpg-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
            <StatCard icon={<Users size={18} color="#a78bfa" />} title="Total" value={members?.total ?? 0} />
            <StatCard icon={<Users size={18} color="#4285F4" />} title="Google" value={members?.google ?? 0} />
            <StatCard icon={<Users size={18} color="#94a3b8" />} title="Email" value={members?.email ?? 0} />
            <StatCard icon={<Users size={18} color="#FEE500" />} title="Kakao" value={members?.kakao ?? 0} />
            <StatCard icon={<Users size={18} color="#03C75A" />} title="Naver" value={members?.naver ?? 0} />
          </div>

          <section style={{ background: "#fff", padding: "1.5rem", borderRadius: 16, border: "1.5px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", color: BLACK, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} color={CYAN} /> WEEKLY TOP 10
            </h3>
            <div style={{ overflowX: "auto" }}>
            <table className="dpg-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", color: "#888" }}>RANK</th>
                  <th style={{ padding: "0.75rem", color: "#888" }}>TITLE</th>
                  <th style={{ padding: "0.75rem", color: "#888" }}>작성일</th>
                  <th style={{ padding: "0.75rem", color: "#888", textAlign: "right" }}>조회수</th>
                  <th style={{ padding: "0.75rem", color: "#888", textAlign: "right" }}>댓글</th>
                  <th style={{ padding: "0.75rem", color: "#888", textAlign: "right" }}>추천</th>
                  <th style={{ padding: "0.75rem", color: "#888", textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#bbb" }}>데이터 없음</td></tr>
                ) : (
                  ranking.map((post, idx) => (
                    <tr key={post.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 900, color: idx < 3 ? GOLD : "#bbb" }}>{idx + 1}</td>
                      <td style={{ padding: "0.75rem", maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</td>
                      <td style={{ padding: "0.75rem", color: "#999", fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(post.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 900, color: CYAN }}>{post.view_count.toLocaleString()}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700 }}>{post.comment_count.toLocaleString()}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700 }}>{post.like_count.toLocaleString()}</td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <a href={`https://nemoneai.com/posts/${post.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#999" }}>
                          <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </section>
        </main>
      </div>
      <style jsx>{`
        @media (max-width: 640px) {
          .dpg-wrap { padding: 0.75rem !important; }
          .dpg-header { padding: 1rem !important; }
          .dpg-logo { width: 44px !important; height: 44px !important; }
          .dpg-title { font-size: 22px !important; }
          .dpg-main { padding: 1rem !important; }
          .dpg-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, title, value }: any) {
  return (
    <div style={{ background: BLACK, borderRadius: 14, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 6px 20px rgba(0,0,0,0.2)", minWidth: 0 }}>
      <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 9, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: "0.4rem", whiteSpace: "nowrap" }}>
        <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, fontStyle: "italic" }}>{value.toLocaleString()}</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BarChart2, Users, Eye, TrendingUp, ArrowLeft } from 'lucide-react';

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";
const BLACK = "#0c0c0c";

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/analytics/summary")
        .then(res => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
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

  const dailyStats = data?.daily || [];
  const topPosts = data?.top_posts || [];

  // 통계 계산
  const totalViews = topPosts.reduce((acc: number, post: any) => acc + post.views, 0);
  const totalDailyViews = dailyStats.reduce((acc: number, stat: any) => acc + stat.total_views, 0);
  const totalVisitors = dailyStats.reduce((acc: number, stat: any) => acc + stat.visitors, 0);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#e8e8e8", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER */}
        <header style={{ background: BLACK, borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, background: `linear-gradient(145deg, ${GOLD}, #a07820)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: BLACK }}>
              <BarChart2 size={28} />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>Data Insight.</h1>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>Traffic & Content Analytics</p>
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
        <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
          
          {/* OVERVIEW CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <StatCard icon={<Users color={GOLD} />} title="Total Visitors (30d)" value={totalVisitors} color={GOLD} />
            <StatCard icon={<Eye color={CYAN} />} title="Total Content Views" value={totalDailyViews} color={CYAN} />
            <StatCard icon={<TrendingUp color="#10b981" />} title="Accumulated Views" value={totalViews} color="#10b981" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            
            {/* DAILY TRAFFIC TABLE */}
            <section style={{ background: "#fff", padding: "1.5rem", borderRadius: 16, border: "1.5px solid rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", color: BLACK, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart2 size={18} color={GOLD} /> DAILY TRAFFIC (LAST 30 DAYS)
              </h3>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem", color: "#888" }}>DATE</th>
                      <th style={{ padding: "0.75rem", color: "#888" }}>VISITORS</th>
                      <th style={{ padding: "0.75rem", color: "#888" }}>VIEWS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#bbb" }}>No data yet. Tracking started now.</td></tr>
                    ) : (
                      dailyStats.slice().reverse().map((stat: any) => (
                        <tr key={stat.date} style={{ borderBottom: "1px solid #f5f5f5" }}>
                          <td style={{ padding: "0.75rem", fontWeight: 700 }}>{stat.date}</td>
                          <td style={{ padding: "0.75rem", color: GOLD, fontWeight: 900 }}>{stat.visitors}</td>
                          <td style={{ padding: "0.75rem", color: CYAN, fontWeight: 900 }}>{stat.total_views}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOP CONTENT TABLE */}
            <section style={{ background: "#fff", padding: "1.5rem", borderRadius: 16, border: "1.5px solid rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", color: BLACK, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp size={18} color={CYAN} /> TOP PERFORMING CONTENT
              </h3>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem", color: "#888" }}>RANK</th>
                      <th style={{ padding: "0.75rem", color: "#888" }}>TITLE</th>
                      <th style={{ padding: "0.75rem", color: "#888", textAlign: "right" }}>VIEWS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post: any, idx: number) => (
                      <tr key={post.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 900, color: idx < 3 ? GOLD : "#bbb" }}>{idx + 1}</td>
                        <td style={{ padding: "0.75rem", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</td>
                        <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 900, color: CYAN }}>{post.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  return (
    <div style={{ background: BLACK, borderRadius: 20, padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
      <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>{title}</p>
        <p style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: 0, fontStyle: "italic" }}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

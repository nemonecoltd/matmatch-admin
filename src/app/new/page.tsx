"use client";

import { useState, useMemo } from "react"; // useMemo 임포트
import { useRouter } from "next/navigation";
import Link from "next/link"; // Link 임포트 추가
import dynamic from "next/dynamic"; // ReactQuill을 동적으로 임포트
import "react-quill/dist/quill.snow.css"; // ReactQuill 스타일 임포트

// ReactQuill을 클라이언트 컴포넌트로 동적 임포트
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill이 삽입하는 빈 단락 <p><br></p> 제거
const cleanQuillHtml = (html: string) =>
  html.replace(/<p><br\s*\/?><\/p>/gi, '').trim();

// [추가] 이미지 압축 헬퍼 함수
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200; // 가로 최대 1200px로 제한
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // JPEG 품질 0.7(70%)로 압축하여 용량 획기적 절감
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
    };
  });
};

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";
const BLACK = "#0c0c0c";

// ── [보존] 대표님의 스타일 상수 ──────────────────────────────────────
const inputStyle = {
  width: "100%",
  background: "#111",
  border: "2px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "0.85rem 1.1rem",
  color: "#fff",
  fontSize: 12,
  fontFamily: "Georgia, serif",
  fontStyle: "italic",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
};

const labelStyle = {
  fontSize: 9,
  fontWeight: 700,
  color: "#555",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  fontFamily: "Georgia, serif",
  display: "block",
  marginBottom: "0.5rem",
};

export default function NewPost() {
  const router = useRouter(); // [보존] 라우터 사용
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false); // 미리보기 토글 상태 추가
  
  // [보존] 대표님의 원본 formData 구조 100% 유지
  const [formData, setFormData] = useState({
    title: "",
    body_text: "",
    category: "Taste",
    content_type: "YOUTUBE_LONG",
    video_url: "", // [절대고수] 필드명 video_url
    tags: "",
  });

  // 이미지 미리보기 URL 생성
  const previewImageUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  // [보존] 대표님의 업데이트 로직 100% 유지
  const update = (key: string, val: any) => setFormData((p) => ({ ...p, [key]: val }));

  // [보존] 대표님의 handleSubmit 로직 (FormData 단일 전송으로 고정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) =>
        data.append(k, k === 'body_text' ? cleanQuillHtml(v) : v)
      );
      
      if (selectedFile) {
        data.append("image_file", selectedFile);
      }

      const res = await fetch("/api/posts", { 
        method: "POST", 
        body: data 
      });

      if (res.ok) {
        alert("성공적으로 발행되었습니다.");
        router.push("/");
      } else {
        const err = await res.json();
        alert(`저장 실패: ${err.detail || "알 수 없는 오류"}`);
      }
    } catch (err) {
      alert("서버 연결 실패.");
    } finally {
      setLoading(false);
    }
  };

  // [추가] Quill 에디터 모듈 설정 (이미지 압축 핸들러 포함)
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }], 
        [{ 'size': ['small', false, 'large', 'huge'] }], 
        ['bold', 'italic', 'underline', 'strike'], 
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
        [{ 'indent': '-1'}, { 'indent': '+1' }], 
        ['link', 'image'], 
        [{ 'align': [] }], 
        ['clean'] 
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
              const compressedBase64 = await compressImage(file);
              // @ts-ignore
              const range = this.quill.getSelection();
              // @ts-ignore
              this.quill.insertEmbed(range.index, 'image', compressedBase64);
            }
          };
        }
      }
    }
  }), []);

  const focusStyle = (key: string) =>
    focused === key ? { ...inputStyle, borderColor: GOLD } : inputStyle;

  return (
    <div style={{ minHeight: "100vh", background: "#e8e8e8", padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: showPreview ? 1400 : 960, margin: "0 auto", transition: "max-width 0.4s ease-in-out" }}>

        {/* ── [클로드 디자인] TOP HEADER ── */}
        <header style={{ background: BLACK, borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, background: `linear-gradient(145deg, ${GOLD}, #a07820)`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 900, fontStyle: "italic", color: BLACK, boxShadow: `0 0 18px rgba(212,175,55,0.45)` }}>40</div>
            <div>
              <p style={{ color: "#666", fontSize: 10, margin: 0 }}>"use client"</p>
              <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", margin: 0, lineHeight: 1 }}>CMS Desk.</h1>
              <p style={{ color: GOLD, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>네모네AIM Admin System v1.0</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/data">
              <button type="button" style={{ background: "transparent", border: `2px solid ${GOLD}`, borderRadius: 8, padding: "0.5rem 1.1rem", color: GOLD, fontSize: 11, fontWeight: 900, fontStyle: "italic", cursor: "pointer" }}>
                DATA
              </button>
            </Link>
            <button type="button" onClick={() => setShowPreview(!showPreview)} style={{ background: showPreview ? GOLD : "transparent", border: `2px solid ${GOLD}`, borderRadius: 8, padding: "0.5rem 1.1rem", color: showPreview ? BLACK : GOLD, fontSize: 11, fontWeight: 900, fontStyle: "italic", cursor: "pointer", transition: "all 0.2s" }}>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button onClick={() => router.push("/")} style={{ background: "transparent", border: `2px solid rgba(255,255,255,0.2)`, borderRadius: 8, padding: "0.5rem 1.1rem", color: "#aaa", fontSize: 11, fontWeight: 700, fontStyle: "italic", cursor: "pointer" }}>← Back to Admin</button>
          </div>
        </header>

        {/* ── [클로드 디자인] MAIN BODY ── */}
        <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", gap: "2rem" }}>
          
          {/* EDITOR SECTION */}
          <div style={{ flex: 1, border: `1.5px solid ${GOLD}`, borderRadius: 12, padding: "1.75rem" }}>
            
            <div style={{ marginBottom: "1.75rem", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "1rem" }}>
              <p style={{ fontSize: 9, color: "#888", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 0.25rem" }}>NEW ENTRY</p>
              <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: GOLD, letterSpacing: "-0.04em", margin: 0 }}>Create Archive.</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* TITLE */}
                <div>
                  <label style={labelStyle}>Post Title</label>
                  <input required placeholder="Post Title..." value={formData.title} onChange={(e) => update("title", e.target.value)} onFocus={() => setFocused("title")} onBlur={() => setFocused(null)} 
                    style={{ ...focusStyle("title"), fontSize: 22, fontWeight: 700, color: GOLD, background: "transparent", border: "none", borderBottom: focused === "title" ? `2px solid ${GOLD}` : "2px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "0.5rem 0" }} 
                  />
                </div>

                {/* STORY CONTENT (body_text) - [이동] 2번째 순서로 배치 */}
                <div>
                  <label style={labelStyle}>Story Content</label>
                  <ReactQuill 
                    theme="snow"
                    value={formData.body_text}
                    onChange={(content) => update("body_text", content)}
                    modules={quillModules}
                    formats={[
                      'header', 'font', 'size',
                      'bold', 'italic', 'underline', 'strike', 'blockquote',
                      'list', 'bullet', 'indent',
                      'link', 'image', 'align',
                    ]}
                    style={{ ...focusStyle("body"), borderRadius: 12, lineHeight: 1.7, background: "#fff", color: "#333", minHeight: "200px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <div style={{ display: "flex", flexDirection: "column", background: "#0c0c0c", border: `2px solid ${CYAN}`, borderRadius: 16, overflow: "hidden" }}>
                      {["Taste", "Culture", "Life", "Tech"].map((cat) => (
                        <button type="button" key={cat} onClick={() => update("category", cat)} style={{ padding: "0.6rem 1rem", textAlign: "left", background: formData.category === cat ? GOLD : "transparent", color: formData.category === cat ? BLACK : "#aaa", fontSize: 10, fontWeight: 700, fontStyle: "italic", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Content Type</label>
                    <div style={{ display: "flex", flexDirection: "column", background: "#0c0c0c", border: `2px solid ${CYAN}`, borderRadius: 16, overflow: "hidden" }}>
                      {[ { val: "YOUTUBE_LONG", label: "YOUTUBE (16:9)" }, { val: "YOUTUBE_SHORT", label: "SHORTS (9:16)" }, { val: "ARTICLE", label: "ARTICLE" }, { val: "SPOTIFY", label: "SPOTIFY" } ].map(({ val, label }) => (
                        <button type="button" key={val} onClick={() => update("content_type", val)} style={{ padding: "0.6rem 1rem", textAlign: "left", background: formData.content_type === val ? GOLD : "transparent", color: formData.content_type === val ? BLACK : "#aaa", fontSize: 10, fontWeight: 700, fontStyle: "italic", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Media URL</label>
                  <input placeholder="https://..." value={formData.video_url} onChange={(e) => update("video_url", e.target.value)} onFocus={() => setFocused("url")} onBlur={() => setFocused(null)} style={focusStyle("url")} />
                </div>

                <div>
                  <label style={labelStyle}>🖼 Background Image (Optional)</label>
                  <div onClick={() => document.getElementById("img-upload")?.click()} style={{ background: "#111", border: `2px dashed ${selectedFile ? GOLD : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: "1.25rem", textAlign: "center", cursor: "pointer" }}>
                    <p style={{ color: selectedFile ? GOLD : "#444", fontSize: 11, fontStyle: "italic", margin: 0 }}>{selectedFile ? `✓ ${selectedFile.name}` : "클릭하여 이미지 업로드"}</p>
                  </div>
                  <input id="img-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </div>

                <div>
                  <label style={labelStyle}>Tags (Comma separated)</label>
                  <input placeholder="architecture, gourmet..." value={formData.tags} onChange={(e) => update("tags", e.target.value)} onFocus={() => setFocused("tags")} onBlur={() => setFocused(null)} style={focusStyle("tags")} />
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#555" : `linear-gradient(to bottom, ${GOLD}, #a07820)`, color: BLACK, border: "none", borderRadius: 50, padding: "1.1rem", fontSize: 13, fontWeight: 900, fontStyle: "italic", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 4px 20px rgba(212,175,55,0.4)` }}>
                  {loading ? "⏳ Publishing..." : "▶ Publish Archive"}
                </button>
              </div>
            </form>
          </div>

          {/* REAL-TIME PREVIEW SECTION */}
          {showPreview && (
            <div style={{ flex: 1, position: "sticky", top: "2rem", height: "fit-content", background: "#0c0c0c", borderRadius: 16, overflow: "hidden", border: `1px solid rgba(255,255,255,0.1)`, display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#1a1a1a", padding: "0.75rem 1.25rem", borderBottom: `2px solid ${GOLD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: GOLD, fontSize: 10, fontWeight: 900, fontStyle: "italic", letterSpacing: "0.1em" }}>LIVE PREVIEW (Mobile/Tablet View)</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }}></div>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "80vh", paddingBottom: "2rem" }} className="preview-container">
                {/* ── [MatMatch Design Identity 100% Replication] ── */}
                <div style={{ position: "relative", minHeight: "100%", background: "#0c0c0c", color: "#fff", fontStyle: "italic" }}>
                  
                  {/* HERO BACKGROUND */}
                  <div style={{ position: "relative", width: "100%", height: "250px", overflow: "hidden" }}>
                    {previewImageUrl && (
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${previewImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.6 }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, #0c0c0c)" }} />
                  </div>

                  {/* ARTICLE CONTENT */}
                  <div style={{ padding: "0 1.5rem", marginTop: "-50px", position: "relative", zIndex: 1 }}>
                    <p style={{ color: GOLD, fontSize: 9, fontWeight: 900, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{formData.category}</p>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem" }}>{formData.title || "Archive Title..."}</h1>
                    
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1rem 0", marginBottom: "2rem", display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.4 }}>
                      <span>by 탐험대장</span>
                      <span>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    {/* BODY TEXT with DROP CAP emulation */}
                    <div style={{ color: "#ccc", lineHeight: 1.8, fontSize: "16px", fontStyle: "normal" }}>
                      {/* 뷰어 페이지와 100% 동일한 CSS 클래스 적용 */}
                      <div dangerouslySetInnerHTML={{ __html: formData.body_text || "<p>Please write your story content...</p>" }} className="text-gray-200 leading-[1.9] text-lg md:text-xl space-y-10 max-w-7xl mx-auto prose-custom font-light tracking-wide not-italic" />
                    </div>

                    {/* TAGS */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "2rem" }}>
                      {formData.tags.split(',').map((tag, i) => tag.trim() && (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: 50, border: `1px solid ${GOLD}44`, background: `${GOLD}11`, color: GOLD, fontSize: "9px", fontWeight: 900 }}># {tag.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`
        .preview-body p:first-of-type::first-letter {
          float: left;
          font-size: 4rem;
          line-height: 1;
          padding-right: 8px;
          color: ${GOLD};
          font-weight: 900;
          font-style: italic;
        }
        .preview-body p {
          margin-bottom: 0.75rem;
          white-space: pre-wrap;
        }
        .preview-body br {
          display: none; /* 엔터 2칸 방지 */
        }
        .preview-container::-webkit-scrollbar { width: 4px; }
        .preview-container::-webkit-scrollbar-thumb { background: ${GOLD}44; border-radius: 10px; }
      `}</style>
    </div>
  );
}

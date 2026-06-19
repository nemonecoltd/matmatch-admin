"use client";

import { useEffect, useState, useMemo } from "react"; // useMemo 임포트
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
        
        // JPEG 품질 0.7(70%)로 압축
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
    };
  });
};

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";
const BLACK = "#0c0c0c";

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

export default function EditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  // 1. [필드 무결성] 원본 state를 video_url 포함 구조로 확장
  const [formData, setFormData] = useState({
    title: "",
    body_text: "",
    category: "Taste",
    content_type: "YOUTUBE_LONG",
    video_url: "", 
    tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false); // 미리보기 토글 상태 추가

  // 이미지 미리보기 URL 생성 (새로 업로드한 파일 우선)
  const previewImageUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    return null; // 기존 이미지는 API에서 가져와야 하지만, 현재 구조상 URL만 알 수 없음
  }, [selectedFile]);

  const update = (key: string, val: any) => setFormData((p) => ({ ...p, [key]: val }));

  // 2. [데이터 페칭] 서버 데이터를 formData 구조로 정밀 바인딩
  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setFormData({
          title: data.title || "",
          body_text: cleanQuillHtml(data.body_text || ""),
          category: data.category || "Taste",
          content_type: data.content_type || "YOUTUBE_LONG",
          video_url: data.video_url || "",
          tags: data.tags || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        alert("데이터를 불러오지 못했습니다.");
        router.push("/");
      });
  }, [id, router]);

  // 3. [전송 방식] 무조건 FormData 단일 전송 (백엔드 Form 인자 규격에 맞춤)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) =>
        data.append(k, k === 'body_text' ? cleanQuillHtml(v) : v)
      );
      
      // 새로 선택한 이미지 파일이 있다면 추가
      if (selectedFile) {
        data.append("image_file", selectedFile);
      }

      const res = await fetch(`/api/posts/${id}`, { 
        method: "PUT", 
        body: data 
      });

      if (res.ok) {
        alert("성공적으로 수정되었습니다.");
        router.push("/");
      } else {
        const err = await res.json();
        alert(`수정 실패: ${err.detail || "서버 응답 오류"}`);
      }
    } catch (err) {
      alert("서버 통신 에러");
    } finally {
      setSaving(false);
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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BLACK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: GOLD, fontStyle: "italic", letterSpacing: "0.2em" }}>INITIALIZING CSR...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#e8e8e8", padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: showPreview ? 1400 : 960, margin: "0 auto", transition: "max-width 0.4s ease-in-out" }}>
        
        {/* HEADER */}
        <header style={{ background: BLACK, borderBottom: `4px solid ${GOLD}`, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, background: `linear-gradient(145deg, ${GOLD}, #a07820)`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 900, color: BLACK }}>✎</div>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, fontStyle: "italic", margin: 0 }}>Edit Archive.</h1>
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
            <button onClick={() => router.push("/")} style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#aaa", cursor: "pointer" }}>← Cancel</button>
          </div>
        </header>

        <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", gap: "2rem" }}>
          
          {/* EDITOR SECTION */}
          <div style={{ flex: 1, border: `1.5px solid ${GOLD}`, borderRadius: 12, padding: "1.75rem" }}>
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "right", marginBottom: "-1rem" }}>
                <span style={{ color: CYAN, fontSize: 10, fontWeight: 900 }}>ENTRY #{id}</span>
              </div>

              <input required value={formData.title} onChange={(e) => update("title", e.target.value)} onFocus={() => setFocused("title")} onBlur={() => setFocused(null)} style={{ ...inputStyle, fontSize: 20, fontWeight: 700, color: GOLD, background: "transparent", border: "none", borderBottom: focused === "title" ? `2px solid ${GOLD}` : "2px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "0.5rem 0" }} />

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
                  style={{ borderRadius: 12, lineHeight: 1.7, background: "#fff", color: "#333", minHeight: "200px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", background: "#0c0c0c", border: `2px solid ${CYAN}`, borderRadius: 16, overflow: "hidden" }}>
                  {["Taste", "Culture", "Life", "Tech"].map((cat) => (
                    <button type="button" key={cat} onClick={() => update("category", cat)} style={{ padding: "0.6rem", background: formData.category === cat ? GOLD : "transparent", color: formData.category === cat ? BLACK : "#555", border: "none", cursor: "pointer", fontSize: 9 }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", background: "#0c0c0c", border: `2px solid ${CYAN}`, borderRadius: 16, overflow: "hidden" }}>
                  {["YOUTUBE_LONG", "YOUTUBE_SHORT", "ARTICLE", "SPOTIFY"].map((type) => (
                    <button type="button" key={type} onClick={() => update("content_type", type)} style={{ padding: "0.6rem", background: formData.content_type === type ? GOLD : "transparent", color: formData.content_type === type ? BLACK : "#555", border: "none", cursor: "pointer", fontSize: 9 }}>{type}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Media URL</label>
                <input value={formData.video_url} onChange={(e) => update("video_url", e.target.value)} onFocus={() => setFocused("url")} onBlur={() => setFocused(null)} style={focusStyle("url")} />
              </div>

              <div>
                <label style={labelStyle}>🖼 Background Image</label>
                <div onClick={() => document.getElementById("img-edit")?.click()} style={{ background: "#111", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "1.25rem", textAlign: "center", cursor: "pointer" }}>
                  <p style={{ color: selectedFile ? GOLD : "#444", fontSize: 11 }}>{selectedFile ? selectedFile.name : "Change Image"}</p>
                </div>
                <input id="img-edit" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>

              <div>
                <label style={labelStyle}>Tags</label>
                <input value={formData.tags} onChange={(e) => update("tags", e.target.value)} onFocus={() => setFocused("tags")} onBlur={() => setFocused(null)} style={focusStyle("tags")} />
              </div>

              <button type="submit" disabled={saving} style={{ background: saving ? "#555" : `linear-gradient(to bottom, ${GOLD}, #a07820)`, color: BLACK, border: "none", borderRadius: 50, padding: "1.1rem", fontWeight: 900, fontStyle: "italic", cursor: "pointer" }}>
                {saving ? "⏳ Updating..." : "✎ Update Database"}
              </button>
            </form>
          </div>

          {/* REAL-TIME PREVIEW SECTION */}
          {showPreview && (
            <div style={{ flex: 1, position: "sticky", top: "2rem", height: "fit-content", background: "#0c0c0c", borderRadius: 16, overflow: "hidden", border: `1px solid rgba(255,255,255,0.1)`, display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#1a1a1a", padding: "0.75rem 1.25rem", borderBottom: `2px solid ${GOLD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: GOLD, fontSize: 10, fontWeight: 900, fontStyle: "italic", letterSpacing: "0.1em" }}>LIVE PREVIEW (Editing Entry #{id})</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }}></div>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "80vh", paddingBottom: "2rem" }} className="preview-container">
                <div style={{ position: "relative", minHeight: "100%", background: "#0c0c0c", color: "#fff", fontStyle: "italic" }}>
                  
                  {/* HERO BACKGROUND (새 이미지 업로드 시에만 표시) */}
                  <div style={{ position: "relative", width: "100%", height: "250px", overflow: "hidden" }}>
                    {previewImageUrl ? (
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${previewImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.6 }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "12px" }}>Current Background Active</div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, #0c0c0c)" }} />
                  </div>

                  {/* ARTICLE CONTENT */}
                  <div style={{ padding: "0 1.5rem", marginTop: "-50px", position: "relative", zIndex: 1 }}>
                    <p style={{ color: GOLD, fontSize: 9, fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>{formData.category}</p>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem" }}>{formData.title || "Archive Title..."}</h1>
                    
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1rem 0", marginBottom: "2rem", display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.4 }}>
                      <span>by 탐험대장</span>
                      <span>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div style={{ color: "#ccc", lineHeight: 1.8, fontSize: "16px", fontStyle: "normal" }}>
                      {/* 뷰어 페이지와 100% 동일한 CSS 클래스 적용 */}
                      <div dangerouslySetInnerHTML={{ __html: formData.body_text || "<p>Loading content...</p>" }} className="text-gray-200 leading-[1.9] text-lg md:text-xl space-y-10 max-w-7xl mx-auto prose-custom font-light tracking-wide not-italic" />
                    </div>

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

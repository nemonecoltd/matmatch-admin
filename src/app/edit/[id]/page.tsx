"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { mdToHtml, wrapMdBlock, extractMdBlocks, extractMdTitle } from "@/utils/markdown";

// ReactQuill을 클라이언트 컴포넌트로 동적 임포트
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false }) as any;

// Quill이 삽입하는 빈 단락 <p><br></p> 제거
const cleanQuillHtml = (html: string) =>
  html.replace(/<p><br\s*\/?><\/p>/gi, '').trim();

// [추가] 이미지 압축 헬퍼 함수
const compressThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
      };
    };
  });
};

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
  const [mdBlocksHtml, setMdBlocksHtml] = useState("");
  const [mdFileName, setMdFileName] = useState("");

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
        const { quillHtml, mdBlocksHtml: extractedMd } = extractMdBlocks(data.body_text || "");
        setFormData({
          title: data.title || "",
          body_text: cleanQuillHtml(quillHtml),
          category: data.category || "Taste",
          content_type: data.content_type || "YOUTUBE_LONG",
          video_url: data.video_url || "",
          tags: data.tags || "",
        });
        setMdBlocksHtml(extractedMd);
        if (extractedMd) setMdFileName("기존 첨부 콘텐츠");
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
      const finalBody = cleanQuillHtml(formData.body_text) + wrapMdBlock(mdBlocksHtml);
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) =>
        data.append(k, k === 'body_text' ? finalBody : v)
      );

      // 새로 선택한 이미지 파일이 있다면 추가
      if (selectedFile) {
        const compressed = await compressThumbnail(selectedFile);
        data.append("image_file", compressed, selectedFile.name.replace(/\.[^.]+$/, ".jpg"));
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

  const handleMdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMdBlocksHtml(mdToHtml(text));
    setMdFileName(file.name);
    // MD 파일의 H1을 Title 입력란에 자동 채움 — 기존 제목이 있으면 덮어쓰지 않음(수정 화면이라
    // 이미 있는 제목을 새 MD 첨부만으로 밀어버리면 안 됨), 채워진 뒤에도 자유롭게 수정 가능
    if (!formData.title.trim()) {
      const extractedTitle = extractMdTitle(text);
      if (extractedTitle) update("title", extractedTitle);
    }
    e.target.value = "";
  };

  const combinedPreviewHtml = formData.body_text + wrapMdBlock(mdBlocksHtml);

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
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="submit" form="editForm" disabled={saving} style={{ background: saving ? "#555" : `linear-gradient(to bottom, ${GOLD}, #a07820)`, color: BLACK, border: "none", borderRadius: 8, padding: "0.5rem 1.2rem", fontSize: 12, fontWeight: 900, fontStyle: "italic", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : `0 4px 14px rgba(212,175,55,0.35)` }}>
              {saving ? "⏳ ..." : "✎ Update Database"}
            </button>
            <button type="button" onClick={() => router.push("/")} style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "0.5rem 1.1rem", color: "#aaa", fontSize: 11, fontWeight: 700, fontStyle: "italic", cursor: "pointer" }}>← Cancel</button>
          </div>
        </header>

        <main style={{ background: "#f5f5f0", borderRadius: "0 0 16px 16px", padding: "2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", gap: "2rem" }}>

          {/* EDITOR SECTION */}
          <div style={{ flex: 1, border: `1.5px solid ${GOLD}`, borderRadius: 12, padding: "1.75rem" }}>
            <form id="editForm" onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* 카테고리 + 컨텐츠타입 콤보 + Preview 토글 */}
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "1rem" }}>
                <select value={formData.category} onChange={(e) => update("category", e.target.value)}
                  style={{ background: "#0c0c0c", border: `1.5px solid ${GOLD}`, borderRadius: 8, color: GOLD, fontSize: 11, fontWeight: 700, padding: "0.45rem 0.7rem", cursor: "pointer", fontStyle: "italic", outline: "none" }}>
                  {["Taste", "Culture", "Life", "Tech"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={formData.content_type} onChange={(e) => update("content_type", e.target.value)}
                  style={{ background: "#0c0c0c", border: `1.5px solid ${CYAN}`, borderRadius: 8, color: CYAN, fontSize: 11, fontWeight: 700, padding: "0.45rem 0.7rem", cursor: "pointer", fontStyle: "italic", outline: "none" }}>
                  {[{ val: "YOUTUBE_LONG", label: "YOUTUBE (16:9)" }, { val: "YOUTUBE_SHORT", label: "SHORTS (9:16)" }, { val: "ARTICLE", label: "ARTICLE" }, { val: "SPOTIFY", label: "SPOTIFY" }].map(({ val, label }) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <span style={{ color: CYAN, fontSize: 10, fontWeight: 900 }}>#{id}</span>
                <button type="button" onClick={() => setShowPreview(!showPreview)} style={{ marginLeft: "auto", background: showPreview ? GOLD : "transparent", border: `2px solid ${GOLD}`, borderRadius: 8, padding: "0.45rem 1.1rem", color: showPreview ? BLACK : GOLD, fontSize: 11, fontWeight: 900, fontStyle: "italic", cursor: "pointer", transition: "all 0.2s" }}>
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              <input required value={formData.title} onChange={(e) => update("title", e.target.value)} onFocus={() => setFocused("title")} onBlur={() => setFocused(null)} style={{ ...inputStyle, fontSize: 20, fontWeight: 700, color: GOLD, background: "transparent", border: "none", borderBottom: focused === "title" ? `2px solid ${GOLD}` : "2px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "0.5rem 0" }} />

              {/* STORY CONTENT (body_text) */}
              <div>
                <label style={labelStyle}>Story Content</label>
                <ReactQuill
                  theme="snow"
                  value={formData.body_text}
                  onChange={(content: string) => update("body_text", content)}
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

              <div>
                <label style={labelStyle}>📄 MD 첨부 (표·박스 등) — 본문 뒤에 추가됩니다</label>
                <div onClick={() => document.getElementById("md-edit-upload")?.click()} style={{ background: "#111", border: `2px dashed ${mdFileName ? GOLD : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: "1.25rem", textAlign: "center", cursor: "pointer" }}>
                  <p style={{ color: mdFileName ? GOLD : "#444", fontSize: 11, fontStyle: "italic", margin: 0 }}>{mdFileName ? `✓ ${mdFileName}` : "클릭하여 .md 파일 업로드"}</p>
                </div>
                <input id="md-edit-upload" type="file" accept=".md,.markdown,text/markdown" style={{ display: "none" }} onChange={handleMdUpload} />
                {mdBlocksHtml && (
                  <button type="button" onClick={() => { setMdBlocksHtml(""); setMdFileName(""); }} style={{ marginTop: "0.5rem", background: "transparent", border: "1px solid rgba(255,0,0,0.3)", borderRadius: 8, padding: "0.4rem 0.8rem", color: "#e87", fontSize: 10, cursor: "pointer" }}>
                    MD 첨부 제거
                  </button>
                )}
              </div>

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
                      <div dangerouslySetInnerHTML={{ __html: combinedPreviewHtml || "<p>Loading content...</p>" }} className="text-gray-200 leading-[1.9] text-lg md:text-xl space-y-10 max-w-7xl mx-auto prose-custom font-light tracking-wide not-italic" />
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const GOLD = "#D4AF37";
const CYAN = "#22d3ee";
const BLACK = "#0c0c0c";

const focusStyle = (field: string) => ({
  width: "100%", background: "#fff", border: `2px solid rgba(0,0,0,0.1)`, 
  borderRadius: 12, padding: "1rem", fontSize: 14, color: "#333", 
  transition: "all 0.3s ease", outline: "none",
  boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
});

const labelStyle = { display: "block", fontSize: 11, fontWeight: 800, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "0.5rem" };

export default function NewSpecialPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    is_main: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  
  // 포스트 선택 관련 상태
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);

  // 권한 체크 및 초기 데이터 로드
  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, router]);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setAvailablePosts(Array.isArray(data) ? data : (data.posts || []));
    } catch (e) {
      console.error(e);
    }
  };

  const update = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  // 파일 선택 시 미리보기 적용
  useEffect(() => {
    if (!selectedFile) { setPreviewImageUrl(""); return; }
    const objUrl = URL.createObjectURL(selectedFile);
    setPreviewImageUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [selectedFile]);

  // 포스트 선택 핸들러
  const handleAddPost = (post: any) => {
    if (selectedPosts.length >= 20) {
      alert("최대 20개의 기사만 묶을 수 있습니다.");
      return;
    }
    if (selectedPosts.find(p => p.id === post.id)) return; // 중복 방지
    // 새로 추가하는 기사가 공개 페이지 맨 위에 오도록 앞에 넣는다(순서=표시 순서)
    setSelectedPosts([post, ...selectedPosts]);
    setSearchTerm("");
    setIsSearching(false);
  };

  const handleRemovePost = (postId: number) => {
    setSelectedPosts(selectedPosts.filter(p => p.id !== postId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...selectedPosts];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setSelectedPosts(newArr);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedPosts.length - 1) return;
    const newArr = [...selectedPosts];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setSelectedPosts(newArr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("제목을 입력해주세요.");
    if (!selectedFile) return alert("상단 배경 이미지를 업로드해주세요.");
    if (selectedPosts.length === 0) return alert("최소 1개의 기사를 선택해주세요.");

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("tags", formData.tags);
    data.append("is_main", formData.is_main.toString());
    
    // 선택된 포스트의 ID만 배열로 추출하여 JSON 텍스트로 저장
    const postIds = selectedPosts.map(p => p.id);
    data.append("post_ids", JSON.stringify(postIds));

    data.append("image_file", selectedFile);

    try {
      const res = await fetch("/api/specials", { method: "POST", body: data });
      if (res.ok) {
        alert("성공적으로 스페셜이 생성되었습니다!");
        router.push("/special");
      } else {
        alert("업로드 실패. 다시 시도해주세요.");
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailablePosts = availablePosts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedPosts.find(sp => sp.id === p.id)
  );

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f5f0", minHeight: "100vh", padding: "2rem" }}>
      
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "2px solid rgba(0,0,0,0.05)", paddingBottom: "1rem" }}>
        <div>
          <Link href="/special" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer", letterSpacing: "0.1em" }}>← BACK TO LIST</span>
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", margin: "0.5rem 0 0", color: "#111", letterSpacing: "-0.05em" }}>CREATE NEW SPECIAL.</h1>
        </div>
        <button disabled={loading} onClick={handleSubmit} style={{ background: loading ? "#ccc" : "#27c93f", color: "#fff", border: "none", padding: "0.8rem 2rem", borderRadius: 50, fontSize: 13, fontWeight: 900, fontStyle: "italic", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(39,201,63,0.3)" }}>
          {loading ? "SAVING..." : "PUBLISH SPECIAL"}
        </button>
      </header>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        
        {/* LEFT: FORM SECTION */}
        <div style={{ flex: 1, border: `1.5px solid #27c93f`, borderRadius: 12, padding: "1.75rem", background: "#fff" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div>
              <label style={labelStyle}>Special Title</label>
              <input required placeholder="Enter special series title..." value={formData.title} onChange={(e) => update("title", e.target.value)} 
                style={{ ...focusStyle("title"), fontSize: 22, fontWeight: 700, color: "#111", background: "transparent", border: "none", borderBottom: `2px solid rgba(0,0,0,0.1)`, borderRadius: 0, padding: "0.5rem 0" }} 
              />
            </div>

            <div>
              <label style={labelStyle}>Short Description</label>
              <textarea required placeholder="Briefly describe this special series..." value={formData.description} onChange={(e) => update("description", e.target.value)} 
                style={{ ...focusStyle("desc"), minHeight: "80px", resize: "vertical" }} 
              />
            </div>

            <div>
              <label style={labelStyle}>Tags (Comma separated)</label>
              <input placeholder="ex: popup, seongsu, hotplace..." value={formData.tags} onChange={(e) => update("tags", e.target.value)} 
                style={{ ...focusStyle("tags") }} 
              />
            </div>

            <div>
              <label style={labelStyle}>🖼 Top Background Image (Required)</label>
              <div onClick={() => document.getElementById("img-upload")?.click()} style={{ background: "#f9f9f9", border: `2px dashed ${selectedFile ? "#27c93f" : "#ddd"}`, borderRadius: 12, padding: "1.5rem", textAlign: "center", cursor: "pointer" }}>
                <p style={{ color: selectedFile ? "#27c93f" : "#888", fontSize: 13, fontStyle: "italic", fontWeight: "bold", margin: 0 }}>
                  {selectedFile ? `✓ ${selectedFile.name} (Click to change)` : "+ Upload Image"}
                </p>
              </div>
              <input id="img-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", padding: "1rem", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <input type="checkbox" id="is_main" checked={formData.is_main === 1} onChange={(e) => update("is_main", e.target.checked ? 1 : 0)} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <label htmlFor="is_main" style={{ fontSize: 13, fontWeight: "bold", color: "#166534", cursor: "pointer", margin: 0 }}>메인 페이지(랭킹 위) 스페셜 박스에 노출하기</label>
            </div>

            <hr style={{ border: "0", borderBottom: "1px solid #eee", margin: "1rem 0" }} />

            {/* RELATED POSTS SECTION */}
            <div>
              <label style={labelStyle}>묶음 기사 리스트 ({selectedPosts.length} / 20)</label>
              
              {/* Selected Posts List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {selectedPosts.map((post, idx) => (
                  <div key={post.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#fafafa", padding: "0.75rem", borderRadius: 8, border: "1px solid #eaeaea" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <button type="button" onClick={() => handleMoveUp(idx)} disabled={idx === 0} style={{ padding: 2, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, border: "none", background: "none" }}>▲</button>
                      <button type="button" onClick={() => handleMoveDown(idx)} disabled={idx === selectedPosts.length - 1} style={{ padding: 2, cursor: idx === selectedPosts.length - 1 ? "default" : "pointer", opacity: idx === selectedPosts.length - 1 ? 0.3 : 1, border: "none", background: "none" }}>▼</button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 10, color: GOLD, fontWeight: "bold" }}>{post.category}</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</p>
                    </div>
                    <button type="button" onClick={() => handleRemovePost(post.id)} style={{ padding: "0.5rem", color: "#ef4444", background: "#fee2e2", border: "none", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>Remove</button>
                  </div>
                ))}
                {selectedPosts.length === 0 && (
                  <p style={{ fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center", padding: "1rem", background: "#f9f9f9", borderRadius: 8 }}>아직 선택된 기사가 없습니다.</p>
                )}
              </div>

              {/* Add Post UI */}
              {selectedPosts.length < 20 && (
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    placeholder="기사 제목으로 검색하여 추가..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsSearching(true); }}
                    onFocus={() => setIsSearching(true)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #ccc", outline: "none" }}
                  />
                  {isSearching && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", borderRadius: 8, marginTop: 4, maxHeight: 250, overflowY: "auto", zIndex: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
                      <div style={{ padding: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setIsSearching(false)} style={{ fontSize: 10, background: "none", border: "none", cursor: "pointer" }}>닫기 ✕</button>
                      </div>
                      {filteredAvailablePosts.length === 0 ? (
                        <p style={{ padding: "1rem", textAlign: "center", color: "#999", fontSize: 12 }}>검색 결과가 없습니다.</p>
                      ) : (
                        filteredAvailablePosts.map(post => (
                          <div key={post.id} onClick={() => handleAddPost(post)} style={{ padding: "0.75rem", borderBottom: "1px solid #eee", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontSize: 10, color: GOLD, fontWeight: "bold", minWidth: 50 }}>{post.category}</span>
                            <span style={{ fontSize: 13, color: "#333", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</span>
                            <span style={{ fontSize: 10, color: "#27c93f", fontWeight: "bold", background: "#f0fdf4", padding: "2px 6px", borderRadius: 4 }}>+ 추가</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* RIGHT: PREVIEW SECTION */}
        <div style={{ flex: 1, position: "sticky", top: "2rem", background: "#0c0c0c", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", height: "fit-content" }}>
          <div style={{ background: "#1a1a1a", padding: "0.75rem 1.25rem", borderBottom: `2px solid #27c93f`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#27c93f", fontSize: 10, fontWeight: 900, fontStyle: "italic", letterSpacing: "0.1em" }}>SPECIAL PREVIEW (Mobile)</span>
          </div>
          
          <div style={{ overflowY: "auto", maxHeight: "80vh" }}>
            <div style={{ position: "relative", minHeight: "100%", background: "#0c0c0c", color: "#fff" }}>
              
              {/* Background */}
              <div style={{ position: "relative", width: "100%", height: "300px", overflow: "hidden" }}>
                {previewImageUrl ? (
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${previewImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "#222" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(12,12,12,0) 0%, rgba(12,12,12,1) 100%)" }} />
              </div>

              {/* Content */}
              <div style={{ position: "relative", zIndex: 10, marginTop: "-120px", padding: "0 1.5rem 2rem" }}>
                <div style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: "1rem", fontStyle: "italic" }}>
                  Special Series
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", lineHeight: 1.1, marginBottom: "1rem", color: "#fff" }}>
                  {formData.title || "Special Title Here"}
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  {formData.description || "Description will be previewed here..."}
                </p>

                {/* Tags Preview */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                  {formData.tags.split(',').map((tag, i) => tag.trim() && (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 50, border: `1px solid ${GOLD}44`, background: `${GOLD}11`, color: GOLD, fontSize: "9px", fontWeight: 900, textTransform: "uppercase" }}># {tag.trim()}</span>
                  ))}
                </div>

                {/* List Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {selectedPosts.map((post, idx) => (
                    <div key={post.id} style={{ display: "flex", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "rgba(212,175,55,0.3)", fontStyle: "italic" }}>0{idx + 1}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: 9, color: GOLD, background: "rgba(212,175,55,0.1)", padding: "2px 6px", borderRadius: 4, width: "fit-content", fontWeight: 900 }}>{post.category}</span>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: "bold", fontStyle: "italic", color: "#eee" }}>{post.title}</p>
                      </div>
                    </div>
                  ))}
                  {selectedPosts.length === 0 && (
                    <p style={{ color: "#666", fontSize: 12, fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>선택된 기사가 여기에 표시됩니다.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

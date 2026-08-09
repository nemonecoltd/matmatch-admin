import { marked } from "marked";

// MD 첨부 블록을 본문 HTML 안에서 식별하기 위한 마커.
// 주석이므로 안의 HTML 구조(테이블 등)가 어떻든 정규식으로 안전하게 추출 가능.
const MD_BLOCK_START = "<!--md-import-->";
const MD_BLOCK_END = "<!--/md-import-->";
const MD_BLOCK_REGEX = /<!--md-import-->([\s\S]*?)<!--\/md-import-->/g;

// MD 파일 맨 앞의 H1("# 제목")을 제거 — admin Title 필드와 중복 표시되는 것 방지.
// 첫 줄(공백 제외)이 H1일 때만 제거하며, 본문 중간의 H1은 실제 소제목일 수 있어 건드리지 않음.
function stripLeadingH1(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && /^#\s+\S/.test(lines[i])) {
    lines.splice(i, 1);
    while (i < lines.length && lines[i].trim() === "") lines.splice(i, 1);
  }
  return lines.join("\n");
}

export function mdToHtml(markdown: string): string {
  return marked.parse(stripLeadingH1(markdown), { gfm: true, breaks: false }) as string;
}

// MD 파일 맨 앞 H1("# 제목")을 Title 입력란 자동 채움용으로 추출.
// stripLeadingH1과 같은 "첫 비어있지 않은 줄이 H1인지" 판정을 공유하되, 여기선 제거 대신 텍스트만 반환.
export function extractMdTitle(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && /^#\s+\S/.test(lines[i])) {
    return lines[i].replace(/^#\s+/, "").trim();
  }
  return null;
}

export function wrapMdBlock(html: string): string {
  if (!html) return "";
  return `${MD_BLOCK_START}<div class="md-import-block">${html}</div>${MD_BLOCK_END}`;
}

// 저장된 body_text에서 MD 첨부 블록(들)을 분리해 Quill용 HTML과 따로 반환.
// Quill은 table 등 구조를 모르기 때문에, 절대 MD 블록을 Quill value로 넘기면 안 됨.
export function extractMdBlocks(bodyHtml: string): { quillHtml: string; mdBlocksHtml: string } {
  let mdBlocksHtml = "";
  const quillHtml = (bodyHtml || "").replace(MD_BLOCK_REGEX, (_match, inner) => {
    mdBlocksHtml += inner;
    return "";
  });
  return { quillHtml, mdBlocksHtml };
}

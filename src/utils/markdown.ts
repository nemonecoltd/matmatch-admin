import { marked } from "marked";

// MD 첨부 블록을 본문 HTML 안에서 식별하기 위한 마커.
// 주석이므로 안의 HTML 구조(테이블 등)가 어떻든 정규식으로 안전하게 추출 가능.
const MD_BLOCK_START = "<!--md-import-->";
const MD_BLOCK_END = "<!--/md-import-->";
const MD_BLOCK_REGEX = /<!--md-import-->([\s\S]*?)<!--\/md-import-->/g;

// 앞부분의 공백/줄바꿈과, 작성자가 남겨둔 HTML 주석(<!-- 발행 위치/목적/데이터 기준 메모 등 -->)을
// 몇 개든 건너뛰어 실제 콘텐츠(H1 등)가 시작하는 인덱스를 찾음. 주석이 닫히지 않았으면(오타 등)
// 안전하게 그 자리에서 멈춤 — 잘못된 파싱으로 본문을 통째로 날리는 사고 방지.
function findContentStart(markdown: string): number {
  let i = 0;
  while (i < markdown.length) {
    const rest = markdown.slice(i);
    const wsMatch = rest.match(/^[ \t\r\n]+/);
    if (wsMatch) { i += wsMatch[0].length; continue; }
    if (rest.startsWith("<!--")) {
      const end = rest.indexOf("-->");
      if (end === -1) break;
      i += end + 3;
      continue;
    }
    break;
  }
  return i;
}

// MD 파일 맨 앞의 H1("# 제목")을 제거 — admin Title 필드와 중복 표시되는 것 방지.
// 앞의 공백/주석을 건너뛴 뒤 첫 줄이 H1일 때만 제거하며, 본문 중간의 H1은 실제 소제목일 수 있어 건드리지 않음.
function stripLeadingH1(markdown: string): string {
  const start = findContentStart(markdown);
  const before = markdown.slice(0, start);
  const afterLines = markdown.slice(start).split(/\r?\n/);
  if (afterLines.length && /^#\s+\S/.test(afterLines[0])) {
    afterLines.splice(0, 1);
    while (afterLines.length && afterLines[0].trim() === "") afterLines.splice(0, 1);
    return before + afterLines.join("\n");
  }
  return markdown;
}

export function mdToHtml(markdown: string): string {
  return marked.parse(stripLeadingH1(markdown), { gfm: true, breaks: false }) as string;
}

// MD 파일 맨 앞 H1("# 제목")을 Title 입력란 자동 채움용으로 추출.
// stripLeadingH1과 같은 findContentStart를 공유하되, 여기선 제거 대신 텍스트만 반환.
export function extractMdTitle(markdown: string): string | null {
  const start = findContentStart(markdown);
  const afterLines = markdown.slice(start).split(/\r?\n/);
  if (afterLines.length && /^#\s+\S/.test(afterLines[0])) {
    return afterLines[0].replace(/^#\s+/, "").trim();
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

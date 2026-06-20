import { marked } from "marked";

// MD 첨부 블록을 본문 HTML 안에서 식별하기 위한 마커.
// 주석이므로 안의 HTML 구조(테이블 등)가 어떻든 정규식으로 안전하게 추출 가능.
const MD_BLOCK_START = "<!--md-import-->";
const MD_BLOCK_END = "<!--/md-import-->";
const MD_BLOCK_REGEX = /<!--md-import-->([\s\S]*?)<!--\/md-import-->/g;

export function mdToHtml(markdown: string): string {
  return marked.parse(markdown, { gfm: true, breaks: false }) as string;
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

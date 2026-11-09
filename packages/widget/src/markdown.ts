import { marked } from 'marked';

// Configure marked with GitHub Flavored Markdown and automatic line breaks
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, text }) {
      const safeHref = href.startsWith('javascript:') ? '#' : href;
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  },
});

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
}

/**
 * Parses markdown string to sanitized HTML string.
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const rawHtml = marked.parse(content) as string;
    return sanitizeHtml(rawHtml);
  } catch (err) {
    console.warn('[Schedulux Widget] Markdown parse error:', err);
    return content;
  }
}


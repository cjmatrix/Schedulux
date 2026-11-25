import { marked } from 'marked';

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, text }) {
      const safeHref = href.startsWith('javascript:') ? '#' : href;
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr} class="text-indigo-600 underline font-medium hover:text-indigo-700">${text}</a>`;
    },
  },
});

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
}

export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const rawHtml = marked.parse(content) as string;
    return sanitizeHtml(rawHtml);
  } catch (err) {
    console.warn('[Markdown Parser] Parse error:', err);
    return content;
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe formatting tags and removes any scripts
 */

export function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) return null;

  // Define allowed tags and attributes
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote'];
  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'title']
  };

  // Create a temporary container for parsing
  const container = `<div>${html}</div>`;
  
  // Basic regex-based sanitization
  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '');

  // Remove disallowed tags but keep content
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // For allowed tags, keep them but clean attributes
      if (tag.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href=["']([^"']*?)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '#';
        // Only allow safe URLs
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/') || href.startsWith('#')) {
          const titleMatch = match.match(/title=["']([^"']*?)["']/i);
          const title = titleMatch ? ` title="${titleMatch[1]}"` : '';
          return `<a href="${href}"${title}>`;
        }
        return '<a>';
      }
      return match;
    }
    return '';
  });

  // Remove any remaining event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Trim and return
  return sanitized.trim() || null;
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

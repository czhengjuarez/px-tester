import DOMPurify from 'dompurify';

export default function SafeHTML({ html, className = '' }) {
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return (
    <div 
      className={`prose prose-gray dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}

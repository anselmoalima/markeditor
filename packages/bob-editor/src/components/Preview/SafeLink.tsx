import type React from 'react';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: React.ReactNode;
}

function isExternalUrl(href: string): boolean {
  try {
    const url = new URL(href, 'https://example.com');
    return url.origin !== 'https://example.com';
  } catch {
    return false;
  }
}

function sanitizeHref(href: string | undefined): string {
  if (!href) return '#';
  const lower = href.toLowerCase().trim();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return '#';
  return href;
}

export function SafeLink({ href, children, ...rest }: SafeLinkProps): JSX.Element {
  const safeHref = sanitizeHref(href);
  const external = safeHref !== '#' && isExternalUrl(safeHref);

  return (
    <a
      href={safeHref}
      {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

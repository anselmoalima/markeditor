import { Children, isValidElement, type ReactNode } from 'react';
import type React from 'react';

type AlertType = 'note' | 'warning' | 'tip' | 'important' | 'caution';

const ALERT_MAP: Record<string, AlertType> = {
  NOTE: 'note',
  WARNING: 'warning',
  TIP: 'tip',
  IMPORTANT: 'important',
  CAUTION: 'caution',
};

const ROLE_MAP: Record<AlertType, string> = {
  note: 'note',
  warning: 'note',
  tip: 'note',
  important: 'note',
  caution: 'note',
};

function extractAlertType(children: ReactNode): AlertType | null {
  const childArray = Children.toArray(children);
  if (!childArray.length) return null;

  const firstChild = childArray[0];
  if (!isValidElement(firstChild)) return null;

  // First child is typically a <p> element
  const pChildren = Children.toArray(
    (firstChild as React.ReactElement<{ children?: ReactNode }>).props?.children,
  );
  if (!pChildren.length) return null;

  const firstText = pChildren[0];
  if (typeof firstText !== 'string') return null;

  const match = firstText.match(/^\[!([A-Z]+)\]/);
  if (!match?.[1]) return null;

  return ALERT_MAP[match[1]] ?? null;
}

function stripAlertMarker(children: ReactNode): ReactNode {
  const childArray = Children.toArray(children);
  if (!childArray.length) return children;

  const [firstChild, ...rest] = childArray;
  if (!isValidElement(firstChild)) return children;

  const typedFirst = firstChild as React.ReactElement<{ children?: ReactNode }>;
  const pChildren = Children.toArray(typedFirst.props?.children ?? []);

  if (!pChildren.length) return children;
  const [firstText, ...restPChildren] = pChildren;

  if (typeof firstText !== 'string') return children;
  const stripped = firstText.replace(/^\[![A-Z]+\]\s*/, '');

  const newPChildren: ReactNode[] = stripped ? [stripped, ...restPChildren] : restPChildren;

  // Rebuild the p element without the marker
  const newFirst =
    newPChildren.length > 0
      ? {
          ...typedFirst,
          props: {
            ...typedFirst.props,
            children: newPChildren.length === 1 ? newPChildren[0] : newPChildren,
          },
        }
      : null;

  return [newFirst, ...rest].filter(Boolean);
}

interface BlockquoteProps {
  children?: ReactNode;
  className?: string;
}

export function Alert({ children, className, ...rest }: BlockquoteProps): JSX.Element {
  const alertType = extractAlertType(children);

  if (!alertType) {
    return (
      <blockquote className={className} {...rest}>
        {children}
      </blockquote>
    );
  }

  const role = ROLE_MAP[alertType];
  const strippedChildren = stripAlertMarker(children);

  return (
    <div
      role={role}
      className={`bobmd-alert bobmd-alert-${alertType}${className ? ` ${className}` : ''}`}
      data-callout-type={alertType}
      aria-label={alertType}
    >
      <div className="bobmd-alert-title">{alertType.toUpperCase()}</div>
      <div className="bobmd-alert-content">{strippedChildren}</div>
    </div>
  );
}

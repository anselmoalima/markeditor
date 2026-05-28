import type React from 'react';

export interface ToolbarButtonProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  shortcutLabel?: string;
}

export function ToolbarButton({
  id,
  label,
  icon,
  isActive = false,
  isDisabled = false,
  onClick,
  shortcutLabel,
}: ToolbarButtonProps): JSX.Element {
  const title = shortcutLabel ? `${label} (${shortcutLabel})` : label;
  const className = ['bobmd-toolbar-btn', isActive ? 'bobmd-toolbar-btn--active' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      data-testid={`bobmd-toolbar-btn-${id}`}
      className={className}
      aria-label={label}
      aria-pressed={isActive}
      aria-disabled={isDisabled}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
    >
      {icon ?? label}
    </button>
  );
}

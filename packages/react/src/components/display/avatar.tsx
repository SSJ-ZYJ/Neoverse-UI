import { type HTMLAttributes, type ReactNode, useState } from 'react';

export type UiAvatarShape = 'circle' | 'rounded';
/** What a source-less avatar paints: derived initials or the neutral person glyph. */
export type UiAvatarPlaceholder = 'initials' | 'icon';

export interface UiAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: string;
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: UiAvatarShape;
  placeholder?: UiAvatarPlaceholder;
  /** Replaces the built-in person glyph when `placeholder` is `icon`. */
  icon?: ReactNode;
}

const defaultIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
  </svg>
);

export function UiAvatar({
  name,
  src,
  fallback,
  size = 'md',
  shape = 'rounded',
  placeholder = 'initials',
  icon,
  className,
  ...rest
}: UiAvatarProps) {
  const [failedSource, setFailedSource] = useState<string | undefined>();
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const initials =
    fallback ??
    (words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => [...word][0])
          .join('')
          .toLocaleUpperCase()
      : [...(words[0] ?? '?')].slice(0, 2).join('').toLocaleUpperCase());
  return (
    <span
      {...rest}
      className={[
        'ui-avatar',
        'material-glass-subtle',
        `ui-avatar--${size}`,
        `ui-avatar--${shape}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={name}
      data-surface="glass-subtle"
    >
      {src && failedSource !== src ? (
        <img
          className="ui-avatar__image"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSource(src)}
        />
      ) : placeholder === 'icon' ? (
        <span className="ui-avatar__icon" aria-hidden="true">
          {icon ?? defaultIcon}
        </span>
      ) : (
        <span className="ui-avatar__fallback" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}

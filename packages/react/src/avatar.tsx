import { type HTMLAttributes, useState } from 'react';

export type UiAvatarShape = 'circle' | 'rounded';

export interface UiAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: string;
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: UiAvatarShape;
}

export function UiAvatar({
  name,
  src,
  fallback,
  size = 'md',
  shape = 'rounded',
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
      ) : (
        <span className="ui-avatar__fallback" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}

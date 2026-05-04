import type { CSSProperties, ReactNode } from 'react';

interface ScenicScreenProps {
  backgroundPath?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}

function getScenicBackgroundStyle(backgroundPath?: string): CSSProperties | undefined {
  if (!backgroundPath) {
    return undefined;
  }

  return {
    '--scenic-screen-background': `url("${backgroundPath}")`,
  } as CSSProperties;
}

export function ScenicScreen({ backgroundPath, children, className, testId }: ScenicScreenProps) {
  return (
    <section
      className={['scenic-screen', className].filter(Boolean).join(' ')}
      data-testid={testId}
      style={getScenicBackgroundStyle(backgroundPath)}
    >
      <span aria-hidden="true" className="scenic-screen__backdrop" />
      <span aria-hidden="true" className="scenic-screen__picture" />
      {children}
    </section>
  );
}

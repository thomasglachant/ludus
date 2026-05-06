import type { ReactNode } from 'react';

interface ScenicScreenProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function ScenicScreen({ children, className, testId }: ScenicScreenProps) {
  return (
    <section
      className={['scenic-screen', className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {children}
    </section>
  );
}

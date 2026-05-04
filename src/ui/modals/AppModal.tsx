import type { ComponentProps } from 'react';

import { ParchmentModal } from '../game/ParchmentModal';

export function AppModal(props: ComponentProps<typeof ParchmentModal>) {
  return <ParchmentModal {...props} />;
}

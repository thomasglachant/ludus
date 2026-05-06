import './modal-shell.css';
import type { ComponentProps } from 'react';

import { AppDialogShell } from '@/ui/shared/ludus/AppDialogShell';

export function AppModal(props: ComponentProps<typeof AppDialogShell>) {
  return <AppDialogShell {...props} />;
}

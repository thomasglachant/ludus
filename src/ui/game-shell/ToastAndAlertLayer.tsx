import { useUiStore } from '../../state/ui-store-context';

interface ToastAndAlertLayerProps {
  errorKey: string | null;
  saveNoticeKey?: string | null;
}

export function ToastAndAlertLayer({ errorKey, saveNoticeKey }: ToastAndAlertLayerProps) {
  const { t } = useUiStore();

  if (!errorKey && !saveNoticeKey) {
    return null;
  }

  return (
    <div className="toast-alert-layer" aria-live="polite">
      {errorKey ? <p className="toast-alert toast-alert--error">{t(errorKey)}</p> : null}
      {saveNoticeKey ? (
        <p className="toast-alert toast-alert--info" data-testid="save-notice">
          {t(saveNoticeKey)}
        </p>
      ) : null}
    </div>
  );
}

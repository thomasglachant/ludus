import { useState, type FormEvent } from 'react';
import { useUiStore, type FormModalField, type UiModalState } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { AppModal } from './AppModal';

function createInitialFormValues(fields: FormModalField[]) {
  return Object.fromEntries(fields.map((field) => [field.id, field.defaultValue ?? '']));
}

function ConfirmDialog({ modal }: { modal: Extract<UiModalState, { kind: 'confirm' }> }) {
  const { closeModal, t } = useUiStore();

  const confirm = () => {
    const { onConfirm } = modal;

    closeModal();
    onConfirm();
  };

  return (
    <AppModal
      testId={modal.testId ?? 'confirm-dialog'}
      titleKey={modal.titleKey}
      onClose={closeModal}
    >
      <div className={`confirm-dialog confirm-dialog--${modal.tone ?? 'default'}`}>
        <p>{t(modal.messageKey, modal.messageParams)}</p>
        <div className="form-actions">
          <ActionButton label={t(modal.cancelLabelKey ?? 'common.cancel')} onClick={closeModal} />
          <ActionButton
            label={t(modal.confirmLabelKey ?? 'common.confirm')}
            variant={modal.tone === 'danger' ? 'secondary' : 'primary'}
            onClick={confirm}
          />
        </div>
      </div>
    </AppModal>
  );
}

function FormDialog({ modal }: { modal: Extract<UiModalState, { kind: 'form' }> }) {
  const { closeModal, t } = useUiStore();
  const [values, setValues] = useState(() => createInitialFormValues(modal.fields));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { onSubmit } = modal;

    closeModal();
    onSubmit(values);
  };

  return (
    <AppModal testId={modal.testId ?? 'form-dialog'} titleKey={modal.titleKey} onClose={closeModal}>
      <form className="form-panel form-panel--modal" onSubmit={submit}>
        {modal.fields.map((field) => (
          <label key={field.id}>
            <span>{t(field.labelKey)}</span>
            <input
              autoComplete={field.autoComplete}
              placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
              required={field.required}
              value={values[field.id]}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  [field.id]: event.target.value,
                }))
              }
            />
          </label>
        ))}
        <div className="form-actions">
          <ActionButton label={t(modal.cancelLabelKey ?? 'common.cancel')} onClick={closeModal} />
          <ActionButton
            label={t(modal.submitLabelKey ?? 'common.confirm')}
            type="submit"
            variant="primary"
          />
        </div>
      </form>
    </AppModal>
  );
}

export function ModalHost() {
  const { activeModal } = useUiStore();

  if (!activeModal) {
    return null;
  }

  if (activeModal.kind === 'confirm') {
    return <ConfirmDialog modal={activeModal} />;
  }

  return <FormDialog modal={activeModal} />;
}

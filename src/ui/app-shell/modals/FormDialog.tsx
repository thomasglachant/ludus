import '@/ui/shared/components/form-controls.css';
import { type FormEvent, useState } from 'react';
import { useUiStore, type FormModalField, type UiModalState } from '@/state/ui-store-context';
import { Input } from '@/ui/shared/primitives/Input';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { AppModal } from './AppModal';

interface FormDialogProps {
  isActive: boolean;
  modal: Extract<UiModalState, { kind: 'form' }>;
}

function createInitialFormValues(fields: FormModalField[]) {
  return Object.fromEntries(fields.map((field) => [field.id, field.defaultValue ?? '']));
}

export function FormDialog({ isActive, modal }: FormDialogProps) {
  const { closeModal, t } = useUiStore();
  const [values, setValues] = useState(() => createInitialFormValues(modal.fields));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { onSubmit } = modal;

    closeModal();
    onSubmit(values);
  };

  return (
    <AppModal
      isActive={isActive}
      size={modal.size ?? 'md'}
      testId={modal.testId ?? 'form-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onClose={closeModal}
      footer={
        <ActionBar>
          <Button onClick={closeModal}>
            <span>{t(modal.cancelLabelKey ?? 'common.cancel')}</span>
          </Button>
          <PrimaryActionButton
            type="submit"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>('[data-modal-form="active"]');
              form?.requestSubmit();
            }}
          >
            <span>{t(modal.submitLabelKey ?? 'common.confirm')}</span>
          </PrimaryActionButton>
        </ActionBar>
      }
    >
      <form
        className="form-panel form-panel--modal"
        data-modal-form={isActive ? 'active' : 'inactive'}
        onSubmit={submit}
      >
        {modal.fields.map((field) => (
          <label key={field.id}>
            <span>{t(field.labelKey)}</span>
            <Input
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
      </form>
    </AppModal>
  );
}

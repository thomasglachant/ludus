import { type FormEvent, useState } from 'react';
import { useUiStore, type FormModalField, type UiModalState } from '@/state/ui-store-context';
import { ModalForm, ModalFormTextField } from './ModalForm';

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
  const formId = `${modal.id}-form`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { onSubmit } = modal;

    closeModal();
    onSubmit(values);
  };

  return (
    <ModalForm
      cancelLabelKey={modal.cancelLabelKey}
      formId={formId}
      isActive={isActive}
      size={modal.size ?? 'md'}
      submitLabel={t(modal.submitLabelKey ?? 'common.confirm')}
      testId={modal.testId ?? 'form-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onClose={closeModal}
      onSubmit={submit}
    >
      {modal.fields.map((field) => (
        <ModalFormTextField
          autoComplete={field.autoComplete}
          key={field.id}
          label={t(field.labelKey)}
          messages={
            field.required
              ? [
                  {
                    content: t('common.requiredField'),
                    match: 'valueMissing',
                  },
                ]
              : []
          }
          name={field.id}
          placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
          required={field.required}
          value={values[field.id]}
          onValueChange={(value) =>
            setValues((currentValues) => ({
              ...currentValues,
              [field.id]: value,
            }))
          }
        />
      ))}
    </ModalForm>
  );
}

import './modal-form.css';
import type { FormEvent, ReactNode } from 'react';
import { useUiStore, type ModalSize } from '@/state/ui-store-context';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';
import { Button } from '@/ui/shared/ludus/Button';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { Input } from '@/ui/shared/primitives/Input';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/ui/shared/primitives/Form';
import { AppModal } from './AppModal';

interface ModalFormProps {
  cancelLabelKey?: string;
  children: ReactNode;
  formId: string;
  isActive?: boolean;
  isSubmitting?: boolean;
  onBack?(): void;
  onCancel?(): void;
  onClose(): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  showCancelAction?: boolean;
  size?: ModalSize;
  submitIconName?: GameIconName;
  submitLabel: string;
  submitTestId?: string;
  testId?: string;
  titleKey: string;
  titleParams?: Record<string, string | number>;
}

interface ModalFormFieldMessage {
  content: ReactNode;
  match: 'patternMismatch' | 'valueMissing';
}

interface ModalFormTextFieldProps {
  actionIconName?: GameIconName;
  actionLabel?: string;
  actionTestId?: string;
  autoComplete?: string;
  label: string;
  messages?: ModalFormFieldMessage[];
  name: string;
  pattern?: string;
  placeholder?: string;
  required?: boolean;
  testId?: string;
  value: string;
  onAction?(): void;
  onValueChange(value: string): void;
}

export function ModalForm({
  cancelLabelKey = 'common.cancel',
  children,
  formId,
  isActive = true,
  isSubmitting = false,
  onBack,
  onCancel,
  onClose,
  onSubmit,
  showCancelAction = true,
  size = 'md',
  submitIconName,
  submitLabel,
  submitTestId,
  testId,
  titleKey,
  titleParams,
}: ModalFormProps) {
  const { t } = useUiStore();
  const cancel = onCancel ?? onClose;

  return (
    <AppModal
      isActive={isActive}
      size={size}
      testId={testId}
      titleKey={titleKey}
      titleParams={titleParams}
      onBack={onBack}
      onClose={onClose}
    >
      <Form className="modal-form" id={formId} onSubmit={onSubmit}>
        <div className="modal-form__fields">{children}</div>
        <div className="modal-form-actions">
          {showCancelAction ? (
            <Button
              className="modal-form-actions__cancel"
              type="button"
              variant="ghost"
              onClick={cancel}
            >
              <span>{t(cancelLabelKey)}</span>
            </Button>
          ) : null}
          <PrimaryActionButton
            className="modal-form-actions__submit"
            data-testid={submitTestId}
            disabled={isSubmitting}
            iconName={submitIconName}
            type="submit"
          >
            <span>{submitLabel}</span>
          </PrimaryActionButton>
        </div>
      </Form>
    </AppModal>
  );
}

export function ModalFormTextField({
  actionIconName = 'dice',
  actionLabel,
  actionTestId,
  autoComplete,
  label,
  messages = [],
  name,
  onAction,
  onValueChange,
  pattern,
  placeholder,
  required = false,
  testId,
  value,
}: ModalFormTextFieldProps) {
  return (
    <FormField className="modal-form-field" name={name}>
      <FormLabel className="modal-form-field__label">{label}</FormLabel>
      <div className="modal-form-field__control">
        <FormControl asChild>
          <Input
            autoComplete={autoComplete}
            className="modal-form-field__input"
            data-testid={testId}
            name={name}
            pattern={pattern}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={(event) => onValueChange(event.currentTarget.value)}
          />
        </FormControl>
        {onAction ? (
          <IconButton
            aria-label={actionLabel ?? label}
            className="modal-form-field__action"
            data-testid={actionTestId}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onAction}
          >
            <GameIcon name={actionIconName} size={17} />
          </IconButton>
        ) : null}
      </div>
      {messages.map((message) => (
        <FormMessage
          className="modal-form-field__message"
          key={message.match}
          match={message.match}
        >
          {message.content}
        </FormMessage>
      ))}
    </FormField>
  );
}

'use client';

import { Card } from '@/components/ui/Card/Card';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import { FormActions } from '@/components/ui/FormActions/FormActions';
import { FormField } from '@/components/ui/FormField/FormField';
import {
  staffFormAtoms,
  staffValidationRules,
  type StaffFormValues,
} from '@/features/staff/forms/staffFormAtoms';
import useCreateStaff from '@/hooks/mutations/useCreateStaff';
import useJotaiForm from '@/hooks/forms/useJotaiForm';
import useJotaiFormField from '@/hooks/forms/useJotaiFormField';

function NameField() {
  const { value, error, onChange } = useJotaiFormField<string>({
    fieldAtoms: staffFormAtoms.fields.name,
    rules: staffValidationRules.name,
    defaultValue: staffFormAtoms.initialValues.name,
  });

  return (
    <FormField
      id="name"
      label="職員名"
      type="input"
      inputType="text"
      value={value}
      onChange={onChange}
      placeholder="山田 太郎"
      required
      supportText="100文字以内で入力してください"
      error={error ?? undefined}
    />
  );
}

function EmailField() {
  const { value, error, onChange } = useJotaiFormField<string>({
    fieldAtoms: staffFormAtoms.fields.email,
    rules: staffValidationRules.email,
    defaultValue: staffFormAtoms.initialValues.email,
  });

  return (
    <FormField
      id="email"
      label="メールアドレス"
      type="input"
      inputType="email"
      value={value}
      onChange={onChange}
      placeholder="example@example.com"
      supportText="任意項目です"
      error={error ?? undefined}
    />
  );
}

export default function StaffForm() {
  const {
    mutate: createStaffMutation,
    isPending,
    isError,
    error,
  } = useCreateStaff();

  const { errors, isValid, validateAll, getFormData } =
    useJotaiForm<StaffFormValues>(staffFormAtoms);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;

    createStaffMutation(getFormData());
  };

  const firstError = Object.values(errors).find(Boolean);

  return (
    <div className="space-y-6">
      <ErrorAlert
        message={firstError || (isError ? error?.message : undefined)}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card title="職員情報" padding="lg">
          <p className="mb-6 text-sm text-solid-gray-600">
            職員の情報を入力してください。
          </p>

          <div className="space-y-6">
            <NameField />
            <EmailField />
          </div>
        </Card>

        <FormActions
          submitLabel="作成する"
          cancelLabel="キャンセル"
          onCancel={() => window.history.back()}
          isSubmitting={isPending}
          submitDisabled={!isValid}
        />
      </form>
    </div>
  );
}

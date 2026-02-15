import ErrorText from '@/components/ui/ErrorText/ErrorText';
import Input from '@/components/ui/Input/Input';
import Label from '@/components/ui/Label/Label';
import RequirementBadge from '@/components/ui/RequirementBadge/RequirementBadge';
import Select from '@/components/ui/Select/Select';
import SupportText from '@/components/ui/SupportText/SupportText';
import Textarea from '@/components/ui/Textarea/Textarea';

type BaseFormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  supportText?: string;
  error?: string;
  className?: string;
};

type InputFormFieldProps = BaseFormFieldProps & {
  type: 'input';
  inputType?: 'text' | 'email' | 'tel' | 'date' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

type TextareaFormFieldProps = BaseFormFieldProps & {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  readOnly?: boolean;
};

type SelectFormFieldProps = BaseFormFieldProps & {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
};

export type FormFieldProps =
  | InputFormFieldProps
  | TextareaFormFieldProps
  | SelectFormFieldProps;

export const FormField = (props: FormFieldProps) => {
  const {
    id,
    label,
    required,
    optional,
    supportText,
    error,
    className = '',
    type,
  } = props;

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2 block">
        {label} {required && <RequirementBadge>必須</RequirementBadge>}
        {optional && (
          <RequirementBadge isOptional={true}>任意</RequirementBadge>
        )}
      </Label>

      {type === 'input' && (
        <Input
          id={id}
          type={props.inputType}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          blockSize="md"
          className="w-full"
          disabled={props.disabled}
          readOnly={props.readOnly}
        />
      )}

      {type === 'textarea' && (
        <Textarea
          id={id}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 4}
          className="w-full"
          disabled={props.disabled}
          readOnly={props.readOnly}
        />
      )}

      {type === 'select' && (
        <Select
          id={id}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full"
          disabled={props.disabled}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}

      {supportText && <SupportText className="mt-2">{supportText}</SupportText>}
      {error && <ErrorText className="mt-1">{error}</ErrorText>}
    </div>
  );
};

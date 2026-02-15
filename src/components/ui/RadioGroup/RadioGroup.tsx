import Label from '@/components/ui/Label/Label';
import Radio from '@/components/ui/Radio/Radio';
import RequirementBadge from '@/components/ui/RequirementBadge/RequirementBadge';
import SupportText from '@/components/ui/SupportText/SupportText';

export interface RadioGroupOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  label: string;
  required?: boolean;
  supportText?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioGroupOption[];
  direction?: 'horizontal' | 'vertical';
}

export const RadioGroup = ({
  name,
  label,
  required = false,
  supportText,
  value,
  onChange,
  options,
  direction = 'horizontal',
}: RadioGroupProps) => {
  const containerClass =
    direction === 'horizontal' ? 'flex gap-6' : 'space-y-3';

  return (
    <div>
      <Label className="mb-3 block">
        {label}{' '}
        {required && (
          <RequirementBadge isOptional={false}>必須</RequirementBadge>
        )}
      </Label>
      <div className={containerClass}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          >
            {option.label}
          </Radio>
        ))}
      </div>
      {supportText && <SupportText className="mt-2">{supportText}</SupportText>}
    </div>
  );
};

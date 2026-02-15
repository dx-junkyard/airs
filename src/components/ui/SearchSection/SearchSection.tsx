import Button from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import Input from '@/components/ui/Input/Input';
import Label from '@/components/ui/Label/Label';
import Select from '@/components/ui/Select/Select';

export interface SearchFieldConfig {
  type: 'text' | 'select';
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface SearchSectionProps {
  title?: string;
  searchFields: SearchFieldConfig[];
  onSearch: () => void;
  searchLabel?: string;
}

export const SearchSection = ({
  title = '検索',
  searchFields,
  onSearch,
  searchLabel = '検索',
}: SearchSectionProps) => {
  return (
    <Card title={title} padding="lg">
      <div className="space-y-4">
        {searchFields.map((field, index) => (
          <div key={index}>
            <Label className="mb-2 block">{field.label}</Label>
            {field.type === 'text' ? (
              <Input
                type="text"
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                blockSize="md"
                className="w-full"
              />
            ) : (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full"
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </div>
        ))}
        <div className="pt-2">
          <Button size="md" variant="solid-fill" onClick={onSearch}>
            {searchLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};

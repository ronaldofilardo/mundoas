import { Input } from "@/components/ui/input";

interface EditFormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
  uppercase?: boolean;
}

export function EditFormField({
  id,
  label,
  value,
  onChange,
  type,
  disabled,
  maxLength,
  uppercase,
}: EditFormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      />
    </div>
  );
}
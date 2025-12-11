import { Checkbox } from "@congress/ui/checkbox";
import { Label } from "@congress/ui/label";

interface DisclaimerCheckboxProps {
  name: string;
  label: string;
  checked: boolean;
  setChecked: (checked: boolean) => void;
}

export const DisclaimerCheckbox = ({
  name,
  label,
  checked,
  setChecked,
}: DisclaimerCheckboxProps) => {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={(checked) => setChecked(checked === true)}
        className="mt-0.5"
      />
      <Label
        htmlFor={name}
        className="text-muted-foreground cursor-pointer text-sm leading-relaxed"
      >
        {label}
      </Label>
    </div>
  );
};

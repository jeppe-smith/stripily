export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
>;

export function Checkbox(props: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 bg-white text-brand focus:ring-brand"
      {...props}
    />
  );
}

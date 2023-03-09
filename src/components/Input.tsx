import classNames from "classnames";
import { type FieldValues, type Path, type UseFormRegister } from "react-hook-form";

export type InputProps<FormValues extends FieldValues> = {
  label: string;
  name: Path<FormValues>;
  register: UseFormRegister<FormValues>;
  required?: boolean;
  size?: "sm" | "md" | "lg";
  grow?: boolean;
} & Omit<JSX.IntrinsicElements["input"], "size" | "grow">;

export function Input<FormValues extends FieldValues>(
  props: InputProps<FormValues>
) {
  const { register, size = "md", grow, ...inputProps } = props;

  return (
    <div>
      <label
        htmlFor={inputProps.id}
        className="text-sm font-medium leading-none text-gray-700"
      >
        {inputProps.label}
      </label>
      <div className="mt-1">
        <input
          type="text"
          className={classNames(
            "rounded border border-gray-300 py-0 text-sm leading-none text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand",
            size === "sm" && "h-6 px-2",
            size === "md" && "h-8 px-2",
            size === "lg" && "h-10 px-3",
            grow && "w-full"
          )}
          {...inputProps}
          {...register(inputProps.name, { required: inputProps.required })}
        />
      </div>
    </div>
  );
}

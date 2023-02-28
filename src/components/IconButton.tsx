import classNames from "classnames";

export type IconButtonProps = {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
  primary?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton(props: IconButtonProps) {
  const size = props.size || "md";
  const { primary, icon, ...rest } = props;

  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center rounded border  text-center text-sm font-medium leading-none  focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand",
        size === "sm" && "h-6 w-6",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-10 w-10",
        props.primary
          ? "border-brand bg-brand text-white shadow-sm shadow-brand/20 transition-shadow hover:shadow-md hover:shadow-brand/20 focus:ring-offset-1"
          : "border-transparent bg-white text-gray-900 hover:bg-gray-50 hover:text-brand"
      )}
      {...rest}
    >
      <span
        className={classNames(
          "flex items-center justify-center",
          size === "sm" && "h-5 w-5",
          size === "md" && "h-7 w-7",
          size === "lg" && "h-9 w-9"
        )}
      >
        {icon}
      </span>
    </button>
  );
}

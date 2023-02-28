import classNames from "classnames";
import * as icons from "@heroicons/react/20/solid";
import { createElement } from "react";

export type ButtonProps = {
  text?: string;
  size?: "sm" | "md" | "lg";
  grow?: boolean;
  primary?: boolean;
  icon?: keyof typeof icons;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: ButtonProps) {
  const size = props.size || "md";
  const { grow, primary, icon, text, ...rest } = props;

  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center rounded-md border text-center text-sm font-medium leading-none shadow-sm transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand",
        size === "sm" && "h-6 space-x-1 px-2",
        size === "md" && "h-8 space-x-2 px-4",
        size === "lg" && "h-10 space-x-2 px-5",
        props.primary
          ? "border-brand bg-brand text-white shadow-brand/20 hover:shadow-md hover:shadow-brand/20 focus:ring-offset-1"
          : "border-gray-300 bg-white text-gray-900 hover:shadow",
        props.grow && "w-full"
      )}
      {...rest}
    >
      {props.icon &&
        createElement(icons[props.icon], {
          className: classNames(
            size === "sm" && "w-4",
            size === "md" && "w-4",
            size === "lg" && "w-6"
          ),
        })}
      {props.text && <span>{props.text}</span>}
    </button>
  );
}

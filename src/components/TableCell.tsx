import classNames from "classnames";
import { createElement } from "react";

export type TableCellProps = {
  children: React.ReactNode;
  className?: string;
  numeric?: boolean;
};

export function TableCell({
  children,
  className,
  numeric,
  ...props
}: TableCellProps) {
  return (
    <td>
      {createElement(
        // @ts-ignore
        props.href ? "a" : "span",
        {
          className: classNames(
            "inline-flex w-full whitespace-nowrap p-2 align-middle text-sm",
            numeric && "justify-end text-right tabular-nums",
            className
          ),
          // @ts-ignore
          href: props.href,
        },
        children
      )}
    </td>
  );
}

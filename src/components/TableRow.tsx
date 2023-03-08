import classNames from "classnames";
import { Children, cloneElement } from "react";

export type TableRowProps = {
  children: React.ReactNode;
  selected?: boolean;
  href?: string;
};

export function TableRow({ children, selected, href }: TableRowProps) {
  return (
    <tr
      className={classNames(
        "border-y border-gray-200 text-left hover:bg-gray-50",
        selected && "bg-gray-50"
      )}
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, {
          href,
        })
      )}
    </tr>
  );
}

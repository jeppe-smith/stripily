import classNames from "classnames";
import { Children } from "react";

export type TableRowProps = {
  children: React.ReactNode;
  selected?: boolean;
  href?: string;
  header?: boolean;
};

export function TableRow({ children, selected, header, href }: TableRowProps) {
  return (
    <tr
      className={classNames(
        "border-y border-gray-200 text-left hover:bg-gray-50",
        selected && "bg-gray-50"
      )}
    >
      {Children.map(children, (child) => {
        if (header) {
          return child;
        }

        return <td>{href ? <a href={href}>{child}</a> : child}</td>;
      })}
    </tr>
  );
}

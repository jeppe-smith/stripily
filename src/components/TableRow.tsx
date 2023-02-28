import classNames from "classnames";

export type TableRowProps = {
  children: React.ReactNode;
  selected?: boolean;
};

export function TableRow({ children, selected }: TableRowProps) {
  return (
    <tr
      className={classNames(
        "border-y border-gray-200 text-left hover:bg-gray-50",
        selected && "bg-gray-50"
      )}
    >
      {children}
    </tr>
  );
}

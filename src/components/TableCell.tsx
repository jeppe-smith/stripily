import classNames from "classnames";

export type TableCellProps = {
  children: React.ReactNode;
  className?: string;
};

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td>
      <span
        className={classNames(
          "inline-block w-full whitespace-nowrap p-2 text-sm",
          className
        )}
      >
        {children}
      </span>
    </td>
  );
}

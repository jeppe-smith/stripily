import classNames from "classnames";

export type TableCellProps = {
  children: React.ReactNode;
  className?: string;
  numeric?: boolean;
};

export function TableCell({ children, className, numeric }: TableCellProps) {
  return (
    <span
      className={classNames(
        "inline-flex w-full whitespace-nowrap p-2 align-middle text-sm",
        numeric && "justify-end text-right tabular-nums",
        className
      )}
    >
      {children}
    </span>
  );
}

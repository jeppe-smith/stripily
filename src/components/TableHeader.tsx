import classNames from "classnames";

export type TableHeadProps = {
  children?: React.ReactNode;
  collapse?: boolean;
  grow?: boolean;
  numeric?: boolean;
};

export function TableHeader({
  children,
  collapse,
  grow,
  numeric,
}: TableHeadProps) {
  return (
    <th
      className={classNames(
        collapse && "w-0",
        grow && "w-full",
        numeric && "text-right tabular-nums"
      )}
    >
      <span className="inline-block w-full whitespace-nowrap p-2 text-xs font-medium uppercase text-gray-900">
        {children}
      </span>
    </th>
  );
}

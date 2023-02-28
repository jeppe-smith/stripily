import classNames from "classnames";

export type TableHeadProps = {
  children?: React.ReactNode;
  collapse?: boolean;
};

export function TableHead({ children, collapse }: TableHeadProps) {
  return (
    <th className={classNames(collapse && "w-0")}>
      <span className="inline-block w-full whitespace-nowrap p-2 text-xs font-medium uppercase text-gray-900">
        {children}
      </span>
    </th>
  );
}

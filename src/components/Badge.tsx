import classNames from "classnames";

export type BadgeProps = {
  color:
    | "amber"
    | "cyan"
    | "emerald"
    | "fuchsia"
    | "indigo"
    | "pink"
    | "purple"
    | "rose"
    | "teal"
    | "violet";
  text: string;
};

export function Badge(props: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex h-5 items-center space-x-1 rounded px-1 text-xs font-medium leading-none ring-1",
        `bg-${props.color}-100 text-${props.color}-800 ring-${props.color}-300`
      )}
    >
      {props.text}
    </span>
  );
}

import classNames from "classnames";

export type StatusPillProps = {
  status: "success" | "warning" | "error" | "info";
  text: string;
};

export function StatusPill(props: StatusPillProps) {
  return (
    <span
      className={classNames(
        "inline-flex h-5 items-center space-x-1 rounded-full px-2 text-xs font-medium leading-none ring-1",
        props.status === "success" &&
          "bg-green-100 text-green-800 ring-green-300",
        props.status === "warning" &&
          "bg-yellow-100 text-yellow-800 ring-yellow-300",
        props.status === "error" && "bg-red-100 text-red-800 ring-red-300",
        props.status === "info" && "bg-gray-100 text-gray-800 ring-gray-300"
      )}
    >
      {props.text}
    </span>
  );
}

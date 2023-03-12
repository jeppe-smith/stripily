import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";

export type ExternalLinkProps = {
  text: string;
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "target" | "children" | "className"
>;

export function ExternalLink(props: ExternalLinkProps) {
  const { text, ...rest } = props;

  return (
    <a
      className="inline-flex h-5 items-center space-x-1 rounded bg-gray-100 px-1 text-xs font-medium leading-none text-gray-700"
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {text}
      <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 text-gray-500" />
    </a>
  );
}

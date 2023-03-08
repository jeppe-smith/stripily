import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { Container } from "~/components/Container";

export function Header() {
  const router = useRouter();

  return (
    <header className="mb-8 border-b bg-white shadow-sm">
      <Container>
        <nav className="flex justify-end space-x-6 py-2 text-sm font-medium">
          <Link
            href="/invoices"
            className={classNames(
              "inline-flex h-6 items-center rounded-full px-3 leading-none text-gray-700 hover:bg-gray-50",
              router.route === "/invoices" &&
                "bg-brand text-white hover:bg-brand"
            )}
          >
            Fakturer
          </Link>
          <Link
            href="/fees"
            className={classNames(
              "inline-flex h-6 items-center rounded-full px-3 leading-none text-gray-700",
              router.route === "/fees" && "bg-brand text-white hover:bg-brand"
            )}
          >
            Gebyrer
          </Link>
          <Link
            href="/payouts"
            className={classNames(
              "inline-flex h-6 items-center rounded-full px-3 leading-none text-gray-700",
              router.route === "/payouts" &&
                "bg-brand text-white hover:bg-brand"
            )}
          >
            Udbetalinger
          </Link>
        </nav>
      </Container>
    </header>
  );
}

import "@total-typescript/ts-reset";

import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Container } from "~/components/Container";
import { Header } from "~/components/Header";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Header />
      <Container>
        <Component {...pageProps} />
      </Container>
    </SessionProvider>
  );
};

export { reportWebVitals } from "next-axiom";
export default api.withTRPC(MyApp);

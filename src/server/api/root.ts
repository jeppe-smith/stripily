import { createTRPCRouter } from "~/server/api/trpc";
import { stripeRouter } from "~/server/api/routers/stripe";
import { appRouter } from "~/server/api/routers/app";
import { invoicesRouter } from "~/server/api/routers/invoices";
import { transactionsRouter } from "~/server/api/routers/transactions";
import { chargesRouter } from "~/server/api/routers/charges";
import { accountingEventsRouter } from "~/server/api/routers/accountingEvents";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const rootRouter = createTRPCRouter({
  app: appRouter,
  stripe: stripeRouter,
  invoices: invoicesRouter,
  charges: chargesRouter,
  transactions: transactionsRouter,
  events: accountingEventsRouter,
});

// export type definition of API
export type RootRouter = typeof rootRouter;

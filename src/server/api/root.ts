import { createTRPCRouter } from "~/server/api/trpc";
import { stripeRouter } from "~/server/api/routers/stripe";
import { appRouter } from "~/server/api/routers/app";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const rootRouter = createTRPCRouter({
  app: appRouter,
  stripe: stripeRouter,
});

// export type definition of API
export type RootRouter = typeof rootRouter;

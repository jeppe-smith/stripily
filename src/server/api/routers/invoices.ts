import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/config/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const invoicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ startingAfter: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      return stripe.invoices.list({
        limit: 100,
        starting_after: input?.startingAfter,
      });
    }),

  retrieve: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      return stripe.invoices.retrieve(input.id);
    }),
});

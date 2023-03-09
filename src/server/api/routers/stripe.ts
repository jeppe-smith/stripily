import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/config/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const stripeRouter = createTRPCRouter({
  getPendingCharges: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const charges = await stripe.charges.search({
      query: 'status:"succeeded" AND metadata["billyId"]:null',
      limit: 100,
    });

    return charges.data;
  }),

  getSyncedCharges: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const charges = await stripe.charges.search({
      query: 'status:"succeeded" AND -metadata["billyId"]:null',
      limit: 100,
    });

    return charges.data;
  }),

  getBalanceTransactions: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const balanceTransactions = await stripe.balanceTransactions.list({
      limit: 100,
    });

    return balanceTransactions.data;
  }),

  getCharge: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      return stripe.charges.retrieve(input.id);
    }),

  getInvoice: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      return stripe.invoices.retrieve(input.id);
    }),

  getPayouts: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const payouts = await stripe.payouts.list({ limit: 100 });

    return payouts.data;
  }),
});

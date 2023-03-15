import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/config/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Billy } from "~/utils/billy";

export const chargesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ startingAfter: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      return stripe.charges.list({
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

      return stripe.charges.retrieve(input.id);
    }),

  getByInvoice: publicProcedure
    .input(z.object({ invoice: z.string() }))
    .query(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      const invoice = await stripe.invoices.retrieve(input.invoice);
      const charge = await stripe.charges.search({
        query: `customer:"${invoice.customer as string}"`,
      });

      return charge.data.filter((c) => c.invoice === invoice.id);
    }),

  sync: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const billy = new Billy(env.BILLY_API_KEY);
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });
      const charge = await stripe.charges.retrieve(input.id);
      const daybookTransaction = billy.syncInvoiceCharge(charge);

      console.log(daybookTransaction);

      return daybookTransaction;
    }),
});

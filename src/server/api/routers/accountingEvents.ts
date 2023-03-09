import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/config/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const accountingEventsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ startingAfter: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });
      // const invoices = await stripe.invoices.list({
      //   limit: 100,
      //   starting_after: input?.startingAfter,
      //   expand: ["data.charge"],
      // });
      // const invoicesAndCharges = invoices.data
      //   .flatMap((invoice) => [invoice, invoice.charge as Stripe.Charge | null])
      //   .filter(Boolean);

      // return invoicesAndCharges.sort((a, b) => b.created - a.created);
      const response = await stripe.events.list({
        limit: 100,
        starting_after: input?.startingAfter,
        types: ["invoice.finalized", "invoice.paid"],
      });

      return {
        ...response,
        data: response.data.map((data) => ({
          id: data.id,
          type: data.type,
          invoice: data.data.object as Stripe.Invoice,
        })),
      };
    }),
});

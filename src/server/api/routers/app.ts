import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";
import {
  createDaybookTransactionFromCharge,
  createDaybookTransactionFromPayout,
} from "~/server/utils";

export const appRouter = createTRPCRouter({
  getDaybookTransactionStatus: publicProcedure
    .input(z.object({ stripeId: z.string() }))
    .query(async ({ input }) => {
      const record = await prisma.daybookTransaction.findUnique({
        where: {
          stripeId: input.stripeId,
        },
      });

      return record?.state ?? null;
    }),

  syncCharge: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });
      const charge = await stripe.charges.retrieve(input.id);

      if (!charge) {
        throw new Error("Charge not found");
      }

      await createDaybookTransactionFromCharge(charge);

      return true;
    }),

  syncPayouts: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      await Promise.all(
        input.ids.map(async (id) => {
          const payout = await stripe.payouts.retrieve(id);

          await createDaybookTransactionFromPayout(payout);
        })
      );

      return true;
    }),
});

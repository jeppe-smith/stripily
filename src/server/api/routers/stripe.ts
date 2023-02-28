import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const stripeRouter = createTRPCRouter({
  getCharges: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const charges = await stripe.charges.list({ limit: 100 });

    return charges.data;
  }),

  getPayouts: publicProcedure.query(async () => {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const payouts = await stripe.payouts.list({ limit: 100 });

    return payouts.data;
  }),
});

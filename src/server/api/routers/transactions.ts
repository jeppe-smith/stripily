import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/config/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const transactionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ startingAfter: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const results = await ctx.prisma.transaction.findMany({
        take: 20,
        skip: input?.startingAfter ? 1 : 0,
        cursor: input?.startingAfter ? { id: input.startingAfter } : undefined,
        orderBy: { createdAt: "desc" },
      });

      return results;
    }),

  findMany: publicProcedure
    .input(z.object({ stripeIds: z.array(z.string()) }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.prisma.transaction.findMany({
        where: {
          stripeId: {
            in: input.stripeIds,
          },
        },
      });

      return result;
    }),
});

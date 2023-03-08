import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const transactionsRouter = createTRPCRouter({
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

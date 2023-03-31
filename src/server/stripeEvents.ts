import { StripeEventStatus } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "~/server/db";

/**
 * Log incoming Stripe event
 * @param event Stripe Event
 * @returns boolean indicating whether the event should be handled
 */
export async function handleStripeEventIncoming(event: Stripe.Event) {
  const stripeEvent = await prisma.stripeEvent.findUnique({
    where: { externalId: event.id },
  });

  if (stripeEvent) {
    if (
      stripeEvent.status === StripeEventStatus.RECEIVED ||
      stripeEvent.status === StripeEventStatus.PROCESSED
    ) {
      return false;
    }
  } else {
    // Back off invoice.finalized on the first attempt.
    if (event.type === "invoice.finalized") {
      await prisma.stripeEvent.create({
        data: {
          externalId: event.id,
          status: StripeEventStatus.SKIPPED,
        },
      });

      return false;
    } else {
      await prisma.stripeEvent.create({
        data: {
          externalId: event.id,
          status: StripeEventStatus.RECEIVED,
        },
      });

      return true;
    }
  }
}

export async function handleStripeEventProcessed(event: Stripe.Event) {
  await prisma.stripeEvent.update({
    where: { externalId: event.id },
    data: {
      status: StripeEventStatus.PROCESSED,
    },
  });
}

export async function handleStripeEventFailed(
  event: Stripe.Event,
  error: Error
) {
  await prisma.stripeEvent.update({
    where: { externalId: event.id },
    data: {
      status: StripeEventStatus.FAILED,
      error: `${error.name}: ${error.message}`,
    },
  });
}

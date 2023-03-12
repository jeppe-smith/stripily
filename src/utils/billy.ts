import got, { type Got } from "got";
import { log } from "next-axiom";
import Stripe from "stripe";
import { env } from "~/config/env.mjs";
import { prisma } from "~/server/db";
import type Prisma from "@prisma/client";

type Input<T> = Omit<T, "id">;
type Response<K extends string, V> = {
  [key in K]: V;
} & {
  validationErrors?: any;
  erroMessage?: string;
  errorCode?: string;
  meta: {
    statusCode: number;
    success: boolean;
    paging?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    time: number;
  };
};

export type Currency = {
  name: string;
  exchangeRate: number;
};

export type DaybookTransaction = {
  id: string;
  daybookId: string;
  entryDate: string;
  state: "approved" | "draft" | "voided";
  organizationId?: string;
  voucherNo?: string;
  description?: string;
  apiType?: string;
  priority?: number;
  lines?: Omit<DaybookTransactionLine, "daybookTransactionId">[];
};

export type DaybookTransactionLine = {
  id: string;
  amount: number;
  side: "debit" | "credit";
  currencyId: string;
  daybookTransactionId?: string;
  text?: string;
  accountId: string;
  taxRateId?: string;
  contraAccountId?: string;
  priority?: number;
};

export type Account = {
  id: string;
  organizationId: string;
  natureId: string;
  createdTime: string;
  updatedTime: string;
  predefinedAccountId: string;
  name: string;
  groupId: string;
  accountNo: number;
  systemRole?: string;
  isPaymentEnabled: boolean;
  isBankAccount: boolean;
  description: string;
  isArchived: boolean;
  currencyId: string;
  taxRateId: string;
  bankId?: string;
  bankName?: string;
  bankRoutingNo?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  bankIban?: string;
};

export type Daybook = {
  id: string;
  organizationId: string;
  isTransactionSummaryEnabled: boolean;
  isArchived: boolean;
  name: string;
  defaultContraAccountId?: string;
};

export type TaxRate = {
  id: string;
  organizationId: string;
  priority: number;
  name: string;
  abbreviation: string;
  description: string;
  rate: number;
  appliesToSales: boolean;
  appliesToPurchases: boolean;
  isPredefined: boolean;
  isActive: boolean;
  netAmountMetaFieldId?: string;
  predefinedTag: string;
  taxRateGroup: string;
};

export type DaybookTransactionLineInput = Input<DaybookTransactionLine>;
export type DaybookTransactionInput = {
  lines: DaybookTransactionLineInput[];
} & Omit<Input<DaybookTransaction>, "lines">;

const EU_COUNTRY_CODES = [
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "EE",
  "EL",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
];

export class Billy {
  client: Got;
  accounts?: Account[];
  taxRates?: TaxRate[];

  constructor(apiKey: string) {
    this.client = got.extend({
      prefixUrl: "https://api.billysbilling.com/v2",
      headers: {
        "X-Access-Token": apiKey,
      },
    });
  }

  async syncInvoice(id: string) {
    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const invoice = await stripe.invoices.retrieve(id, {
      expand: ["total_tax_amounts.tax_rate"],
    });
    const daybookTransaction: DaybookTransactionInput = {
      daybookId: (await this.getDaybook()).id,
      entryDate: new Date(invoice.created * 1000).toISOString().split("T")[0]!,
      state: "approved",
      voucherNo: invoice.id,
      description: invoice.id,
      lines: await this.getDaybookTransactionLinesFromInvoice(invoice),
    };

    await this.createDaybookTransaction(daybookTransaction, "INVOICE");

    return daybookTransaction;
  }

  async syncInvoicePayment(invoice: Stripe.Invoice) {
    if (!invoice.charge) {
      log.debug("Invoice has no charge", { id: invoice.id });
      return;
    }

    let charge = invoice.charge;

    if (typeof charge === "string") {
      const stripe = new Stripe(env.STRIPE_API_KEY, {
        apiVersion: "2022-11-15",
      });

      charge = await stripe.charges.retrieve(charge);
    }

    return this.syncCharge(charge);
  }

  async syncCharge(charge: Stripe.Charge) {
    if (!charge.invoice) {
      log.debug("Charge has no invoice", { id: charge.id });
      return;
    }

    const invoiceTransaction = await prisma.transaction.findFirst({
      where: { stripeId: charge.invoice as string },
    });

    if (!invoiceTransaction) {
      throw new Error(
        `No transaction for invoice (${charge.invoice as string})`
      );
    }

    const daybookTransaction: DaybookTransactionInput = {
      daybookId: (await this.getDaybook()).id,
      entryDate: new Date(charge.created * 1000).toISOString().split("T")[0]!,
      state: "approved",
      voucherNo: charge.id,
      description: charge.description ?? charge.id,
      lines: await this.getDaybookTransactionLinesFromCharge(charge),
    };

    await this.createDaybookTransaction(daybookTransaction, "CHARGE");

    return daybookTransaction;
  }

  // https://www.amino.dk/forums/t/154369.aspx
  handleInvoiceMarkedUncollectible(invoice: Stripe.Invoice) {
    throw new Error("Not implemented");
  }

  handleInvoiceVoided(invoice: Stripe.Invoice) {
    throw new Error("Not implemented");
  }

  handleChargeSucceeded(charge: Stripe.Charge) {
    throw new Error("Not implemented");
  }

  handlePayoutPaid(payout: Stripe.Payout) {
    throw new Error("Not implemented");
  }

  handlePayoutFailed(payout: Stripe.Payout) {
    throw new Error("Not implemented");
  }

  async getDaybookTransactionLinesFromInvoice(invoice: Stripe.Invoice) {
    const exchangeRate = await this.getExchangeRate(invoice.currency);
    const taxLines = await this.getDaybookTransactionLinesFromTaxAmounts(
      invoice,
      exchangeRate
    );
    const lines: DaybookTransactionLineInput[] = [
      {
        amount:
          Math.round((invoice.amount_due - (invoice.tax ?? 0)) * exchangeRate) /
          100,
        side: "credit",
        accountId: (
          await this.getSalesAccount(invoice.customer_address?.country)
        ).id,
        currencyId: "DKK",
        priority: 0,
      },
      ...taxLines,
      {
        amount: invoice.amount_due / 100,
        side: "debit",
        accountId: (await this.getSalesCreditAccount()).id,
        currencyId: invoice.currency,
        priority: 2,
      },
      {
        amount: invoice.amount_due / 100,
        side: "credit",
        accountId: (await this.getUnrealizedExchangeRateGainAccount()).id,
        currencyId: invoice.currency,
        priority: 3,
      },
      {
        amount: Math.round(invoice.amount_due * exchangeRate) / 100,
        side: "debit",
        accountId: (await this.getUnrealizedExchangeRateGainAccount()).id,
        currencyId: "DKK",
        priority: 3,
      },
    ];

    return lines;
  }

  async getDaybookTransactionLinesFromCharge(charge: Stripe.Charge) {
    const stripe = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2022-11-15",
    });
    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction as string
    );
    const exchangeRate = balanceTransaction.exchange_rate ?? 1;
    const invoice = await stripe.invoices.retrieve(charge.invoice as string);
    const salesAccount = await this.getSalesAccount(
      invoice.customer_address?.country
    );
    const salesDaybookTransactionLine =
      await this.getDaybookTransactionLineByStripeIdAndAccountId(
        invoice.id,
        salesAccount.id
      );

    if (!salesDaybookTransactionLine) {
      throw new Error(`Could not find transaction for invoice (${invoice.id})`);
    }

    const postedDkkAmount = (salesDaybookTransactionLine.amount ?? 0) * 100;
    const chargeDkkAmount = Math.round(charge.amount * exchangeRate);
    const amountDifference = chargeDkkAmount - postedDkkAmount;

    const daybookTransaction: DaybookTransactionLineInput[] = [
      {
        amount: chargeDkkAmount / 100,
        side: "debit",
        accountId: (await this.getStripeAccount()).id,
        currencyId: "DKK",
        priority: 0,
        text: charge.description ?? charge.id,
      },
      {
        amount: charge.amount / 100,
        side: "credit",
        accountId: (await this.getSalesCreditAccount()).id,
        currencyId: charge.currency,
        priority: 1,
        text: charge.description ?? charge.id,
      },
    ];

    if (charge.currency !== "DKK") {
      daybookTransaction.push(
        {
          amount: postedDkkAmount / 100,
          side: "credit",
          accountId: (await this.getUnrealizedExchangeRateGainAccount()).id,
          currencyId: "DKK",
          priority: 2,
          text: charge.description ?? charge.id,
        },
        {
          amount: charge.amount / 100,
          side: "debit",
          accountId: (await this.getUnrealizedExchangeRateGainAccount()).id,
          currencyId: charge.currency,
          priority: 2,
          text: charge.description ?? charge.id,
        }
      );

      // TODO: handle case where there are multiple charges on an invoice
      if (amountDifference !== 0) {
        daybookTransaction.push({
          amount: amountDifference / 100,
          side: "debit",
          accountId: (await this.getRealizedExchangeRateGainAccount()).id,
          currencyId: "DKK",
          priority: 3,
          text: charge.description ?? charge.id,
        });
      }
    }

    return daybookTransaction;
  }

  async getDaybookTransactionLinesFromTaxAmounts(
    invoice: Stripe.Invoice,
    exchangeRate: number
  ) {
    const taxLines: DaybookTransactionLineInput[] = [];

    for (const taxAmount of invoice.total_tax_amounts) {
      const taxRate = taxAmount.tax_rate;

      if (typeof taxRate === "string") {
        throw new Error("total_tax_amounts.tax_rate is not expanded");
      }

      if (taxAmount.amount === 0) {
        continue;
      }

      if (taxRate.country === "DK" && taxRate.percentage === 25) {
        taxLines.push({
          amount: Math.round(taxAmount.amount * exchangeRate) / 100,
          side: "credit",
          currencyId: "DKK",
          accountId: (await this.getDkVatAccount()).id,
          priority: 1,
        });
      } else {
        throw new Error(
          `Unknown tax rate: ${taxRate.country ?? "null"} ${
            taxRate.percentage
          }%`
        );
      }
    }

    return taxLines;
  }

  /**
   * Posts a daybook transaction to the Billy API.
   * https://www.billy.dk/api/#v2daybooktransactions
   */
  async createDaybookTransaction(
    daybookTransaction: DaybookTransactionInput,
    type: Prisma.StripeType
  ) {
    if (!daybookTransaction.voucherNo) {
      throw new Error("voucherNo is required");
    }

    log.debug("Creating daybook transaction", daybookTransaction);

    const transaction = await prisma.transaction.create({
      data: {
        status: "PENDING",
        stripeId: daybookTransaction.voucherNo,
        stripeType: type,
      },
    });

    try {
      const response = await this.client
        .post("daybookTransactions", {
          json: { daybookTransaction },
        })
        .json<Response<"daybookTransactions", DaybookTransaction[]>>();

      if (!response.meta.success) {
        log.debug("Failed to create daybook transaction", response);
        throw new Error(response.erroMessage);
      }

      await prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: "SUCCESS",
          billyId: response.daybookTransactions[0]!.id,
        },
      });

      return response;
    } catch (error) {
      log.error("Failed to create daybook transaction", error as Error);
      await prisma.transaction.delete({ where: { id: transaction.id } });
      throw error;
    }
  }

  async getDaybookTransactionLineByVoucherNoAndAccountNo(
    voucherNo: string,
    accountNo: number
  ) {
    const response = await this.client
      .get("daybookTransactions", {
        searchParams: {
          voucherNo,
        },
      })
      .json<Response<"daybookTransactions", DaybookTransaction[]>>();

    return response.daybookTransactions[0]!.lines!.find(
      (line) => line.accountId === accountNo.toString()
    );
  }

  async getDaybookTransactionLineByStripeIdAndAccountId(
    stripeId: string,
    accountId: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: {
        stripeId,
      },
    });

    if (!transaction || !transaction.billyId) {
      throw new Error(
        `Could not find daybookTransaction for Stripe ID (${stripeId})`
      );
    }

    const response = await this.client
      .get(
        "daybookTransactionLines?daybookTransactionId=" + transaction.billyId
      )
      .json<Response<"daybookTransactionLines", DaybookTransactionLine[]>>();

    return response.daybookTransactionLines!.find(
      (line) => line.accountId === accountId
    );
  }

  async getDaybookTransactionByStripeId(stripeId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: {
        stripeId,
      },
    });

    if (!transaction || !transaction.billyId) {
      throw new Error(
        `Could not find daybookTransaction for Stripe ID (${stripeId})`
      );
    }

    return this.getDaybookTransaction(transaction.billyId);
  }

  async getDaybookTransaction(id: string) {
    const response = await this.client
      .get("daybookTransactions/" + id)
      .json<Response<"daybookTransaction", DaybookTransaction>>();

    return response.daybookTransaction;
  }

  async getExchangeRate(id: string) {
    const response = await this.client
      .get("currencies/" + id)
      .json<Response<"currency", Currency>>();

    return response.currency.exchangeRate;
  }

  async getDaybook() {
    const response = await this.client
      .get("daybooks", {
        searchParams: {
          isArchived: false,
        },
      })
      .json<Response<"daybooks", Daybook[]>>();

    return response.daybooks[0]!;
  }

  async getTaxRate(country?: string | null) {
    if (!country || country === "DK") {
      return this.getDKTaxRate();
    } else if (EU_COUNTRY_CODES.includes(country)) {
      return this.getEuServicesTaxRate();
    } else {
      return this.getNonEuServicesTaxRate();
    }
  }

  async getDKTaxRate() {
    const taxRates = await this.getTaxRates();

    return taxRates.find((taxRate) => taxRate.predefinedTag === "2014_sales")!;
  }

  async getEuServicesTaxRate() {
    const taxRates = await this.getTaxRates();

    return taxRates.find((taxRate) => taxRate.predefinedTag === "2014_sales")!;
  }

  async getNonEuServicesTaxRate() {
    const taxRates = await this.getTaxRates();

    return taxRates.find(
      (taxRate) => taxRate.predefinedTag === "2014_salesNonEu"
    )!;
  }

  async getTaxRates() {
    if (this.taxRates) {
      return this.taxRates;
    }

    const response = await this.client
      .get("taxRates")
      .json<Response<"taxRates", TaxRate[]>>();

    this.taxRates = response.taxRates;

    return response.taxRates;
  }

  async getSalesAccount(country?: string | null) {
    if (!country || country === "DK") {
      return this.getDKSalesAccount();
    } else if (EU_COUNTRY_CODES.includes(country)) {
      return this.getEuServicesSalesAccount();
    } else {
      return this.getNonEuServicesSalesAccount();
    }
  }

  async getDKSalesAccount() {
    return this.getAccount(1110);
  }

  async getNonEuServicesSalesAccount() {
    return this.getAccount(1130);
  }

  async getEuServicesSalesAccount() {
    return this.getAccount(1150);
  }

  async getRealizedExchangeRateGainAccount() {
    return this.getAccount(2210);
  }

  async getFeesAccount() {
    return this.getAccount(2320);
  }

  async getBankAccount() {
    return this.getAccount(5710);
  }

  async getStripeAccount() {
    return this.getAccount(5711);
  }

  async getSalesCreditAccount() {
    return this.getAccount(5810);
  }

  async getUnrealizedExchangeRateGainAccount() {
    return this.getAccount(7150);
  }

  getDkVatAccount() {
    return this.getAccount(7250);
  }

  async getAccount(accountNo: number) {
    return (await this.getAccounts()).find(
      (account) => account.accountNo === accountNo
    )!;
  }

  async getAccounts() {
    if (this.accounts) {
      return this.accounts;
    }

    const response = await this.client
      .get("accounts")
      .json<Response<"accounts", Account[]>>();

    this.accounts = response.accounts;

    return response.accounts;
  }
}

import got, { Got } from "got";

type Input<T> = Omit<T, "id">;
type Response<K extends string, V extends unknown> = {
  [key in K]: V;
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
  private client: Got;

  constructor(apiKey: string) {
    this.client = got.extend({
      prefixUrl: "https://api.billysbilling.com/v2",
      headers: {
        "X-Access-Token": apiKey,
      },
    });
  }

  async createDaybookTransaction(daybookTransaction: DaybookTransactionInput) {
    const response = await this.client
      .post("daybookTransactions", {
        json: { daybookTransaction },
      })
      .json<Response<"daybookTransaction", DaybookTransaction>>();

    return response;
  }

  async createDaybookTransactionLine(
    daybookTransactionLine: DaybookTransactionLineInput
  ) {
    const response = await this.client
      .post("daybookTransactionLines", {
        json: { daybookTransactionLine },
      })
      .json<Response<"daybookTransactionLine", DaybookTransactionLine>>();

    return response.daybookTransactionLine;
  }

  async getDefaultDKSalesAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "1110",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
  }

  async getDefaultEuServicesSalesAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "1150",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
  }

  async getDefaultOutsideEuServicesSalesAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "1130",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
  }

  async getDefaultDKTaxRate() {
    const response = await this.client
      .get("taxRates")
      .json<Response<"taxRates", TaxRate[]>>();

    return response.taxRates.find(
      (taxRate) => taxRate.predefinedTag === "2014_sales"
    )!;
  }

  async getDefaultEuServicesTaxRate() {
    const response = await this.client
      .get("taxRates")
      .json<Response<"taxRates", TaxRate[]>>();

    return response.taxRates.find(
      (taxRate) => taxRate.predefinedTag === "2014_sales"
    )!;
  }

  async getDefaultOutsideEuServicesTaxRate() {
    const response = await this.client
      .get("taxRates")
      .json<Response<"taxRates", TaxRate[]>>();

    return response.taxRates.find(
      (taxRate) => taxRate.predefinedTag === "2014_salesNonEu"
    )!;
  }

  async getTaxRate(country?: string | null) {
    if (!country || country === "DK") {
      return this.getDefaultDKTaxRate();
    } else if (EU_COUNTRY_CODES.includes(country)) {
      return this.getDefaultEuServicesTaxRate();
    } else {
      return this.getDefaultOutsideEuServicesTaxRate();
    }
  }

  async getSalesAccount(country?: string | null) {
    if (!country || country === "DK") {
      return this.getDefaultDKSalesAccount();
    } else if (EU_COUNTRY_CODES.includes(country)) {
      return this.getDefaultEuServicesSalesAccount();
    } else {
      return this.getDefaultOutsideEuServicesSalesAccount();
    }
  }

  async getDefaultBankAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "5710",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
  }

  async getDefaultStripeAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "5711",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
  }

  async getDefaultFeesAccount() {
    const response = await this.client
      .get("accounts", {
        searchParams: {
          accountNo: "2320",
        },
      })
      .json<Response<"accounts", Account[]>>();

    return response.accounts[0]!;
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
}

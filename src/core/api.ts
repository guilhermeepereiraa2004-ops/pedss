import type {
  Checkout,
  Company,
  Identity,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  Settings,
  Coupon,
  Expense,
} from "./model.ts";

/** Contract for a future server boundary. No HTTP or database adapter is enabled. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
export type PublicProduct = Omit<Product, "costCents" | "extras"> & {
  extras: Omit<Product["extras"][number], "costCents">[];
};
export type PublicStore = {
  company: Pick<Company, "id" | "slug" | "name" | "logo" | "primaryColor">;
  settings: Settings;
  products: PublicProduct[];
  offers: Pick<
    Coupon,
    | "code"
    | "description"
    | "kind"
    | "value"
    | "minSubtotalCents"
    | "validFrom"
    | "validUntil"
    | "perCustomerLimit"
  >[];
  availability: { open: boolean; reason: string };
  revision: string;
};
export type PublicOrder = Omit<Order, "requestId" | "history" | "lines"> & {
  lines: Omit<Order["lines"][number], "unitCostCents">[];
  history: Pick<Order["history"][number], "id" | "at" | "to" | "reason" | "kind">[];
};
export type CheckoutCommand = {
  idempotencyKey: string;
  catalogRevision: string;
  lines: {
    productId: string;
    quantity: number;
    extraIds: string[];
    pizza?: import("./pizza.ts").PizzaSelection;
    removedIngredients: string[];
    notes: string;
  }[];
  customer: Checkout;
};
export type ChangeOrderCommand = {
  status: OrderStatus;
  reason: string;
  expectedUpdatedAt: string;
};
export type ChangePaymentCommand = {
  status: PaymentStatus;
  reason: string;
  expectedUpdatedAt: string;
};
export type ApiFailure = {
  code: "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNAVAILABLE";
  message: string;
  fieldErrors?: Record<string, string>;
  requestId: string;
};
/** Implement with sanitized endpoints, never by transferring the local Workspace aggregate. */
export interface DeliveryApi {
  currentUser(): Promise<Identity | null>;
  getStore(slug: string): Promise<PublicStore>;
  checkout(storeId: string, command: CheckoutCommand): Promise<PublicOrder>;
  trackOrder(bearerToken: string): Promise<PublicOrder>;
  listOrders(storeId: string, cursor?: string): Promise<Page<Order>>;
  changeOrder(storeId: string, orderId: string, command: ChangeOrderCommand): Promise<Order>;
  changePayment(storeId: string, orderId: string, command: ChangePaymentCommand): Promise<Order>;
}

/** Authenticated, tenant-scoped business endpoints; never included in the public menu. */
export interface BusinessApi {
  listCoupons(storeId: string): Promise<Coupon[]>;
  saveCoupon(storeId: string, coupon: Coupon): Promise<Coupon>;
  listExpenses(storeId: string, month?: string): Promise<Page<Expense>>;
  saveExpense(storeId: string, expense: Expense): Promise<Expense>;
  archiveExpense(storeId: string, expenseId: string, voided: boolean): Promise<void>;
  getOverview(storeId: string): Promise<import("./analytics.ts").BusinessOverviewData>;
}

/** Future bulk endpoint must rebuild validation and authorize the tenant in one transaction. */
export interface CatalogApi {
  /** Assign missing stable SKU codes on the server, then return only this store's management catalog. */
  exportCatalog(storeId: string): Promise<{
    products: Product[];
    codesAssigned: number;
    storeName: string;
    storeSlug: string;
  }>;
  importCatalog(
    storeId: string,
    command: {
      document: import("./catalogImport.ts").CatalogImportDocument;
      allowUpdates: boolean;
      expectedRevision: string;
      idempotencyKey: string;
    },
  ): Promise<{ created: number; updated: number; revision: string }>;
}

export const CUSTOMER_AUTH_CHANGED_EVENT = "customer-auth-changed";

export function notifyCustomerAuthChanged() {
  window.dispatchEvent(new Event(CUSTOMER_AUTH_CHANGED_EVENT));
}

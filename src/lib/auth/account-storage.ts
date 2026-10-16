// Only a cache namespace, never evidence of authentication or permission.
let owner: string | null | undefined;
export function setStorageOwner(userId: string | null | undefined) { owner = userId; }
export function getStorageOwner() { return owner; }
export function accountStorageKey(base: string) {
  return `${base}:account:${owner === undefined ? "pending" : owner === null ? "guest-v2" : encodeURIComponent(owner)}`;
}

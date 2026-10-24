const ACTIVE_KEY = "deviceKey";
const REGISTRY_KEY = "deviceKeys";
const COOKIE_NAME = "deviceKeys";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
const COOKIE_VALUE_LIMIT = 3800;

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DeviceRegistry = {
  active: string | null;
  byEmail: Record<string, string>;
};

function isDeviceKey(value: string | null | undefined): value is string {
  return !!value && GUID_RE.test(value.trim());
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode can block storage. The cookie still keeps the device.
  }
}

function removeStorageItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures and keep the cookie copy.
  }
}

function readCookie(): DeviceRegistry | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)deviceKeys=([^;]*)/);
  if (!match?.[1]) return null;
  try {
    return parseRegistry(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function writeCookie(registry: DeviceRegistry) {
  if (typeof document === "undefined") return;
  let payload = JSON.stringify(registry);
  if (payload.length > COOKIE_VALUE_LIMIT) {
    const emails = Object.keys(registry.byEmail);
    const trimmed: Record<string, string> = {};
    for (const email of emails.slice(-20)) {
      trimmed[email] = registry.byEmail[email];
    }
    payload = JSON.stringify({ active: registry.active, byEmail: trimmed });
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(payload)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function parseRegistry(raw: string | null): DeviceRegistry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DeviceRegistry>;
    const byEmail: Record<string, string> = {};
    for (const [email, key] of Object.entries(parsed.byEmail ?? {})) {
      if (isDeviceKey(key)) byEmail[normalizeEmail(email)] = normalizeKey(key);
    }
    const active = isDeviceKey(parsed.active) ? normalizeKey(parsed.active) : null;
    return { active, byEmail };
  } catch {
    return null;
  }
}

function loadRegistry(): DeviceRegistry {
  const storedRaw = readStorageItem(REGISTRY_KEY);
  const fromStorage = parseRegistry(storedRaw);
  const fromCookie = readCookie();
  const legacy = readStorageItem(ACTIVE_KEY);
  const legacyKey = isDeviceKey(legacy) ? normalizeKey(legacy) : null;

  // A saved registry is the source of truth, including an empty active key.
  // The cookie is only the backup for when the browser drops localStorage.
  if (fromStorage) {
    return {
      active: fromStorage.active ?? legacyKey,
      byEmail: { ...fromCookie?.byEmail, ...fromStorage.byEmail },
    };
  }

  return {
    active: legacyKey ?? fromCookie?.active ?? null,
    byEmail: { ...(fromCookie?.byEmail ?? {}) },
  };
}

function saveRegistry(registry: DeviceRegistry) {
  writeStorageItem(REGISTRY_KEY, JSON.stringify(registry));
  if (registry.active) writeStorageItem(ACTIVE_KEY, registry.active);
  else removeStorageItem(ACTIVE_KEY);
  writeCookie(registry);
}

/** Key for the signed-in account. Restores it from the cookie if the browser dropped localStorage. */
export function readActiveDeviceKey(): string | null {
  const hadRegistry = readStorageItem(REGISTRY_KEY) != null;
  const registry = loadRegistry();
  const storedActive = readStorageItem(ACTIVE_KEY);
  if (
    !hadRegistry ||
    (registry.active != null && storedActive !== registry.active)
  ) {
    saveRegistry(registry);
  }
  return registry.active;
}

/**
 * Send this account's own key. A shared phone keeps a key per student, so
 * signing in as someone else does not replace the first student's device.
 */
export function selectDeviceKeyForLogin(email: string): void {
  const registry = loadRegistry();
  const known = registry.byEmail[normalizeEmail(email)];
  if (known) {
    registry.active = known;
  } else if (Object.keys(registry.byEmail).length > 0) {
    registry.active = null;
  }
  saveRegistry(registry);
}

/** Remember the key the server accepted for this student, on this browser only. */
export function rememberDeviceKey(
  email: string | null | undefined,
  deviceKey: string | null | undefined
) {
  if (!isDeviceKey(deviceKey)) return;
  const registry = loadRegistry();
  const key = normalizeKey(deviceKey);
  registry.active = key;
  if (email?.trim()) registry.byEmail[normalizeEmail(email)] = key;
  saveRegistry(registry);
}

/** Copy a saved key back into place before the first request. Does not invent a new device. */
export function restoreDeviceKey() {
  readActiveDeviceKey();
}

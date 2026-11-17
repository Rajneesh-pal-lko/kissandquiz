// Small safe wrappers around browser storage. Storage can be missing or throw
// (private mode, in-app browsers, full quota), so every call is guarded.

type Kind = "local" | "session";

function store(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function load<T>(key: string, kind: Kind = "local"): T | null {
  try {
    const raw = store(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown, kind: Kind = "local"): void {
  try {
    store(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: saving progress is a convenience, not required.
  }
}

export function remove(key: string, kind: Kind = "local"): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    // Ignore.
  }
}

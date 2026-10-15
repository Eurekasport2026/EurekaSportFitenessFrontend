type SharedRead = {
  controller: AbortController;
  promise: Promise<unknown>;
  subscribers: number;
  settled: boolean;
  expiresAt: number;
  cleanup?: ReturnType<typeof setTimeout>;
};

const reads = new Map<string, SharedRead>();
let channel: BroadcastChannel | undefined;
let listening = false;

export function isReadCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function clearReads(prefix: string) {
  for (const [key, read] of reads) {
    if (!key.startsWith(prefix)) continue;
    clearTimeout(read.cleanup);
    read.controller.abort();
    reads.delete(key);
  }
}

function listenForInvalidation() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel("eureka-api-reads");
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === "auth" || event.data === "admin") {
          clearReads(event.data === "auth" ? "" : "/api/admin/");
          if (event.data === "auth") window.dispatchEvent(new Event("eureka-auth-changed"));
        }
      };
    } catch { /* Pending reads can still be shared; completed editor reads will not be cached. */ }
  }
  // A returned tab must verify the current account before reusing editor data.
  window.addEventListener("focus", () => {
    for (const [key, read] of reads) {
      if (key.startsWith("/api/admin/") && read.settled) {
        clearTimeout(read.cleanup);
        reads.delete(key);
      }
    }
  });
}

export function invalidateClientReads(scope: "auth" | "admin" = "admin") {
  listenForInvalidation();
  clearReads(scope === "auth" ? "" : "/api/admin/");
  channel?.postMessage(scope);
}

/** Browser-only sharing. Server requests and completed session checks are never cached. */
export function readClientResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  cacheMs = 0,
): Promise<T> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (typeof window === "undefined") {
    return load(signal ? AbortSignal.any([signal, AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000));
  }
  listenForInvalidation();
  const lifetime = channel ? cacheMs : 0;
  let read = reads.get(key);
  if (read && (read.controller.signal.aborted || (read.settled && read.expiresAt <= Date.now()))) {
    clearTimeout(read.cleanup);
    reads.delete(key);
    read = undefined;
  }
  if (!read) {
    const controller = new AbortController();
    const entry: SharedRead = {
      controller, subscribers: 0, settled: false, expiresAt: 0, promise: Promise.resolve(),
    };
    entry.promise = Promise.resolve()
      .then(() => load(AbortSignal.any([controller.signal, AbortSignal.timeout(35000)])))
      .then(value => {
        controller.signal.throwIfAborted();
        entry.settled = true;
        if (lifetime > 0 && reads.get(key) === entry) {
          entry.expiresAt = Date.now() + lifetime;
          entry.cleanup = setTimeout(() => { if (reads.get(key) === entry) reads.delete(key); }, lifetime);
        } else if (reads.get(key) === entry) reads.delete(key);
        return value;
      })
      .catch(error => {
        entry.settled = true;
        if (reads.get(key) === entry) reads.delete(key);
        controller.signal.throwIfAborted();
        throw error;
      });
    reads.set(key, entry);
    read = entry;
  }
  const shared = read;
  if (!shared.settled) clearTimeout(shared.cleanup);
  shared.subscribers++;
  return new Promise<T>((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      signal?.removeEventListener("abort", onAbort);
      shared.subscribers--;
      if (!shared.settled && shared.subscribers === 0) {
        // Strict Mode immediately subscribes again during its setup/cleanup probe.
        shared.cleanup = setTimeout(() => {
          if (shared.subscribers === 0 && reads.get(key) === shared) {
            reads.delete(key);
            shared.controller.abort();
          }
        }, 0);
      }
    };
    const onAbort = () => { release(); reject(signal?.reason); };
    signal?.addEventListener("abort", onAbort, { once: true });
    shared.promise.then(value => {
      if (released) return;
      release();
      if (shared.controller.signal.aborted) { reject(shared.controller.signal.reason); return; }
      resolve(value as T);
    }, error => {
      if (released) return;
      release();
      reject(error);
    });
  });
}

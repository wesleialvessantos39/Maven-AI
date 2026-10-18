// Context7 SDK 0.5.1 — Copyright (c) 2021 Upstash, Inc. MIT.
// Generated from third_party/context7/packages/sdk/src. See third_party/context7/LICENSE.

// third_party/context7/packages/sdk/src/error/index.ts
var Context7Error = class extends Error {
  code;
  status;
  requestId;
  rateLimit;
  retryable;
  cause;
  constructor(message, options = {}) {
    super(message);
    this.name = "Context7Error";
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.rateLimit = options.rateLimit;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
};
var Context7UrlError = class extends Context7Error {
  constructor(url) {
    super(
      `Context7 client was passed an invalid URL. You should pass a URL starting with http:// or https://. Received: "${url}".`,
      { code: "invalid_url" }
    );
    this.name = "Context7UrlError";
  }
};
var Context7JSONParseError = class extends Context7Error {
  constructor(body, options = {}) {
    const truncatedBody = body.length > 200 ? `${body.slice(0, 200)}...` : body;
    super(`Unable to parse response body: ${truncatedBody}`, {
      ...options,
      code: options.code ?? "invalid_json_response"
    });
    this.name = "Context7JSONParseError";
  }
};

// third_party/context7/packages/sdk/src/http/abort.ts
function validateTimeout(timeout) {
  if (timeout !== false && (!Number.isFinite(timeout) || timeout <= 0)) {
    throw new TypeError("timeout must be a positive number or false");
  }
}
function resolveSignal(signal) {
  return typeof signal === "function" ? signal() : signal;
}
function createAbortState(signals, timeout) {
  validateTimeout(timeout);
  const activeSignals = [
    ...new Set(signals.filter((signal) => signal !== void 0))
  ];
  if (timeout === false && activeSignals.length === 0) {
    return { timedOut: () => false, cleanup: () => void 0 };
  }
  const controller = new AbortController();
  let didTimeOut = false;
  const listeners = /* @__PURE__ */ new Map();
  for (const signal of activeSignals) {
    const abort = () => controller.abort(signal.reason);
    if (signal.aborted) {
      abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
    listeners.set(signal, abort);
  }
  const timer = timeout === false ? void 0 : setTimeout(() => {
    didTimeOut = true;
    controller.abort(new Error(`Request timed out after ${timeout}ms`));
  }, timeout);
  return {
    signal: controller.signal,
    timedOut: () => didTimeOut,
    cleanup: () => {
      if (timer !== void 0) clearTimeout(timer);
      for (const [signal, listener] of listeners) {
        signal.removeEventListener("abort", listener);
      }
    }
  };
}
function abortError(cause, timedOut) {
  return new Context7Error(timedOut ? "Request timed out" : "Request was aborted", {
    code: timedOut ? "request_timeout" : "request_aborted",
    retryable: timedOut,
    cause
  });
}
function isContext7AbortError(error) {
  return error instanceof Context7Error && (error.code === "request_aborted" || error.code === "request_timeout");
}
async function awaitWithSignal(value, signal) {
  if (!signal) return value;
  let onAbort;
  const aborted = new Promise((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    return await Promise.race([value, aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
async function wait(milliseconds, signal) {
  if (milliseconds <= 0) return;
  await new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason ?? new Error("Request was aborted"));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

// third_party/context7/packages/sdk/src/http/retry.ts
var DEFAULT_RETRY_STATUSES = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
function createRetryPolicy(config) {
  const retries = config === false ? 0 : config?.retries ?? 5;
  if (!Number.isInteger(retries) || retries < 0) {
    throw new TypeError("retry.retries must be a non-negative integer");
  }
  return {
    retries,
    backoff: config === false ? () => 0 : config?.backoff ?? defaultBackoff,
    statuses: new Set(config === false ? [] : config?.statuses ?? DEFAULT_RETRY_STATUSES)
  };
}
function isTransientStatus(status) {
  return DEFAULT_RETRY_STATUSES.has(status);
}
function retryDelay(backoff, retryAfter) {
  return Math.max(backoff, retryAfter === void 0 ? 0 : retryAfter * 1e3);
}
function defaultBackoff(retryCount) {
  return Math.exp(retryCount) * 50;
}

// third_party/context7/packages/sdk/src/http/response.ts
function extractResponseMetadata(response, attempt) {
  const rateLimit = {
    limit: parseOptionalNumber(
      response.headers.get("ratelimit-limit") ?? response.headers.get("x-ratelimit-limit")
    ),
    remaining: parseOptionalNumber(
      response.headers.get("ratelimit-remaining") ?? response.headers.get("x-ratelimit-remaining")
    ),
    reset: parseOptionalNumber(
      response.headers.get("ratelimit-reset") ?? response.headers.get("x-ratelimit-reset")
    ),
    retryAfter: parseRetryAfter(response.headers.get("retry-after"))
  };
  return {
    status: response.status,
    requestId: response.headers.get("x-request-id") ?? response.headers.get("x-context7-request-id") ?? void 0,
    rateLimit: Object.values(rateLimit).some((value) => value !== void 0) ? rateLimit : void 0,
    attempt
  };
}
async function parseSuccessResponse(response, metadata) {
  if (response.headers.get("content-type")?.includes("application/json")) {
    return { result: await parseJson(response, metadata) };
  }
  return {
    result: await response.text(),
    headers: extractTxtResponseHeaders(response.headers)
  };
}
async function throwResponseError(response, metadata, retryable) {
  const rawBody = await response.text();
  let errorBody = {};
  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const { error, message } = parsed;
        errorBody = {
          error: typeof error === "string" ? error : void 0,
          message: typeof message === "string" ? message : void 0
        };
      }
    } catch (cause) {
      if (response.headers.get("content-type")?.includes("application/json")) {
        throw jsonParseError(rawBody, metadata, cause, retryable);
      }
    }
  }
  throw new Context7Error(errorBody.message || errorBody.error || response.statusText, {
    code: errorBody.error ?? "http_error",
    status: response.status,
    requestId: metadata.requestId,
    rateLimit: metadata.rateLimit,
    retryable
  });
}
async function parseJson(response, metadata) {
  const rawBody = await response.text();
  try {
    return JSON.parse(rawBody);
  } catch (cause) {
    throw jsonParseError(rawBody, metadata, cause, false);
  }
}
function jsonParseError(body, metadata, cause, retryable) {
  return new Context7JSONParseError(body, {
    status: metadata.status,
    requestId: metadata.requestId,
    rateLimit: metadata.rateLimit,
    retryable,
    cause
  });
}
function extractTxtResponseHeaders(headers) {
  const page = headers.get("x-context7-page");
  const limit = headers.get("x-context7-limit");
  const totalPages = headers.get("x-context7-total-pages");
  const hasNext = headers.get("x-context7-has-next");
  const hasPrev = headers.get("x-context7-has-prev");
  const totalTokens = headers.get("x-context7-total-tokens");
  if (!page || !limit || !totalPages || !hasNext || !hasPrev || !totalTokens) return void 0;
  return {
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10),
    totalPages: Number.parseInt(totalPages, 10),
    hasNext: hasNext === "true",
    hasPrev: hasPrev === "true",
    totalTokens: Number.parseInt(totalTokens, 10)
  };
}
function parseOptionalNumber(value) {
  if (value === null) return void 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function parseRetryAfter(value) {
  if (value === null) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return void 0;
  return Math.max(0, Math.ceil((date - Date.now()) / 1e3));
}

// third_party/context7/packages/sdk/src/http/index.ts
var DEFAULT_TIMEOUT = 3e4;
var HttpClient = class {
  baseUrl;
  headers;
  options;
  retry;
  fetch;
  authToken;
  onResponse;
  constructor(config) {
    this.options = {
      cache: config.cache,
      signal: config.signal,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      keepAlive: config.keepAlive ?? true
    };
    validateTimeout(this.options.timeout);
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    if (!isHttpUrl(this.baseUrl)) throw new Context7UrlError(this.baseUrl);
    this.headers = { "Content-Type": "application/json", ...config.headers };
    this.authToken = config.authToken;
    if (!config.fetch && !globalThis.fetch) {
      throw new TypeError("A fetch implementation is required");
    }
    this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.onResponse = config.onResponse;
    this.retry = createRetryPolicy(config.retry);
  }
  async request(request) {
    const method = request.method ?? "POST";
    const abortState = createAbortState(
      [resolveSignal(this.options.signal), request.signal],
      request.timeout ?? this.options.timeout
    );
    try {
      if (abortState.signal?.aborted) {
        throw abortError(abortState.signal.reason, abortState.timedOut());
      }
      const init = {
        cache: normalizeCache(request.cache ?? this.options.cache),
        method,
        body: request.body === void 0 ? void 0 : JSON.stringify(request.body),
        keepalive: this.options.keepAlive,
        signal: abortState.signal
      };
      const { response, metadata } = await this.fetchWithRetry(
        buildUrl(this.baseUrl, method, request),
        init,
        method,
        abortState
      );
      if (!response.ok) {
        await throwResponseError(
          response,
          metadata,
          isTransientStatus(response.status) || this.retry.statuses.has(response.status)
        );
      }
      return await parseSuccessResponse(response, metadata);
    } catch (error) {
      if (abortState.signal?.aborted && !isContext7AbortError(error)) {
        throw abortError(error, abortState.timedOut());
      }
      throw error;
    } finally {
      abortState.cleanup();
    }
  }
  async fetchWithRetry(url, init, method, abortState) {
    const canRetry = method === "GET";
    for (let attempt = 0; attempt <= this.retry.retries; attempt++) {
      if (abortState.signal?.aborted) {
        throw abortError(abortState.signal.reason, abortState.timedOut());
      }
      const headers = typeof this.authToken === "function" ? this.headersForToken(await awaitWithSignal(this.authToken(), abortState.signal)) : this.headersForToken(this.authToken);
      if (abortState.signal?.aborted) {
        throw abortError(abortState.signal.reason, abortState.timedOut());
      }
      let response;
      try {
        response = await this.fetch(url, { ...init, headers });
      } catch (cause) {
        if (abortState.signal?.aborted) {
          throw abortError(cause, abortState.timedOut());
        }
        if (canRetry && attempt < this.retry.retries) {
          await wait(this.retry.backoff(attempt), abortState.signal);
          continue;
        }
        throw new Context7Error(errorMessage(cause), {
          code: "network_error",
          retryable: true,
          cause
        });
      }
      const metadata = extractResponseMetadata(response, attempt);
      this.onResponse?.(metadata);
      const shouldRetry = canRetry && this.retry.statuses.has(response.status) && attempt < this.retry.retries;
      if (!shouldRetry) return { response, metadata };
      await response.body?.cancel().catch(() => void 0);
      await wait(
        retryDelay(this.retry.backoff(attempt), metadata.rateLimit?.retryAfter),
        abortState.signal
      );
    }
    throw new Error("Unreachable retry state");
  }
  headersForToken(authToken) {
    if (this.authToken !== void 0 && !authToken) {
      throw new Context7Error("The auth token provider returned an empty token", {
        code: "authentication_error",
        retryable: false
      });
    }
    return authToken ? { ...this.headers, Authorization: `Bearer ${authToken}` } : this.headers;
  }
};
function buildUrl(baseUrl, method, request) {
  const url = [baseUrl, ...request.path ?? []].join("/");
  if (method !== "GET" || !request.query) return url;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(request.query)) {
    if (value === void 0) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) query.append(key, String(item));
  }
  const queryString = query.toString();
  return queryString ? `${url}?${queryString}` : url;
}
function isHttpUrl(url) {
  if (url !== url.trim() || /[\r\n]/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
function normalizeCache(cache) {
  return cache === false ? void 0 : cache;
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// third_party/context7/packages/sdk/src/commands/command.ts
var Command = class {
  request;
  endpoint;
  constructor(request, endpoint) {
    this.request = request;
    this.endpoint = endpoint;
  }
  /**
   * Execute the command using a client.
   */
  async exec(client) {
    return this.requestResult(client);
  }
  async requestResult(client) {
    const { result } = await client.request({ ...this.request, path: [this.endpoint] });
    if (result === void 0) {
      throw new Context7Error("Request did not return a result", {
        code: "invalid_response"
      });
    }
    return result;
  }
};

// third_party/context7/packages/sdk/src/utils/format.ts
function formatCodeSnippet(snippet) {
  const codeBlocks = snippet.codeList.map((c) => `\`\`\`${c.language}
${c.code}
\`\`\``).join("\n\n");
  const content = snippet.codeDescription ? `${snippet.codeDescription}

${codeBlocks}` : codeBlocks;
  return {
    title: snippet.codeTitle,
    content,
    source: snippet.codeId
  };
}
function formatInfoSnippet(snippet) {
  return {
    title: snippet.breadcrumb || "Documentation",
    content: snippet.content,
    source: snippet.pageId
  };
}
function formatLibrary(r) {
  return {
    id: r.id,
    name: r.title,
    description: r.description,
    totalSnippets: r.totalSnippets ?? 0,
    trustScore: r.trustScore ?? 0,
    benchmarkScore: r.benchmarkScore ?? 0,
    versions: r.versions
  };
}
function getTrustScoreLabel(trustScore) {
  if (trustScore === void 0 || trustScore < 0) return "Unknown";
  if (trustScore >= 7) return "High";
  if (trustScore >= 4) return "Medium";
  return "Low";
}
function formatLibraryAsText(library) {
  const lines = [
    `- Title: ${library.name}`,
    `- Context7-compatible library ID: ${library.id}`,
    `- Description: ${library.description}`
  ];
  if (library.totalSnippets > 0) {
    lines.push(`- Code Snippets: ${library.totalSnippets}`);
  }
  lines.push(`- Trust Score: ${getTrustScoreLabel(library.trustScore)}`);
  if (library.benchmarkScore > 0) {
    lines.push(`- Benchmark Score: ${library.benchmarkScore}`);
  }
  if (library.versions && library.versions.length > 0) {
    lines.push(`- Versions: ${library.versions.join(", ")}`);
  }
  return lines.join("\n");
}
function formatLibrariesAsText(libraries) {
  if (libraries.length === 0) {
    return "No documentation libraries found matching your query.";
  }
  return libraries.map(formatLibraryAsText).join("\n----------\n");
}

// third_party/context7/packages/sdk/src/commands/get-context/index.ts
var DEFAULT_TYPE = "json";
var GetContextCommand = class extends Command {
  responseType;
  constructor(query, libraryId, options) {
    const { type = DEFAULT_TYPE, ...requestOptions } = options ?? {};
    super(
      {
        method: "GET",
        query: { query, libraryId, type },
        ...requestOptions
      },
      "v2/context"
    );
    this.responseType = type;
  }
  async exec(client) {
    const result = await this.requestResult(client);
    if (this.responseType === "txt" && typeof result === "string") {
      return result;
    }
    const apiResult = result;
    const codeDocs = apiResult.codeSnippets.map(formatCodeSnippet);
    const infoDocs = apiResult.infoSnippets.map(formatInfoSnippet);
    return [...codeDocs, ...infoDocs];
  }
};

// third_party/context7/packages/sdk/src/commands/search/index.ts
var DEFAULT_TYPE2 = "json";
var SearchCommand = class extends Command {
  constructor(query, options) {
    const { type = DEFAULT_TYPE2, libraries, version, language, ...requestOptions } = options ?? {};
    super(
      {
        method: "GET",
        query: { query, type, library: libraries, version, language },
        ...requestOptions
      },
      "v3/search"
    );
  }
};

// third_party/context7/packages/sdk/src/commands/search-library/index.ts
var DEFAULT_TYPE3 = "json";
var SearchLibraryCommand = class extends Command {
  responseType;
  constructor(query, libraryName, options) {
    if (!query || !libraryName) {
      throw new Context7Error("query and libraryName are required");
    }
    const { type = DEFAULT_TYPE3, ...requestOptions } = options ?? {};
    super(
      {
        method: "GET",
        query: { query, libraryName },
        ...requestOptions
      },
      "v2/libs/search"
    );
    this.responseType = type;
  }
  async exec(client) {
    const result = await this.requestResult(client);
    const libraries = result.results.map(formatLibrary);
    if (this.responseType === "txt") {
      return formatLibrariesAsText(libraries);
    }
    return libraries;
  }
};

// third_party/context7/packages/sdk/src/client.ts
var DEFAULT_BASE_URL = "https://context7.com/api";
var API_KEY_PREFIX = "ctx7sk";
var Context7 = class {
  httpClient;
  constructor(config = {}) {
    const credential = resolveCredential(config);
    if (credential.kind === "apiKey" && !credential.value.startsWith(API_KEY_PREFIX)) {
      console.warn(`API key should start with '${API_KEY_PREFIX}'`);
    }
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      headers: {
        ...withoutAuthorizationHeader(config.headers)
      },
      authToken: credential.value,
      retry: config.retry,
      cache: config.cache ?? "no-store",
      timeout: config.timeout,
      signal: config.signal,
      keepAlive: config.keepAlive,
      fetch: config.fetch,
      onResponse: config.onResponse
    });
  }
  /**
   * Search for libraries matching the given query
   * @param query The user's question or task (used for relevance ranking)
   * @param libraryName The library name to search for
   * @param options Response format options
   * @returns Array of matching libraries (json) or formatted text (txt)
   */
  async searchLibrary(query, libraryName, options) {
    const command = new SearchLibraryCommand(query, libraryName, options);
    return command.exec(this.httpClient);
  }
  /**
   * Get documentation context for a library
   * @param query The user's question or task
   * @param libraryId Context7 library ID (e.g., "/react/react")
   * @param options Response format options
   * @returns Documentation as Documentation[] (json, default) or string (txt)
   */
  async getContext(query, libraryId, options) {
    const command = new GetContextCommand(query, libraryId, options);
    return command.exec(this.httpClient);
  }
  /**
   * Search documentation without resolving a library first
   * @param query The user's question or task
   * @param options Library, version, language, response format, and request options
   * @returns SearchResponse by default, or formatted text when type is "txt"
   * @throws Context7Error with status 404 when no documentation matches
   */
  async search(query, options) {
    const command = new SearchCommand(query, options);
    return command.exec(this.httpClient);
  }
};
function resolveCredential(config) {
  if (config.apiKey) return { kind: "apiKey", value: config.apiKey };
  if (config.authToken) return { kind: "authToken", value: config.authToken };
  const environmentApiKey = getEnvironmentApiKey();
  if (environmentApiKey) return { kind: "apiKey", value: environmentApiKey };
  throw new Context7Error(
    "Authentication is required. Pass apiKey or authToken, or set CONTEXT7_API_KEY."
  );
}
function getEnvironmentApiKey() {
  return typeof process === "undefined" ? void 0 : process.env?.CONTEXT7_API_KEY;
}
function withoutAuthorizationHeader(headers) {
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(([name]) => name.toLowerCase() !== "authorization")
  );
}
export {
  Context7,
  Context7Error,
  Context7JSONParseError,
  Context7UrlError
};

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/file-utils.ts
function getMimeForExtension(extension = "", defaultType = "video/mp4") {
  extension = extension.toLowerCase();
  if (extension && extension in mimeTypes) {
    return mimeTypes[extension];
  }
  return defaultType;
}
function getExtensionForMime(contentType, defaultExtension = ".mp4") {
  const match = contentType && Object.entries(mimeTypes).find(([ext, mime]) => contentType.startsWith(mime));
  return match ? match[0] : defaultExtension;
}
function sanitizeUploadOptions(filename = "upload", contentType = "", defaultContentType) {
  if (contentType === "application/octet-stream") {
    contentType = "";
  }
  if (/charset/.test(contentType)) {
    contentType = contentType.replace(/;?.*charset.*$/, "");
  }
  let [name, ext] = filename.split(/(?=\.[^\.\\\/]+$)/);
  ext ||= getExtensionForMime(contentType || defaultContentType || "");
  filename = `${name}${ext}`;
  if (!contentType || [".vtt", ".srt"].includes(ext)) {
    contentType = getMimeForExtension(ext, defaultContentType);
  }
  return { filename, contentType };
}
var mimeTypes;
var init_file_utils = __esm({
  "src/utils/file-utils.ts"() {
    "use strict";
    mimeTypes = {
      ".7z": "application/x-7z-compressed",
      ".asf": "video/x-ms-asf",
      ".avi": "video/x-msvideo",
      ".csv": "text/csv",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".f4v": "video/x-f4v",
      ".flv": "video/x-flv",
      ".gif": "image/gif",
      ".jpg": "image/jpeg",
      ".m4a": "audio/mp4",
      ".m4v": "video/x-m4v",
      ".mkv": "video/x-matroska",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".mp4": "video/mp4",
      ".mpg": "video/mpeg",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".rar": "application/x-rar-compressed",
      ".srt": "application/x-subrip",
      ".svg": "image/svg+xml",
      ".swf": "application/x-shockwave-flash",
      ".ts": "video/mp2t",
      ".txt": "text/plain",
      ".wmv": "video/x-ms-wmv",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".zip": "application/zip",
      ".mks": "video/x-matroska",
      ".mts": "model/vnd.mts",
      ".vtt": "text/vtt",
      ".wma": "audio/x-ms-wma"
    };
  }
});

// src/utils/is-utils.ts
function isPlainObject(val) {
  if (_toString.call(val) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.getPrototypeOf({});
}
function isBlobLike(val) {
  return typeof val?.stream === "function";
}
function titleCase(val) {
  return `${val[0]}${val.slice(1)}`;
}
var _toString;
var init_is_utils = __esm({
  "src/utils/is-utils.ts"() {
    "use strict";
    ({ toString: _toString } = Object.prototype);
  }
});

// src/utils/multipart-utils.ts
function appendJSONToForm(form, fieldName, data) {
  form.append(fieldName, JSON.stringify(data));
}
async function appendFileToForm(form, fieldName, input, uploadOptions = {}) {
  const {
    file,
    options
  } = await polyfills_default.uploadParser.parse(input, uploadOptions);
  form.append(fieldName, file, options.filename);
  return options;
}
async function uploadMultipart(rev, method, endpoint, form, uploadOptions, options = {}) {
  const {
    headers: optHeaders
  } = options;
  const headers = new polyfills_default.Headers(optHeaders);
  options.headers = headers;
  const data = polyfills_default.beforeFileUploadRequest(form, headers, uploadOptions, options);
  const { body } = await rev.request(method, endpoint, data, options);
  return body;
}
var LOCAL_PROTOCOLS, uploadParser;
var init_multipart_utils = __esm({
  "src/utils/multipart-utils.ts"() {
    "use strict";
    init_polyfills();
    init_rev_error();
    init_file_utils();
    init_is_utils();
    LOCAL_PROTOCOLS = ["blob:", "data:"];
    uploadParser = {
      async string(value, options) {
        const url = polyfills_default.parseUrl(value);
        if (LOCAL_PROTOCOLS.includes(url.protocol)) {
          const file = await (await polyfills_default.fetch(url)).blob();
          return uploadParser.blob(file, options);
        }
        if (options.disableExternalResources) {
          throw new Error(`${url.protocol} protocol not allowed`);
        }
        if (url.protocol === "file:") {
          return uploadParser.localFile(url, options);
        }
        throw new TypeError("Only Blob / DateURI URLs are supported");
      },
      async localFile(url, options) {
        if (options.disableExternalResources) {
          throw new Error("file: protocol not allowed");
        }
        return uploadParser.response(await polyfills_default.fetch(url), options);
      },
      async stream(value, options) {
        const { contentType } = options;
        if (!(value instanceof ReadableStream)) {
          throw new TypeError("Only Blob / Files are supported for file uploads. Pass a File/Blob object");
        }
        const response = new Response(value, {
          headers: contentType ? { "content-type": contentType } : {}
        });
        return uploadParser.response(response, options);
      },
      async response(response, options) {
        const { body, headers } = response;
        if (!response.ok || !body) {
          const err = await RevError.create(response);
          throw err;
        }
        return uploadParser.blob(
          await response.blob(),
          options
        );
      },
      async blob(value, options) {
        let {
          filename = value.name ?? "upload",
          contentType = value.type ?? "",
          defaultContentType
        } = options;
        const sanitized = sanitizeUploadOptions(filename, contentType, defaultContentType);
        if (value.type !== sanitized.contentType && typeof value.slice === "function") {
          value = new File([value], sanitized.filename, { type: sanitized.contentType });
        }
        return {
          file: value,
          options: {
            ...options,
            ...value.size && { contentLength: value.size },
            ...sanitized
          }
        };
      },
      async parse(value, options) {
        if (typeof value === "string" || value instanceof URL) {
          return uploadParser.string(value, options);
        }
        if (value instanceof polyfills_default.Response) {
          return uploadParser.response(value, options);
        }
        if (!isBlobLike(value)) {
          throw new TypeError("Only Blob / Files are supported for file uploads. Pass a File/Blob object");
        }
        return uploadParser.blob(value, options);
      }
    };
  }
});

// src/interop/polyfills.ts
var polyfills_exports = {};
__export(polyfills_exports, {
  default: () => polyfills_default,
  onInitialize: () => onInitialize,
  polyfills: () => polyfills,
  setPolyfills: () => setPolyfills,
  shouldInitialize: () => shouldInitialize
});
function randomValues(byteLength) {
  const values = crypto.getRandomValues(new Uint8Array(byteLength / 2));
  return Array.from(values).map((c) => c.toString(16).padStart(2, "0")).join("");
}
async function sha256Hash(value) {
  const bytes = new TextEncoder().encode(value);
  const hashed = await crypto.subtle.digest("SHA-256", bytes);
  const binary = String.fromCharCode(...new Uint8Array(hashed));
  return btoa(binary).replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "");
}
async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signed)));
}
function shouldInitialize() {
  return !!isPendingInitialize;
}
function onInitialize() {
  if (!isPendingInitialize) {
    return;
  }
  initializePromise ||= (async () => {
    while (pendingInitialize.length > 0) {
      const pending = pendingInitialize.shift();
      if (typeof pending !== "function") continue;
      try {
        const overrides = await pending(polyfills);
        Object.assign(polyfills, overrides);
      } catch (error) {
      }
    }
    isPendingInitialize = false;
    initializePromise = void 0;
  })();
  return initializePromise;
}
function setPolyfills(overrideCallback) {
  pendingInitialize.push(overrideCallback);
  isPendingInitialize = true;
}
var polyfills, polyfills_default, isPendingInitialize, initializePromise, pendingInitialize;
var init_polyfills = __esm({
  "src/interop/polyfills.ts"() {
    "use strict";
    init_multipart_utils();
    polyfills = {
      AbortController: globalThis.AbortController,
      AbortSignal: globalThis.AbortSignal,
      createAbortError(message) {
        return new DOMException(message, "AbortError");
      },
      fetch(...args) {
        return globalThis.fetch(...args);
      },
      FormData: globalThis.FormData,
      File: globalThis.File,
      Headers: globalThis.Headers,
      Request: globalThis.Request,
      Response: globalThis.Response,
      uploadParser,
      randomValues,
      sha256Hash,
      hmacSign,
      parseUrl(value) {
        return value instanceof URL ? value : new URL(value, "invalid://");
      },
      beforeFileUploadRequest(form, headers, uploadOptions, options) {
        return form;
      },
      asPlatformStream(stream) {
        return stream;
      },
      asWebStream(stream) {
        return stream;
      }
    };
    polyfills_default = polyfills;
    isPendingInitialize = false;
    initializePromise = void 0;
    pendingInitialize = [];
  }
});

// src/utils/rate-limit.ts
function rateLimit(fn2, options = {}) {
  if (fn2 && typeof fn2 === "object") {
    options = Object.assign({}, fn2, options);
    fn2 = void 0;
  }
  if (!fn2) {
    fn2 = options.fn;
  }
  if (typeof fn2 !== "function") {
    throw new TypeError("Rate limit function is not a function");
  }
  const {
    perSecond,
    perMinute,
    perHour,
    signal
  } = options;
  let limit = parseFloat(options.limit) || 1;
  let interval = parseInt(options.interval, 10);
  if (perSecond) {
    limit = parseFloat(perSecond);
    interval = 1e3;
  }
  if (perMinute) {
    limit = parseFloat(perMinute);
    interval = ONE_MINUTE;
  }
  if (perHour) {
    limit = parseFloat(perHour);
    interval = ONE_MINUTE * 60;
  }
  if (limit < 1) {
    interval /= limit;
    limit = 1;
  } else {
    limit = Math.floor(limit);
  }
  if (!Number.isFinite(limit)) {
    throw new TypeError(`Invalid limit ${limit}`);
  }
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new TypeError("Invalid interval option");
  }
  const queue = /* @__PURE__ */ new Map();
  let currentTick = 0;
  let activeCount = 0;
  const throttled = function(...args) {
    let timeout;
    return new Promise((resolve, reject) => {
      const execute = () => {
        resolve(fn2.apply(null, args));
        queue.delete(timeout);
      };
      const now = Date.now();
      if (now - currentTick > interval) {
        activeCount = 1;
        currentTick = now;
      } else if (activeCount < limit) {
        activeCount++;
      } else {
        currentTick += interval;
        activeCount = 1;
      }
      timeout = setTimeout(execute, currentTick - now);
      queue.set(timeout, reject);
    });
  };
  let abortHandler = signal ? () => throttled.abort(signal.reason ? `${signal.reason}` : void 0, true) : void 0;
  throttled.abort = (message = "Cancelled rate-limit queue", dispose = false) => {
    if (dispose) {
      signal?.removeEventListener("abort", abortHandler);
    }
    for (const [timeout, reject] of queue.entries()) {
      clearTimeout(timeout);
      reject(polyfills_default.createAbortError(message));
    }
    queue.clear();
  };
  signal?.addEventListener("abort", abortHandler);
  return throttled;
}
var ONE_MINUTE, rate_limit_default;
var init_rate_limit = __esm({
  "src/utils/rate-limit.ts"() {
    "use strict";
    init_polyfills();
    ONE_MINUTE = 60 * 1e3;
    rate_limit_default = rateLimit;
  }
});

// src/utils/rate-limit-queues.ts
function normalizeRateLimitOptions(rateLimits) {
  return {
    // include defaults if true or object
    ...rateLimits && defaultRateLimits,
    ...typeof rateLimits === "object" && rateLimits
  };
}
function makeQueue(key, value) {
  const defaultValue = defaultRateLimits[key];
  const perMinute = value ?? defaultValue;
  if (!isFinite(perMinute) || perMinute <= 0) {
    return fn;
  }
  const limit = perMinute / 12;
  const interval = 5e3;
  return rate_limit_default({ fn, limit, interval });
}
function makeQueues(rateLimits = {}) {
  const entries = Object.keys(defaultRateLimits).map((key) => [key, makeQueue(key, rateLimits[key])]);
  return Object.fromEntries(entries);
}
function clearQueues(rateLimits, message) {
  const fns = Object.values(rateLimits);
  fns.forEach((fn2) => fn2.abort?.(message));
}
var defaultRateLimits, fn;
var init_rate_limit_queues = __esm({
  "src/utils/rate-limit-queues.ts"() {
    "use strict";
    init_rate_limit();
    defaultRateLimits = {
      ["get" /* Get */]: 24e3,
      ["post" /* Post */]: 3600,
      ["searchVideos" /* SearchVideos */]: 120,
      ["uploadVideo" /* UploadVideo */]: 30,
      ["updateVideo" /* UpdateVideoMetadata */]: 30,
      ["videoDetails" /* GetVideoDetails */]: 2e3,
      ["attendeesRealtime" /* GetWebcastAttendeesRealtime */]: 2,
      ["auditEndpoint" /* AuditEndpoints */]: 60,
      ["loginReport" /* GetUsersByLoginDate */]: 10,
      ["viewReport" /* GetVideoViewReport */]: 120
    };
    fn = () => Promise.resolve();
  }
});

// src/utils/index.ts
function asValidDate(val, defaultValue) {
  if (!val) {
    return defaultValue;
  }
  if (!(val instanceof Date)) {
    val = new Date(val);
  }
  return isNaN(val.getTime()) ? defaultValue : val;
}
async function retry(fn2, shouldRetry = () => true, maxAttempts = 3, sleepMilliseconds = 1e3) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const result = await fn2();
      return result;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
        throw err;
      }
      await sleep(sleepMilliseconds);
    }
  }
  return void 0;
}
async function sleep(ms, signal) {
  return new Promise((done) => {
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cleanup);
      done();
    };
    timer = setTimeout(cleanup, ms);
    signal?.addEventListener("abort", cleanup);
  });
}
function tryParseJson(val) {
  if (val !== "null" && val) {
    try {
      return JSON.parse(val);
    } catch (err) {
    }
  }
  return null;
}
var init_utils = __esm({
  "src/utils/index.ts"() {
    "use strict";
    init_rate_limit();
    init_rate_limit_queues();
    init_is_utils();
  }
});

// src/rev-error.ts
var RevError, ScrollError;
var init_rev_error = __esm({
  "src/rev-error.ts"() {
    "use strict";
    init_utils();
    RevError = class _RevError extends Error {
      /**
       * HTTP Status Code
       */
      status;
      /**
       * Request URL/endpoint
       */
      url;
      /**
       * Rev-specific error code
       */
      code;
      /**
       * Additional error message returned by Rev API
       */
      detail;
      /**
       * @hidden
       * @param response
       * @param body
       */
      constructor(response, body) {
        const {
          status = 500,
          statusText = "",
          url
        } = response;
        super(`${status} ${statusText}`);
        if ("captureStackTrace" in Error) {
          Error.captureStackTrace(this, this.constructor);
        }
        this.status = status;
        this.url = url;
        this.code = `${status}`;
        this.detail = statusText;
        if (isPlainObject(body)) {
          if (body.code) {
            this.code = body.code;
          }
          if (body.detail) {
            this.detail = body.detail;
          }
        } else if (typeof body === "string") {
          body = body.trim();
          if (body.startsWith("{")) {
            const { code, detail } = tryParseJson(body) || {};
            if (code) {
              this.code = code;
            }
            if (detail) {
              this.detail = detail;
            }
          } else if (this.status === 429) {
            this.detail = "Too Many Requests";
          } else if (/^(<!DOCTYPE|<html)/.test(body)) {
            this.detail = body.replace(/.*<body>\s+/s, "").replace(/<\/body>.*/s, "").slice(0, 256);
          }
        }
      }
      /** @ignore */
      get name() {
        return "RevError";
      }
      /** @ignore */
      get [Symbol.toStringTag]() {
        return "RevError";
      }
      /**
       * Consume a HTTP Response's body to create a new Error instance
       * @param response
       * @returns
       */
      static async create(response) {
        let body;
        try {
          body = await response.text();
        } catch (err) {
          body = {
            code: "Unknown",
            detail: `Unable to parse error response body: ${err}`
          };
        }
        return new _RevError(response, body);
      }
    };
    ScrollError = class extends Error {
      /**
       * HTTP Status Code
       */
      status;
      /**
       * Rev-specific error code
       */
      code;
      /**
       * Additional error message returned by Rev API
       */
      detail;
      /**
       * @hidden
       * @param status
       * @param code
       * @param detail
       */
      constructor(status = 408, code = "ScrollExpired", detail = "Timeout while fetching all results in search request") {
        super("Search Scroll Expired");
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
        this.code = code;
        this.detail = detail;
      }
      /** @ignore */
      get name() {
        return this.constructor.name;
      }
      /** @ignore */
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
  }
});

// src/interop/node-multipart-utils.ts
async function getLengthFromStream(source, timeoutSeconds = 15) {
  const {
    length,
    contentLength,
    headers = {},
    path: filepath
  } = source;
  if (isFinite(length)) {
    return length;
  }
  if (isFinite(contentLength)) {
    return contentLength;
  }
  if (headers?.["content-length"]) {
    const headerLength = parseInt(headers["content-length"], 10);
    if (isFinite(headerLength)) {
      return headerLength;
    }
  }
  if (filepath) {
    return statFile(filepath, timeoutSeconds);
  }
}
async function statFile(filepath, timeoutSeconds = 15) {
  let timer;
  const timeout = new Promise((done) => {
    timer = setTimeout(done, timeoutSeconds * 1e3, {});
  });
  try {
    const stat = await Promise.race([
      import_node_fs.promises.stat(filepath),
      timeout
    ]);
    return stat?.size;
  } catch (err) {
  } finally {
    clearTimeout(timer);
  }
}
function getFilename(file) {
  if (typeof file === "string") {
    return import_node_path.default.basename(file);
  }
  const { path: _path, filename, name } = file;
  const streamPath = _path || filename || name;
  if (streamPath && typeof streamPath === "string") {
    return import_node_path.default.basename(streamPath);
  }
}
var import_node_fs, import_node_path, import_node_stream, import_web, import_promises, LOCAL_PROTOCOLS2, FETCH_PROTOCOLS, uploadParser2, FileFromStream;
var init_node_multipart_utils = __esm({
  "src/interop/node-multipart-utils.ts"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = __toESM(require("path"), 1);
    import_node_stream = require("stream");
    import_web = require("stream/web");
    init_rev_error();
    init_utils();
    init_file_utils();
    init_multipart_utils();
    init_polyfills();
    import_promises = require("stream/promises");
    LOCAL_PROTOCOLS2 = ["blob:", "data:"];
    FETCH_PROTOCOLS = ["http:", "https:", ...LOCAL_PROTOCOLS2];
    uploadParser2 = {
      async string(value, options) {
        const url = polyfills_default.parseUrl(value);
        if (options.disableExternalResources && !LOCAL_PROTOCOLS2.includes(url.protocol)) {
          throw new Error(`${url.protocol} protocol not allowed`);
        }
        if (FETCH_PROTOCOLS.includes(url.protocol)) {
          return uploadParser2.response(
            await polyfills_default.fetch(url, options),
            options
          );
        }
        return uploadParser2.localFile(url, options);
      },
      async localFile(url, options) {
        const readStream = (0, import_node_fs.createReadStream)(url);
        const { filename, contentType } = sanitizeUploadOptions(getFilename(url.pathname), "", options.contentType);
        return Promise.race([
          uploadParser2.stream(
            readStream,
            {
              filename,
              ...options,
              contentType
            }
          ),
          // will throw error if filepath cannot be accessed
          (0, import_promises.finished)(readStream)
        ]);
      },
      async blob(value, options) {
        return uploadParser.blob(value, {
          filename: getFilename(value),
          ...options
        });
      },
      async stream(value, options) {
        let {
          filename = getFilename(value),
          contentType,
          contentLength,
          defaultContentType,
          useChunkedTransfer = false
        } = options;
        const sanitized = sanitizeUploadOptions(filename, contentType, defaultContentType);
        if (!useChunkedTransfer) {
          contentLength ||= await getLengthFromStream(value);
        }
        const file = new FileFromStream(value, sanitized.filename, {
          type: sanitized.contentType,
          size: contentLength
        });
        return {
          file,
          options: {
            ...options,
            contentLength,
            ...sanitized
          }
        };
      },
      async response(response, options) {
        const { body, headers, url } = response;
        if (!response.ok || !body) {
          const err = await RevError.create(response);
          throw err;
        }
        let {
          contentLength,
          filename = getFilename(url)
        } = options;
        if (!headers.get("content-encoding")) {
          contentLength ||= parseInt(headers.get("content-length") || "") || void 0;
        }
        const contentType = headers.get("content-type");
        const opts = {
          ...options,
          filename,
          ...contentType && { contentType },
          ...contentLength ? { contentLength } : { useChunkedTransfer: true }
        };
        return uploadParser2.stream(body, opts);
      },
      async parse(value, options) {
        if (typeof value === "string" || value instanceof URL) {
          return uploadParser2.string(value, options);
        }
        if (value instanceof polyfills_default.Response) {
          return uploadParser2.response(value, options);
        }
        if (isBlobLike(value) && !value[Symbol.asyncIterator]) {
          return uploadParser2.blob(value, options);
        }
        return uploadParser2.stream(value, options);
      }
    };
    FileFromStream = class {
      #stream;
      constructor(stream, fileName = "", options) {
        this.#stream = stream;
        this.name = fileName;
        this.type = options?.type ?? "";
        this.size = options?.size ?? NaN;
        this.lastModified = options?.lastModified ?? Date.now();
      }
      name;
      type;
      size;
      lastModified;
      stream() {
        return this.#stream;
      }
      [Symbol.toStringTag] = "File";
    };
  }
});

// src/interop/node-polyfills.ts
var node_polyfills_exports = {};
__export(node_polyfills_exports, {
  default: () => node_polyfills_default
});
function randomValues2(byteLength) {
  return (0, import_node_crypto.randomBytes)(byteLength).toString("base64url");
}
async function sha256Hash2(value) {
  return (0, import_node_crypto.createHash)("sha256").update(value).digest().toString("base64url");
}
async function hmacSign2(message, secret) {
  const hmac = (0, import_node_crypto.createHmac)("sha256", secret);
  const signature = hmac.update(message).digest("base64");
  return signature;
}
var import_form_data_encoder, import_node_fetch, import_node_crypto, import_node_stream2, import_web2, import_node_url, AbortError, node_polyfills_default;
var init_node_polyfills = __esm({
  "src/interop/node-polyfills.ts"() {
    "use strict";
    import_form_data_encoder = require("form-data-encoder");
    import_node_fetch = require("node-fetch");
    import_node_crypto = require("crypto");
    import_node_stream2 = require("stream");
    import_web2 = require("stream/web");
    init_node_multipart_utils();
    import_node_url = require("url");
    AbortError = class extends Error {
      type = "aborted";
      code = 20;
      ABORT_ERR = 20;
      constructor(message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    node_polyfills_default = (polyfills2) => {
      Object.assign(polyfills2, {
        createAbortError(message) {
          return new AbortError(message);
        },
        fetch(...args) {
          return globalThis.fetch(...args).catch((err) => {
            if (err instanceof TypeError && err.cause instanceof Error) {
              throw err.cause;
            }
            throw err;
          });
        },
        FormData: import_node_fetch.FormData,
        randomValues: randomValues2,
        sha256Hash: sha256Hash2,
        hmacSign: hmacSign2,
        parseUrl(value) {
          return value instanceof URL ? value : URL.canParse(value) && !/^[a-z]:[\\\/]/i.test(value) ? new URL(value) : (0, import_node_url.pathToFileURL)(value);
        },
        uploadParser: uploadParser2,
        beforeFileUploadRequest(form, headers, uploadOptions, options) {
          const encoder = new import_form_data_encoder.FormDataEncoder(form);
          Object.assign(options, {
            body: encoder,
            // needed for undici error thrown when body is stream
            // https://fetch.spec.whatwg.org/#dom-requestinit-duplex
            duplex: "half"
          });
          for (let [key, value] of Object.entries(encoder.headers)) {
            headers.set(key, value);
          }
          headers.delete("transfer-encoding");
          return void 0;
        },
        asPlatformStream(stream) {
          if (!stream) return stream;
          return stream instanceof import_web2.ReadableStream ? import_node_stream2.Readable.fromWeb(stream) : stream;
        },
        asWebStream(stream) {
          return !stream || stream instanceof import_web2.ReadableStream ? stream : import_node_stream2.Readable.toWeb(import_node_stream2.Readable.from(stream));
        }
      });
    };
  }
});

// src/interop/node-fetch-commonjs.ts
var node_fetch_commonjs_exports = {};
__export(node_fetch_commonjs_exports, {
  default: () => node_fetch_commonjs_default
});
function beforeFileUploadRequest(form, headers, uploadOptions, options) {
  const encoder = new import_form_data_encoder2.FormDataEncoder(form);
  if (uploadOptions.useChunkedTransfer) {
    headers.set("transfer-encoding", "chunked");
  }
  options.body = import_node_stream3.Readable.from(encoder);
  for (let [key, value] of Object.entries(encoder.headers)) {
    headers.set(key, value);
  }
  return void 0;
}
var import_form_data_encoder2, import_node_stream3, node_fetch_commonjs_default;
var init_node_fetch_commonjs = __esm({
  "src/interop/node-fetch-commonjs.ts"() {
    "use strict";
    import_form_data_encoder2 = require("form-data-encoder");
    import_node_stream3 = require("stream");
    node_fetch_commonjs_default = async (polyfills2) => {
      const { default: fetch, FormData: FormData2, File: File2, Blob } = await import("node-fetch");
      Object.assign(polyfills2, {
        fetch,
        FormData: FormData2,
        File: File2,
        Blob,
        beforeFileUploadRequest
      });
    };
  }
});

// src/index-nodefetch.cts
var index_nodefetch_exports = {};
__export(index_nodefetch_exports, {
  RevClient: () => RevClient3,
  RevError: () => RevError,
  ScrollError: () => ScrollError,
  utils: () => utils
});
module.exports = __toCommonJS(index_nodefetch_exports);

// src/utils/request-utils.ts
init_rev_error();

// src/utils/paged-request.ts
var PagedRequest = class {
  current;
  total;
  done;
  options;
  /**
   * @hidden
   * @param options
   */
  constructor(options = {}) {
    this.options = {
      maxResults: Infinity,
      onProgress: (items, current, total) => {
      },
      onError: (err) => {
        throw err;
      },
      onScrollError: (err) => {
        console.warn("DEPRECATED: use onError instead of onScrollError with rev search requests");
        this.options.onError(err);
      },
      signal: void 0,
      ...options
    };
    this.current = 0;
    this.total = void 0;
    this.done = false;
  }
  /**
   * Get the next page of results from API
   */
  async nextPage() {
    const {
      onProgress,
      onError,
      signal
    } = this.options;
    if (signal?.aborted) this.done = true;
    if (this.done) {
      return {
        current: this.current,
        total: this.current,
        done: this.done,
        items: []
      };
    }
    const page = await this._requestPage();
    const result = this._parsePage(page);
    let {
      current,
      items,
      total,
      done,
      error
    } = result;
    onProgress(items, current, total);
    if (error) {
      onError(error);
    }
    return {
      current,
      items,
      total,
      done
    };
  }
  /**
   * update internal variables based on API response
   * @param page
   * @returns
   */
  _parsePage(page) {
    const { maxResults } = this.options;
    let {
      items = [],
      done = this.done,
      total,
      pageCount,
      error
    } = page;
    if (done) {
      this.done = true;
    }
    if (isFinite(total)) {
      this.total = Math.min(total, maxResults);
    }
    if (!pageCount) {
      pageCount = items.length;
    }
    const current = this.current;
    if (current + pageCount >= maxResults) {
      pageCount = maxResults - current;
      items = items.slice(0, pageCount);
      this.done = true;
    }
    this.current += pageCount;
    if (this.current === this.total) {
      this.done = true;
    }
    if (this.done) {
      this.total = this.current;
    }
    if (error) {
      this.done = true;
    }
    return {
      current,
      total: this.total,
      done: this.done,
      error,
      items
    };
  }
  /**
   * Go through all pages of results and return as an array.
   * TIP: Use the {maxResults} option to limit the maximum number of results
   *
   */
  async exec() {
    const results = [];
    for await (let hit of this) {
      results.push(hit);
    }
    return results;
  }
  /**
   * Supports iterating through results using for await...
   * @see [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
   */
  async *[Symbol.asyncIterator]() {
    const { signal } = this.options;
    do {
      const {
        items
      } = await this.nextPage();
      for await (let hit of items) {
        if (signal?.aborted) break;
        yield hit;
      }
    } while (!this.done);
  }
};

// src/utils/request-utils.ts
async function decodeBody(response, acceptType) {
  const contentType = response.headers.get("Content-Type") || acceptType || "";
  const contentLength = response.headers.get("Content-Length");
  if (contentType.startsWith("application/json") && contentLength !== "0") {
    try {
      return await response.json();
    } catch (err) {
    }
  }
  if (contentType.startsWith("text")) {
    return response.text();
  }
  return response.body;
}
var SearchRequest = class extends PagedRequest {
  query;
  _reqImpl;
  constructor(rev, searchDefinition, query = {}, options = {}) {
    super({
      onProgress: (items, current, total) => {
        const { hitsKey } = searchDefinition;
        rev.log("debug", `searching ${hitsKey}, ${current}-${current + items.length} of ${total}...`);
      },
      onError: (err) => {
        throw err;
      },
      ...options
    });
    const {
      scrollId: _ignore,
      ...queryOpt
    } = query;
    this.query = queryOpt;
    this._reqImpl = this._buildReqFunction(rev, searchDefinition);
    this.current = 0;
    this.total = Infinity;
    this.done = false;
  }
  _requestPage() {
    return this._reqImpl();
  }
  _buildReqFunction(rev, searchDefinition) {
    const {
      endpoint,
      totalKey,
      hitsKey,
      isPost = false,
      request,
      transform
    } = searchDefinition;
    const requestFn = request || (isPost ? rev.post.bind(rev) : rev.get.bind(rev));
    return async () => {
      const response = await requestFn(endpoint, this.query, { responseType: "json" });
      let {
        scrollId,
        [totalKey]: total,
        [hitsKey]: rawItems = [],
        statusCode,
        statusDescription
      } = response;
      let done = false;
      this.query.scrollId = scrollId;
      if (!scrollId) {
        done = true;
      }
      const items = typeof transform === "function" ? await Promise.resolve(transform(rawItems)) : rawItems;
      if (items.length === 0) {
        done = true;
      }
      const error = statusCode >= 400 && !!statusDescription ? new ScrollError(statusCode, statusDescription) : void 0;
      return {
        total,
        done,
        pageCount: rawItems.length,
        items,
        error
      };
    };
  }
};

// src/api/admin.ts
function adminAPIFactory(rev) {
  let roles;
  let customFields;
  const adminAPI = {
    /**
    * get mapping of role names to role IDs
    * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
    */
    async roles(cache = true) {
      if (roles && cache === true) {
        return roles;
      }
      const response = await rev.get("/api/v2/users/roles");
      if (cache) {
        roles = response;
      }
      return response;
    },
    /**
    * Get a Role (with the role id) based on its name
    * @param name Name of the Role OR RoleType. You can specify the specific enum value (preferred, only Rev 7.53+), or the localized string value in the current user's language, i.e. "Media Viewer" for english
    * @param fromCache - if true then use previously cached Role listing (more efficient)
    */
    async getRoleByName(name, fromCache = true) {
      const roles2 = await adminAPI.roles(fromCache);
      const role = roles2.find((r) => r.roleType === name || r.name === name);
      if (!role) {
        throw new TypeError(`Invalid Role Name ${name}. Valid values are: ${roles2.flatMap((r) => r.roleType ? [r.roleType, r.name] : [r.name]).join(", ")}`);
      }
      return {
        id: role.id,
        name: role.roleType || role.name
      };
    },
    /**
    * get list of custom fields
    * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
    */
    async customFields(cache = true) {
      if (customFields && cache === true) {
        return customFields;
      }
      const response = await rev.get("/api/v2/video-fields", void 0, { responseType: "json" });
      if (cache) {
        customFields = response;
      }
      return response;
    },
    /**
    * Get a Custom Field based on its name
    * @param name name of the Custom Field
    * @param fromCache if true then use previously cached Role listing (more efficient)
    */
    async getCustomFieldByName(name, fromCache = true) {
      const customFields2 = await adminAPI.customFields(fromCache);
      const field = customFields2.find((cf) => cf.name === name);
      if (!field) {
        throw new TypeError(`Invalid Custom Field Name ${name}. Valid values are: ${customFields2.map((cf) => cf.name).join(", ")}`);
      }
      return field;
    },
    async brandingSettings() {
      return rev.get("/api/v2/accounts/branding-settings");
    },
    async webcastRegistrationFields() {
      const response = await rev.get("/api/v2/accounts/webcast-registration-fields");
      return response.registrationFields;
    },
    async createWebcastRegistrationField(registrationField) {
      const response = await rev.post("/api/v2/accounts/webcast-registration-fields", registrationField);
      return response.fieldId;
    },
    async updateWebcastRegistrationField(fieldId, registrationField) {
      return rev.put(`/api/v2/accounts/webcast-registration-fields/${fieldId}`, registrationField);
    },
    async deleteWebcastRegistrationField(fieldId) {
      return rev.delete(`/api/v2/accounts/webcast-registration-fields/${fieldId}`);
    },
    listIQCreditsUsage(query, options) {
      const searchDefinition = {
        endpoint: `/api/v2/analytics/accounts/iq-credits-usage`,
        totalKey: "total",
        hitsKey: "sessions"
      };
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    /**
    * get system health - returns 200 if system is active and responding, otherwise throws error
    */
    async verifySystemHealth() {
      await rev.get("/api/v2/system-health");
      return true;
    },
    /**
    * gets list of scheduled maintenance windows
    */
    async maintenanceSchedule() {
      const { schedules } = await rev.get("/api/v2/maintenance-schedule");
      return schedules;
    },
    /**
     * gets the user location service URL
     */
    async userLocationService() {
      return rev.get("/api/v2/user-location");
    },
    /**
     * returns an array of all expiration rules
     */
    async expirationRules() {
      return rev.get("/api/v2/expiration-rules");
    },
    async featureSettings(videoId) {
      const params = videoId ? { videoId } : void 0;
      return rev.get("/api/v2/videos/feature-settings", params);
    }
  };
  return adminAPI;
}

// src/api/audit.ts
init_rate_limit_queues();

// src/api/audit-request.ts
init_utils();

// src/utils/parse-csv.ts
function parseCSV(raw) {
  raw = raw.replace(/(\r\n|\n|\r)/gm, "\n").replace(/\n$/g, "");
  let cur = "";
  let inQuote = false;
  let fieldQuoted = false;
  let field = "";
  let row = [];
  let out = [];
  let i;
  const n = raw.length;
  function processField(field2) {
    if (fieldQuoted) {
      return field2;
    }
    if (field2 === "") {
      return void 0;
    }
    return field2.trim();
  }
  for (i = 0; i < n; i += 1) {
    cur = raw.charAt(i);
    if (!inQuote && (cur === "," || cur === "\n")) {
      field = processField(field);
      row.push(field);
      if (cur === "\n") {
        out.push(row);
        row = [];
      }
      field = "";
      fieldQuoted = false;
    } else if (cur === '"') {
      if (!inQuote) {
        inQuote = true;
        fieldQuoted = true;
      } else {
        if (raw.charAt(i + 1) === '"') {
          field += '"';
          i += 1;
        } else {
          inQuote = false;
        }
      }
    } else {
      field += cur === "\n" ? "\n" : cur;
    }
  }
  field = processField(field);
  row.push(field);
  out.push(row);
  const headers = out.shift();
  return out.map((line) => {
    const obj = {};
    line.forEach((field2, i2) => {
      if (field2 !== void 0) {
        obj[headers[i2]] = field2;
      }
    });
    return obj;
  });
}

// src/api/audit-request.ts
function parseEntry(line) {
  return {
    messageKey: line["MessageKey"],
    entityKey: line["EntityKey"],
    when: line["When"],
    entityId: line["EntityId"],
    principal: tryParseJson(line["Principal"]) || {},
    message: tryParseJson(line["Message"]) || {},
    currentState: tryParseJson(line["CurrentState"]) || {},
    previousState: tryParseJson(line["PreviousState"]) || {}
  };
}
var AuditRequest = class extends PagedRequest {
  params;
  _req;
  /**
   * @hidden
   * @param rev
   * @param endpoint
   * @param label
   * @param options
   */
  constructor(rev, endpoint, label = "audit records", { toDate, fromDate, beforeRequest, ...options } = {}) {
    if (!toDate && "endDate" in options) {
      throw new TypeError("Audit API uses toDate param instead of endDate");
    }
    if (!fromDate && "startDate" in options) {
      throw new TypeError("Audit API uses fromDate param instead of startDate");
    }
    super({
      onProgress: (items, current, total) => {
        rev.log("debug", `loading ${label}, ${current} of ${total}...`);
      },
      ...options
    });
    const { from, to } = this._parseDates(fromDate, toDate);
    this.params = {
      toDate: to.toISOString(),
      fromDate: from.toISOString()
    };
    this._req = this._buildReqFunction(rev, endpoint, beforeRequest);
  }
  _requestPage() {
    return this._req();
  }
  _buildReqFunction(rev, endpoint, beforeRequest) {
    return async () => {
      await beforeRequest?.(this);
      const response = await rev.request("GET", endpoint, this.params, { responseType: "text" });
      const {
        body,
        headers
      } = response;
      let items = parseCSV(body).map((line) => parseEntry(line));
      const remaining = parseInt(headers.get("totalRecords") || "", 10);
      Object.assign(this.params, {
        nextContinuationToken: headers.get("nextContinuationToken") || void 0,
        fromDate: headers.get("nextfromDate") || void 0
      });
      let done = !this.params.nextContinuationToken;
      return {
        items,
        // totalRecords for subsequent requests is the count return from current fromDate, rather than total for starting date range
        total: Math.max(this.total || 0, remaining),
        done
      };
    };
  }
  _parseDates(fromDate, toDate) {
    let to = asValidDate(toDate, /* @__PURE__ */ new Date());
    const defaultFrom = new Date(to);
    defaultFrom.setFullYear(to.getFullYear() - 1);
    let from = asValidDate(fromDate, defaultFrom);
    if (to < from) {
      [to, from] = [from, to];
    }
    return { from, to };
  }
};

// src/api/audit.ts
function auditAPIFactory(rev, optRateLimits) {
  const requestsPerMinute = normalizeRateLimitOptions(optRateLimits)["auditEndpoint" /* AuditEndpoints */];
  function makeOptTransform() {
    if (!requestsPerMinute) return (opts) => opts;
    const lock = makeQueue("auditEndpoint" /* AuditEndpoints */, requestsPerMinute);
    return (opts = {}) => ({
      ...opts,
      async beforeRequest(req) {
        await lock();
        return opts.beforeRequest?.(req);
      }
    });
  }
  const locks = {
    accountAccess: makeOptTransform(),
    userAccess: makeOptTransform(),
    accountUsers: makeOptTransform(),
    user: makeOptTransform(),
    accountGroups: makeOptTransform(),
    group: makeOptTransform(),
    accountDevices: makeOptTransform(),
    device: makeOptTransform(),
    accountVideos: makeOptTransform(),
    video: makeOptTransform(),
    accountWebcasts: makeOptTransform(),
    webcast: makeOptTransform(),
    principal: makeOptTransform()
  };
  const auditAPI = {
    /**
    * Logs of user login / logout / failed login activity
    */
    accountAccess(accountId, options) {
      const opts = locks.accountAccess(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/userAccess`, "UserAccess", opts);
    },
    userAccess(userId, accountId, options) {
      const opts = locks.userAccess(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/userAccess/${userId}`, `UserAccess_${userId}`, opts);
    },
    /**
    * Operations on User Records (create, delete, etc)
    */
    accountUsers(accountId, options) {
      const opts = locks.accountUsers(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/users`, "User", opts);
    },
    user(userId, accountId, options) {
      const opts = locks.user(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/users/${userId}`, "User", opts);
    },
    /**
    * Operations on Group Records (create, delete, etc)
    */
    accountGroups(accountId, options) {
      const opts = locks.accountGroups(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/groups`, "Groups", opts);
    },
    group(groupId, accountId, options) {
      const opts = locks.group(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/groups/${groupId}`, "Group", opts);
    },
    /**
    * Operations on Device Records (create, delete, etc)
    */
    accountDevices(accountId, options) {
      const opts = locks.accountDevices(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/devices`, "Devices", opts);
    },
    device(deviceId, accountId, options) {
      const opts = locks.device(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/devices/${deviceId}`, "Device", opts);
    },
    /**
    * Operations on Video Records (create, delete, etc)
    */
    accountVideos(accountId, options) {
      const opts = locks.accountVideos(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/videos`, "Videos", opts);
    },
    video(videoId, accountId, options) {
      const opts = locks.video(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/videos/${videoId}`, "Video", opts);
    },
    /**
    * Operations on Webcast Records (create, delete, etc)
    */
    accountWebcasts(accountId, options) {
      const opts = locks.accountWebcasts(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/scheduledEvents`, "Webcasts", opts);
    },
    webcast(eventId, accountId, options) {
      const opts = locks.webcast(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/scheduledEvents/${eventId}`, `Webcast`, opts);
    },
    /**
    * All operations a single user has made
    */
    principal(userId, accountId, options) {
      const opts = locks.principal(options);
      return new AuditRequest(rev, `/network/audit/accounts/${accountId}/principals/${userId}`, "Principal", opts);
    }
  };
  return auditAPI;
}

// src/utils/merge-headers.ts
init_polyfills();
function mergeHeaders(source, other) {
  const merged = new polyfills_default.Headers(source);
  new polyfills_default.Headers(other).forEach((value, key) => merged.set(key, value));
  return merged;
}

// src/api/oauth.ts
init_polyfills();
var PLACEHOLDER = "http://rev";
function getOAuth2AuthorizationUrl(config, code_challenge, state) {
  const url = new URL("/api/v2/oauth2/authorize", config.revUrl);
  url.search = new URLSearchParams({
    client_id: config.oauthApiKey,
    code_challenge,
    response_type: "code",
    redirect_uri: config.redirectUri,
    ...state && { state }
  }).toString();
  return url.toString();
}
async function getOAuth2PKCEVerifier(codeVerifier = polyfills_default.randomValues(48)) {
  const codeChallenge = await polyfills_default.sha256Hash(codeVerifier);
  return { codeVerifier, codeChallenge };
}
async function buildLegacyOAuthQuery(config, oauthSecret, state = "1") {
  const { hmacSign: hmacSign3 } = polyfills_default;
  const RESPONSE_TYPE = "code";
  const {
    oauthApiKey: apiKey,
    redirectUri
  } = config;
  const timestamp = /* @__PURE__ */ new Date();
  const verifier = `${apiKey}::${timestamp.toISOString()}`;
  const signature = await hmacSign3(verifier, oauthSecret);
  return {
    apiKey,
    signature,
    verifier,
    "redirect_uri": redirectUri,
    "response_type": RESPONSE_TYPE,
    state
  };
}
function parseLegacyOAuthRedirectResponse(url) {
  if (typeof url === "string") {
    url = new URL(url, PLACEHOLDER);
  }
  if (url instanceof URL) {
    url = url.searchParams;
  }
  const query = url instanceof URLSearchParams ? Object.fromEntries(url) : url;
  const {
    "auth_code": authCode = "",
    state = "",
    error = void 0
  } = query;
  return {
    isSuccess: !error,
    // URL parsing parses pluses (+) as spaces, which can cause later validation to fail
    authCode: `${authCode}`.replace(/ /g, "+"),
    state,
    error
  };
}

// src/api/auth.ts
function authAPIFactory(rev) {
  const authAPI = {
    async loginToken(apiKey, secret, options) {
      return rev.post("/api/v2/authenticate", {
        apiKey,
        secret
      }, options);
    },
    async extendSessionToken(apiKey) {
      return rev.post(`/api/v2/auth/extend-session-timeout/${apiKey}`);
    },
    async logoffToken(apiKey) {
      return rev.delete(`/api/v2/tokens/${apiKey}`);
    },
    async loginUser(username, password, options) {
      return rev.post("/api/v2/user/login", {
        username,
        password
      }, options);
    },
    async logoffUser(userId) {
      return rev.post("/api/v2/user/logoff", { userId });
    },
    async extendSessionUser(userId) {
      return rev.post("/api/v2/user/extend-session-timeout", { userId });
    },
    async loginJWT(jwtToken, options) {
      return rev.get("/api/v2/jwtauthenticate", { jwt_token: jwtToken }, options);
    },
    async loginGuestRegistration(webcastId, jwtToken, options) {
      const opts = {
        ...options,
        headers: mergeHeaders(options?.headers, { "x-requested-with": "xmlhttprequest" })
      };
      return rev.post(`/external/auth/jwt/${webcastId}`, { token: `vbrick_rev ${jwtToken}` }, options);
    },
    async extendSession() {
      return rev.post("/api/v2/user/extend-session");
    },
    async verifySession() {
      return rev.get("/api/v2/user/session");
    },
    /**
     * @deprecated - use logoffUser - put here because it's a common misspelling
     */
    get logoutUser() {
      return authAPI.logoffUser;
    },
    /**
     * @deprecated - use logoffToken - put here because it's a common misspelling
     */
    get logoutToken() {
      return authAPI.logoffToken;
    },
    /**
     * generate the Authorization URL for the OAuth2 flow as well as the codeVerifier for the
     * subsequent Access Token request. You *must* store the codeVerifier somehow (i.e. serverside database matched to user's state/cookies/session, or on browser SessionStorage) to be able to complete the OAuth2 login flow.
     * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page
     * @param state optional state to pass back to redirectUri once complete
     * @param verifier the code_verifier to use when generating the code challenge. Can be any string 43-128 characters in length, just these characters: [A-Za-z0-9._~-]. If not provided then code will automatically generate a suitable value
     * @returns A valid oauth flow URL + the code_verifier to save for later verification
     */
    async buildOAuth2Authentication(config, state = "1", verifier) {
      const { codeChallenge, codeVerifier } = await getOAuth2PKCEVerifier(verifier);
      const _cfg = { revUrl: rev.url, ...config };
      const url = getOAuth2AuthorizationUrl(_cfg, codeChallenge, state);
      return {
        url: `${url}`,
        codeVerifier
      };
    },
    async loginOAuth2(config, code, codeVerifier, options) {
      return rev.post("/api/v2/oauth2/token", {
        // sometimes the authCode can get mangled, with the pluses in the code being replaced by spaces.
        code: code.replace(/ /g, "+"),
        client_id: config.oauthApiKey,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier
      }, options);
    },
    /**
     * @deprecated
     * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page
     * @param oauthSecret Secret from Rev Admin -> Security. This is a DIFFERENT value from the
     *                    User Secret used for API login. Do not expose client-side!
     * @param state optional state to pass back to redirectUri once complete
     * @returns A valid oauth flow URL
     */
    async buildOAuthAuthenticationURL(config, oauthSecret, state = "1") {
      const query = await buildLegacyOAuthQuery(config, oauthSecret, state);
      const url = new URL("/api/v2/oauth/authorization", rev.url);
      url.search = `${new URLSearchParams(query)}`;
      return `${url}`;
    },
    /**
     * @deprecated
     */
    buildOAuthAuthenticationQuery: buildLegacyOAuthQuery,
    /**
     * @deprecated
     */
    parseOAuthRedirectResponse: parseLegacyOAuthRedirectResponse,
    /**
     * @deprecated
     * @param config
     * @param authCode
     * @returns
     */
    async loginOAuth(config, authCode) {
      const GRANT_AUTH = "authorization_code";
      const {
        oauthApiKey: apiKey,
        redirectUri
      } = config;
      authCode = authCode.replace(/ /g, "+");
      return rev.post("/api/v2/oauth/token", {
        authCode,
        apiKey,
        redirectUri,
        grantType: GRANT_AUTH
      });
    },
    /**
     * @deprecated
     * @param config
     * @param refreshToken
     * @returns
     */
    async extendSessionOAuth(config, refreshToken) {
      const GRANT_REFRESH = "refresh_token";
      const {
        oauthApiKey: apiKey
      } = config;
      return rev.post("/api/v2/oauth/token", {
        apiKey,
        refreshToken,
        grantType: GRANT_REFRESH
      });
    }
  };
  return authAPI;
}

// src/api/category.ts
function categoryAPIFactory(rev) {
  const categoryAPI = {
    async create(category) {
      return rev.post("/api/v2/categories", category, { responseType: "json" });
    },
    async details(categoryId) {
      return rev.get(`/api/v2/categories/${categoryId}`, void 0, { responseType: "json" });
    },
    async update(categoryId, category) {
      return rev.put(`/api/v2/categories/${categoryId}`, category);
    },
    async delete(categoryId) {
      return rev.delete(`/api/v2/categories/${categoryId}`);
    },
    /**
     * get list of categories in system
     * @see {@link https://revdocs.vbrick.com/reference#getcategories}
     */
    async list(parentCategoryId, includeAllDescendants) {
      const payload = Object.assign(
        {},
        parentCategoryId && { parentCategoryId },
        includeAllDescendants != void 0 && { includeAllDescendants }
      );
      const { categories } = await rev.get("/api/v2/categories", payload, { responseType: "json" });
      return categories;
    },
    /**
     * get list of categories that current user has ability to add videos to
     */
    async listAssignable() {
      return rev.get("/api/v2/assignable-categories");
    }
  };
  return categoryAPI;
}

// src/api/channel.ts
function channelAPIFactory(rev) {
  const channelAPI = {
    async create(channel) {
      const { channelId } = await rev.post("/api/v2/channels", channel, { responseType: "json" });
      return channelId;
    },
    async update(channelId, channel) {
      return rev.put(`/api/v2/channels/${channelId}`, channel);
    },
    /**
     * @summary Patch Channel
     * Partially edits the members and details of a channel. You do not need to provide the fields that you are not changing.
     * @example
     * ```js
     * const rev = new RevClient(...config...);
     * await rev.connect();
     *
     * // add a member
     * await rev.channel.patch(channelId, [{ op: 'add', path: '/Members/-', value: { id: userId, type: 'User', roleTypes: 'Uploader' } }]);
     *
     * // add current user as an admin
     * const user = await rev.user.details('me');
     * await rev.channel.patch(channelId, [{ op: 'add', path: '/Members/-', value: { id: user.userId, type: 'User', roleTypes: 'Admin' } }]);
     *
     * // change sort order
     * await rev.channel.patch(channelId, [{ op: 'replace', path: '/DefaultSortOrder', value: 'recommended' }]);
     *
     * ```
     * @param channelId
     * @param operations
     * @param options
     */
    async patch(channelId, operations, options) {
      await rev.patch(`/api/v2/channels/${channelId}`, operations, options);
    },
    async delete(channelId) {
      return rev.delete(`/api/v2/channels/${channelId}`);
    },
    /**
     * get list of channels in system
     * @see {@link https://revdocs.vbrick.com/reference/getchannels}
     */
    list(start = 0, options = {}) {
      return new ChannelListRequest(rev, start, options);
    },
    async addMembers(channelId, members) {
      const operations = members.map((member) => {
        return { op: "add", path: "/Members/-", value: member };
      });
      await rev.patch(`/api/v2/channels/${channelId}`, operations);
    },
    async removeMembers(channelId, members) {
      const operations = members.map((member) => {
        const entityId = typeof member === "string" ? member : member.id;
        return { op: "remove", path: "/Members", value: entityId };
      });
      await rev.patch(`/api/v2/channels/${channelId}`, operations);
    },
    get uploadLogo() {
      return rev.upload.channelLogo;
    },
    get uploadHeader() {
      return rev.upload.channelHeader;
    },
    async downloadLogo(channel, options) {
      const endpoint = channel?.logoKey ? `/api/v2/channels/thumbnails/${channel?.logoKey}` : channel?.logoUri;
      if (!endpoint) throw new TypeError("Channel has no logo");
      const response = await rev.request("GET", endpoint, void 0, {
        responseType: "stream",
        ...options
      });
      return response;
    },
    async downloadHeader(channel, options) {
      const endpoint = channel?.headerKey ? `/api/v2/channels/thumbnails/${channel?.headerKey}` : channel?.headerUri;
      if (!endpoint) throw new TypeError("Channel has no header");
      const response = await rev.request("GET", endpoint, void 0, {
        responseType: "stream",
        ...options
      });
      return response;
    },
    /**
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText, options = {}) {
      const searchDefinition = {
        endpoint: `/api/v2/search/access-entity${options?.assignable ? "/assignable" : ""}`,
        totalKey: "totalEntities",
        hitsKey: "accessEntities"
      };
      const query = {
        type: options.type || "Channel",
        ...searchText && { q: searchText }
      };
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    /**
     * @summary Get Channels For User
     * Returns only the channels and video count for the user making the API call based on their access control.
     * @param options
     */
    async listUserChannels(options) {
      return rev.get("/api/v2/search/channels", void 0, options);
    }
  };
  return channelAPI;
}
var ChannelListRequest = class {
  currentPage;
  current;
  total;
  done;
  options;
  _req;
  constructor(rev, start = 0, options = {}) {
    this.options = {
      maxResults: Infinity,
      pageSize: 10,
      onProgress: (items, current, total) => {
        rev.log("debug", `loading channels, ${current} of ${total}...`);
      },
      ...options
    };
    this.current = 0;
    this.total = Infinity;
    this.done = false;
    this.currentPage = start;
    this._req = () => {
      const params = {
        page: this.currentPage,
        size: this.options.pageSize
      };
      return rev.get("/api/v2/channels", params, { responseType: "json" });
    };
  }
  async nextPage() {
    const {
      maxResults,
      onProgress
    } = this.options;
    let current = this.current;
    let items = await this._req();
    if (!Array.isArray(items) || items.length == 0) {
      this.done = true;
      items = [];
    }
    if (current + items.length >= maxResults) {
      const delta = maxResults - current;
      items = items.slice(0, delta);
      this.done = true;
    }
    this.total = current + items.length;
    onProgress(items, current, this.total);
    this.current += items.length;
    this.currentPage += 1;
    return {
      current,
      total: this.total,
      done: this.done,
      items
    };
  }
  /**
   * Go through all pages of results and return as an array.
   * TIP: Use the {maxResults} option to limit the maximum number of results
   *
   */
  async exec() {
    const results = [];
    for await (let hit of this) {
      results.push(hit);
    }
    return results;
  }
  async *[Symbol.asyncIterator]() {
    do {
      const {
        items
      } = await this.nextPage();
      for await (let hit of items) {
        yield hit;
      }
    } while (!this.done);
  }
};

// src/api/device.ts
function deviceAPIFactory(rev) {
  const deviceAPI = {
    /**
     * Get a list of all DMEs
     * @returns
     */
    async listDMEs() {
      const response = await rev.get("/api/v2/devices/dmes");
      return response.devices;
    },
    /**
     * Get a list of devices that can be used for Zoning configuration
     * @returns
     */
    async listZoneDevices() {
      const response = await rev.get("/api/v2/zonedevices");
      return response.devices;
    },
    /**
     * Get a list of the Presentation Profiles defined in Rev
     * @returns
     */
    async listPresentationProfiles() {
      return rev.get("/api/v2/presentation-profiles");
    },
    /**
     * Create a new DME in Rev
     * @param dme
     * @returns
     */
    async add(dme) {
      return rev.post("/api/v2/devices/dmes", dme);
    },
    /**
     * Get details about the specified DME's health
     * @param deviceId
     * @returns
     */
    async healthStatus(deviceId) {
      return rev.get(`/api/v2/devices/dmes/${deviceId}/health-status`);
    },
    /**
     * Remove a DME from Rev
     * @param deviceId
     * @returns
     */
    async delete(deviceId) {
      return rev.delete(`/api/v2/devices/dmes/${deviceId}`);
    },
    /**
     * Have Rev send a reboot request to the specified DME
     * @param deviceId
     * @returns
     */
    async rebootDME(deviceId) {
      return rev.put(`/api/v2/devices/dmes/${deviceId}`);
    }
  };
  return deviceAPI;
}

// src/api/group.ts
function groupAPIFactory(rev) {
  const groupAPI = {
    /**
     * Create a group. Returns the resulting Group ID
     * @param {{name: string, userIds: string[], roleIds: string[]}} group
     * @returns {Promise<string>}
     */
    async create(group) {
      const { groupId } = await rev.post("/api/v2/groups", group);
      return groupId;
    },
    async delete(groupId) {
      await rev.delete(`/api/v2/groups/${groupId}`);
    },
    async details(groupId) {
      return rev.get(`/api/v2/groups/${groupId}`);
    },
    /**
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText, options = {}) {
      const searchDefinition = {
        endpoint: `/api/v2/search/access-entity${options?.assignable ? "/assignable" : ""}`,
        totalKey: "totalEntities",
        hitsKey: "accessEntities",
        transform: (hits) => hits.map(formatGroupSearchHit)
      };
      const query = { type: "group" };
      if (searchText) {
        query.q = searchText;
      }
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    list(options = {}) {
      return groupAPI.search(void 0, options);
    },
    listUsers(groupId, options = {}) {
      const searchDefinition = {
        endpoint: `/api/v2/search/groups/${groupId}/users`,
        totalKey: "totalUsers",
        hitsKey: "userIds"
      };
      return new SearchRequest(rev, searchDefinition, void 0, options);
    },
    /**
     * get all users in a group with full details
     * @param groupId
     * @param options
     * @returns
     */
    listUserDetails(groupId, options = {}) {
      const searchDefinition = {
        endpoint: `/api/v2/search/groups/${groupId}/users`,
        totalKey: "totalUsers",
        hitsKey: "userIds",
        transform: async (userIds) => {
          const result = [];
          for (let userId of userIds) {
            const out = { userId };
            try {
              const details = await rev.user.details(userId);
              Object.assign(out, details);
            } catch (error) {
              out.error = error;
            }
            result.push(out);
          }
          return result;
        }
      };
      return new SearchRequest(rev, searchDefinition, void 0, options);
    }
  };
  return groupAPI;
}
function formatGroupSearchHit(hit) {
  return {
    id: hit.Id,
    name: hit.Name,
    entityType: hit.EntityType
  };
}

// src/api/playlist.ts
init_utils();

// src/api/playlist-details-request.ts
init_utils();
function getSummaryFromResponse(response, hitsKey) {
  const ignoreKeys = ["scrollId", "statusCode", "statusDescription"];
  const summary = Object.fromEntries(Object.entries(response).filter(([key, value]) => {
    return !(key === hitsKey || ignoreKeys.includes(key) || Array.isArray(value));
  }));
  return summary;
}
var PlaylistDetailsRequest = class extends SearchRequest {
  playlist = {};
  get playlistName() {
    return this.playlist.playlistDetails?.name || this.playlist.name;
  }
  get searchFilter() {
    return this.playlist?.playlistType === "Dynamic" ? this.playlist.playlistDetails?.searchFilter || this.playlist.searchFilter : void 0;
  }
  /**
   * @hidden
   * @param rev
   * @param playlistId
   * @param query
   * @param options
   */
  constructor(rev, playlistId, query = {}, options = {}) {
    const searchDefinition = {
      endpoint: `/api/v2/playlists/${playlistId}`,
      totalKey: "totalVideos",
      hitsKey: "videos",
      // get summary from initial response
      request: async (endpoint, query2, options2) => {
        await rev.session.queueRequest("searchVideos" /* SearchVideos */);
        const response = await rev.get(endpoint, query2, options2);
        Object.assign(this.playlist, getSummaryFromResponse(response, "videos"));
        return response;
      }
    };
    super(rev, searchDefinition, query, options);
  }
  async getPlaylistInfo() {
    this.options.maxResults = 0;
    const { items: videos } = await this.nextPage();
    return {
      ...this.playlist,
      ...this.playlist?.playlistDetails,
      videos,
      playlistName: this.playlistName,
      searchFilter: this.searchFilter
    };
  }
};

// src/api/playlist.ts
function playlistAPIFactory(rev) {
  const playlistAPI = {
    async create(name, videos) {
      const isStatic = Array.isArray(videos);
      const payload = isStatic ? { name, playlistType: "Static", videoIds: videos } : { name, playlistType: "Dynamic", playlistDetails: videos };
      const { playlistId } = await rev.post("/api/v2/playlists", payload, { responseType: "json" });
      return playlistId;
    },
    async details(playlistId, query) {
      return rev.get(`/api/v2/playlists/${playlistId}`, query, { responseType: "json" });
    },
    listVideos(playlistId, query, options) {
      return new PlaylistDetailsRequest(rev, playlistId, query, options);
    },
    async update(playlistId, actions) {
      const isStatic = Array.isArray(actions);
      const payload = isStatic ? { playlistVideoDetails: actions } : { playlistDetails: actions };
      return rev.put(`/api/v2/playlists/${playlistId}`, payload);
    },
    async updateFeatured(actions) {
      const payload = {
        playlistVideoDetails: actions
      };
      return rev.put(`/api/v2/playlists/featured-playlist`, payload);
    },
    async delete(playlistId) {
      return rev.delete(`/api/v2/playlists/${playlistId}`);
    },
    /**
     * get list of playlists in system.
     * NOTE: return type is slightly different than API documentation
     * @see {@link https://revdocs.vbrick.com/reference#getplaylists}
     */
    async list() {
      function parsePlaylist(entry) {
        const {
          id,
          playlistId,
          featurePlaylistId,
          featuredPlaylist,
          name,
          playlistName,
          ...extra
        } = entry;
        return {
          ...extra,
          id: id ?? playlistId ?? featurePlaylistId ?? featuredPlaylist,
          name: name ?? playlistName,
          videos: entry.videos ?? entry.Videos
        };
      }
      const rawResult = await rev.get("/api/v2/playlists", void 0, { responseType: "json" });
      const hasFeatured = !Array.isArray(rawResult);
      const rawPlaylists = hasFeatured ? rawResult.playlists : rawResult;
      const output = {
        playlists: rawPlaylists.map(parsePlaylist)
      };
      if (hasFeatured) {
        if (isPlainObject(rawResult.featuredPlaylist)) {
          output.featuredPlaylist = parsePlaylist(rawResult.featuredPlaylist);
        } else if (Array.isArray(rawResult.videos)) {
          output.featuredPlaylist = parsePlaylist(rawResult);
        }
      }
      return output;
    }
  };
  return playlistAPI;
}

// src/api/recording.ts
init_utils();
function recordingAPIFactory(rev) {
  const recordingAPI = {
    async startVideoConferenceRecording(sipAddress, sipPin, title) {
      const { videoId } = await rev.post("/api/v2/vc/start-recording", { title, sipAddress, sipPin }, { responseType: "json" });
      return videoId;
    },
    async getVideoConferenceStatus(videoId) {
      const { status } = await rev.get(`/api/v2/vc/recording-status/${videoId}`, void 0, { responseType: "json" });
      return status;
    },
    async stopVideoConferenceRecording(videoId) {
      const payload = { videoId };
      const result = await rev.post(`/api/v2/vc/stop-recording`, payload, { responseType: "json" });
      return isPlainObject(result) ? result.message : result;
    },
    async startPresentationProfileRecording(request) {
      const { scheduledRecordingId } = await rev.post("/api/v2/pp/start-recording", request, { responseType: "json" });
      return scheduledRecordingId;
    },
    async getPresentationProfileStatus(recordingId) {
      const result = await rev.get(`/api/v2/pp/recording-status/${recordingId}`, void 0, { responseType: "json" });
      return result;
    },
    async stopPresentationProfileRecording(recordingId) {
      const payload = { scheduledRecordingId: recordingId };
      const result = await rev.get(`/api/v2/vc/recording-status`, payload, { responseType: "json" });
      return result;
    }
  };
  return recordingAPI;
}

// src/api/upload.ts
init_polyfills();
init_utils();
init_multipart_utils();
function splitOptions(options, defaultType) {
  const {
    filename,
    contentType,
    contentLength,
    useChunkedTransfer,
    defaultContentType = defaultType,
    ...requestOptions
  } = options;
  return {
    requestOptions,
    uploadOptions: {
      ...filename && { filename },
      ...contentType && { contentType },
      ...contentLength && { contentLength },
      ...useChunkedTransfer && { useChunkedTransfer },
      defaultContentType
    }
  };
}
function uploadAPIFactory(rev) {
  const uploadAPI = {
    /**
             * Upload a video, and returns the resulting video ID
             * @see [API Docs](https://revdocs.vbrick.com/reference/uploadvideo-1)
             *
             * @example
             * ```js
            const rev = new RevClient(...config...);
            await rev.connect();
    
            // if browser - pass in File
            const file = fileInputElement.files[0];
            // if nodejs - can pass in path to file instead
            // const file = "/path/to/local/video.mp4";
            // upload returns resulting ID when complete
            const videoId = await rev.upload.video(file, {
                uploader: 'username.of.uploader',
                title: 'video uploaded via the API',
                //categories: [EXISTING_REV_CATEGORY_NAME],
                unlisted: true,
                isActive: true
                /// ...any additional metadata
            });
            ```
             * @param file A File/Blob. if using nodejs you can also pass in the path to a file
             * @param metadata metadata to add to video (title, etc.) - see API docs
             * @param options Additional `RequestInit` options, as well as customizing the contentType/contentLength/filename of the `file` in the POST upload form (only needed if they can't be inferred from input)
             * @returns the resulting video id
             */
    async video(file, metadata = { uploader: rev.session.username ?? "" }, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "video/mp4");
      const form = new polyfills_default.FormData();
      if (!metadata.uploader) {
        const defaultUsername = rev.session.username;
        if (defaultUsername) {
          metadata.uploader = defaultUsername;
        } else {
          throw new TypeError("metadata must include uploader parameter");
        }
      }
      appendJSONToForm(form, "video", metadata);
      const filePayload = await appendFileToForm(form, "VideoFile", file, uploadOptions);
      rev.log("info", `Uploading ${filePayload.filename} (${filePayload.contentType})`);
      await rev.session.queueRequest("uploadVideo" /* UploadVideo */);
      const { videoId } = await uploadMultipart(rev, "POST", "/api/v2/uploads/videos", form, filePayload, requestOptions);
      return videoId;
    },
    /**
     * Replace an existing video with an uploaded file
     * @see [API Docs](https://revdocs.vbrick.com/reference/replacevideo)
     */
    async replaceVideo(videoId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "video/mp4");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "VideoFile", file, uploadOptions);
      rev.log("info", `Replacing ${videoId} with ${filePayload.filename} (${filePayload.contentType})`);
      await rev.session.queueRequest("uploadVideo" /* UploadVideo */);
      await uploadMultipart(rev, "PUT", `/api/v2/uploads/videos/${videoId}`, form, filePayload, requestOptions);
    },
    async transcription(videoId, file, language = "en", options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "application/x-subrip");
      const form = new polyfills_default.FormData();
      const lang = language.toLowerCase();
      if (uploadOptions.contentType === "text/plain" || uploadOptions.filename?.endsWith("txt")) {
        uploadOptions.filename = `${uploadOptions.filename || "upload"}.srt`;
      }
      const filePayload = await appendFileToForm(form, "File", file, uploadOptions);
      const metadata = {
        files: [
          { language: lang, fileName: filePayload.filename }
        ]
      };
      appendJSONToForm(form, "TranscriptionFiles", metadata);
      rev.log("info", `Uploading transcription to ${videoId} ${lang} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/transcription-files/${videoId}`, form, filePayload, requestOptions);
    },
    async supplementalFile(videoId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options);
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "File", file, uploadOptions);
      const metadata = {
        files: [
          { fileName: filePayload.filename }
        ]
      };
      appendJSONToForm(form, "SupplementalFiles", metadata);
      rev.log("info", `Uploading supplemental content to ${videoId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/supplemental-files/${videoId}`, form, filePayload, requestOptions);
    },
    /**
     *
     * @param videoId id of video to add chapters to
     * @param chapters list of chapters. Must have time value and one of title or imageFile
     * @param action replace = POST/replace existing with this payload
     *               append = PUT/add or edit without removing existing
     * @param options  additional upload + request options
     */
    async chapters(videoId, chapters, action = "replace", options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/png");
      const form = new polyfills_default.FormData();
      const metadata = {
        chapters: []
      };
      for (let [index, chapter] of chapters.entries()) {
        const {
          title,
          time,
          imageFile,
          uploadOptions: fileUploadOptions = {}
        } = chapter;
        const chapterEntry = { time };
        if (title) {
          chapterEntry.title = title;
        }
        if (imageFile) {
          const fileOpts = {
            ...uploadOptions,
            // explicitly set filename to avoid conflict with multiple chapters
            filename: `chapter${index + 1}`,
            ...fileUploadOptions
          };
          const filePayload = await appendFileToForm(form, "File", imageFile, fileOpts);
          chapterEntry.imageFile = filePayload.filename;
        }
        metadata.chapters.push(chapterEntry);
      }
      appendJSONToForm(form, "Chapters", metadata);
      rev.log("info", `${action === "replace" ? "Uploading" : "Updating"} ${metadata.chapters.length} chapters to ${videoId}`);
      const method = action === "replace" ? "POST" : "PUT";
      await uploadMultipart(rev, method, `/api/v2/uploads/chapters/${videoId}`, form, uploadOptions, requestOptions);
    },
    async thumbnail(videoId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ThumbnailFile", file, uploadOptions);
      rev.log("info", `Uploading thumbnail for ${videoId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/images/${videoId}`, form, filePayload, requestOptions);
    },
    async presentationChapters(videoId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "application/vnd.ms-powerpoint");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "PresentationFile", file, uploadOptions);
      rev.log("info", `Uploading presentation for ${videoId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/video-presentations/${videoId}`, form, filePayload, requestOptions);
    },
    async webcastPresentation(eventId, file, options) {
      const { uploadOptions, requestOptions } = splitOptions(options, "application/vnd.ms-powerpoint");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "PresentationFile", file, uploadOptions);
      rev.log("info", `Uploading presentation for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/presentations/${eventId}`, form, filePayload, requestOptions);
    },
    async webcastBackground(eventId, file, options) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ImageFile", file, uploadOptions);
      rev.log("info", `Uploading background image for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/background-image/${eventId}`, form, filePayload, requestOptions);
    },
    async webcastProducerLayoutBackground(eventId, file, options) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ImageFile", file, uploadOptions);
      rev.log("info", `Uploading producer layout background image for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/webcast-producer-bgimage/${eventId}`, form, filePayload, requestOptions);
    },
    async webcastBranding(eventId, request, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const logoOptions = {
        ...uploadOptions,
        // make sure filename is by default unique
        filename: "logo",
        ...request.logoImageOptions ?? {}
      };
      const backgroundOptions = {
        ...uploadOptions,
        // make sure filename is by default unique
        filename: "background",
        ...request.logoImageOptions ?? {}
      };
      const logoImagePayload = await appendFileToForm(form, "LogoImageFile", request.logoImage, logoOptions);
      const backgroundImagePayload = await appendFileToForm(form, "BackgroundImageFile", request.backgroundImage, backgroundOptions);
      const meta = {
        ...request.branding,
        logoImageFilename: logoImagePayload.filename,
        backgroundImageFilename: backgroundImagePayload.filename
      };
      appendJSONToForm(form, "Branding", meta);
      rev.log("info", `Uploading webcast branding to ${eventId} (${meta.logoImageFilename} ${meta.backgroundImageFilename})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/webcast-branding/${eventId}`, form, uploadOptions, requestOptions);
    },
    async channelLogo(channelId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ImageFile", file, uploadOptions);
      rev.log("info", `Uploading channel logo for ${channelId} (${filePayload.filename} ${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/channel-logo/${channelId}`, form, filePayload, requestOptions);
    },
    /**
     * @summary Upload Channel Header Image
     * @see [API Docs](https://revdocs.vbrick.com/reference/uploadchannellogofile)
     * @param channelId Id of the channel to upload image
     * @param file image file
     * @param options
     */
    async channelHeader(channelId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ImageFile", file, uploadOptions);
      rev.log("info", `Uploading channel header for ${channelId} (${filePayload.filename} ${filePayload.contentType})`);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/channel-header/${channelId}`, form, filePayload, requestOptions);
    },
    /**
     * Upload a profile image for a given user. Only account admins can upload user profile image.
     */
    async userProfileImage(userId, file, options = {}) {
      const { uploadOptions, requestOptions } = splitOptions(options, "image/jpeg");
      const form = new polyfills_default.FormData();
      const filePayload = await appendFileToForm(form, "ImageFile", file, uploadOptions);
      await uploadMultipart(rev, "POST", `/api/v2/uploads/profile-image/${userId}`, form, filePayload, requestOptions);
    }
  };
  return uploadAPI;
}

// src/api/user.ts
init_utils();
function userAPIFactory(rev) {
  async function details(userLookupValue, options = {}) {
    const { lookupType, ...requestOptions } = typeof options === "string" ? { lookupType: options } : options;
    const query = lookupType === "username" || lookupType === "email" ? { type: lookupType } : void 0;
    return rev.get(`/api/v2/users/${userLookupValue}`, query, { ...requestOptions, responseType: "json" });
  }
  const userAPI = {
    /**
     * get the list of roles available in the system (with role name and id)
     */
    get roles() {
      return rev.admin.roles;
    },
    /**
     * Create a new User in Rev
     * @param user
     * @returns the User ID of the created user
     */
    async create(user) {
      const { userId } = await rev.post("/api/v2/users", user);
      return userId;
    },
    async delete(userId) {
      await rev.delete(`/api/v2/users/${userId}`);
    },
    details,
    /**
     * Use the Details API to get information about currently logged in user
     * @param requestOptions
     */
    async profile(requestOptions) {
      return details("me", requestOptions);
    },
    /**
     * get user details by username
     * @deprecated use {@link UserAPI.details | user.details()} with `{lookupType: 'username'}`
     */
    async getByUsername(username) {
      return userAPI.details(username, { lookupType: "username" });
    },
    /**
     * get user details by email address
     * @deprecated use {@link UserAPI.details | user.details()} with `{lookupType: 'email'}`
     */
    async getByEmail(email) {
      return userAPI.details(email, { lookupType: "email" });
    },
    /**
     * Check if user exists in the system. Instead of throwing on a 401/403 error if
     * user does not exist it returns `false`. Returns {@link User | user details} if does exist,
     * instead of just `true`
     * @param userLookupValue userId, username, or email
     * @param type
     * @returns User if exists, otherwise false
     */
    async exists(userLookupValue, type) {
      const query = type === "username" || type === "email" ? { type } : void 0;
      const response = await rev.request("GET", `/api/v2/users/${userLookupValue}`, query, { responseType: "json", throwHttpErrors: false });
      return response.statusCode === 200 ? response.body : false;
    },
    /**
     * use PATCH API to add user to the specified group
     * https://revdocs.vbrick.com/reference#edituserdetails
     * @param {string} userId id of user in question
     * @param {string} groupId
     * @returns {Promise<void>}
     */
    async addToGroup(userId, groupId) {
      const operations = [
        { op: "add", path: "/GroupIds/-", value: groupId }
      ];
      await rev.patch(`/api/v2/users/${userId}`, operations);
    },
    /**
     * use PATCH API to add user to the specified group
     * https://revdocs.vbrick.com/reference#edituserdetails
     * @param {string} userId id of user in question
     * @param {string} groupId
     * @returns {Promise<void>}
     */
    async removeFromGroup(userId, groupId) {
      const operations = [
        { op: "remove", path: "/GroupIds", value: groupId }
      ];
      await rev.patch(`/api/v2/users/${userId}`, operations);
    },
    async suspend(userId) {
      const operations = [{ op: "replace", path: "/ItemStatus", value: "Suspended" }];
      await rev.patch(`/api/v2/users/${userId}`, operations);
    },
    async unsuspend(userId) {
      const operations = [{ op: "replace", path: "/ItemStatus", value: "Active" }];
      await rev.patch(`/api/v2/users/${userId}`, operations);
    },
    /**
     * search for users based on text query. Leave blank to return all users.
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText, options = {}) {
      const {
        assignable = false
      } = options;
      const searchDefinition = {
        endpoint: `/api/v2/search/access-entity${assignable ? "/assignable" : ""}`,
        totalKey: "totalEntities",
        hitsKey: "accessEntities",
        /**
         * the result of this search is uppercase keys. This transforms them to camelcase to match other API responses
         */
        transform: (items) => items.map(formatUserSearchHit)
      };
      const query = { type: "user" };
      if (searchText) {
        query.q = searchText;
      }
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    get listChannels() {
      return rev.channel.listUserChannels;
    },
    /**
     * Returns the channel and category subscriptions for the user making the API call.
     */
    async listSubscriptions() {
      return rev.get("/api/v2/users/subscriptions");
    },
    async subscribe(id, type) {
      return rev.post("/api/v2/users/subscribe", { id, type });
    },
    /**
     * Unsubscribe from specific channel or category.
     */
    async unsubscribe(id, type) {
      return rev.post("/api/v2/users/unsubscribe", { id, type });
    },
    async getNotifications(unread = false) {
      return rev.get("/api/v2/users/notifications", { unread });
    },
    /**
     *
     * @param notificationId If notificationId not provided, then all notifications for the user are marked as read.
     */
    async markNotificationRead(notificationId) {
      await rev.put("/api/v2/users/notifications", notificationId ? { notificationId } : void 0);
    },
    async loginReport(sortField, sortOrder) {
      const query = {
        ...sortField && { sortField },
        ...sortOrder && { sortOrder }
      };
      await rev.session.queueRequest("loginReport" /* GetUsersByLoginDate */);
      const { Users } = await rev.get("/api/v2/users/login-report", query, { responseType: "json" });
      return Users;
    },
    get uploadProfileImage() {
      return rev.upload.userProfileImage;
    },
    deleteProfileImage(userId) {
      return rev.delete(`/api/v2/users/${userId}/profile-image`);
    }
  };
  return userAPI;
}
function formatUserSearchHit(hit) {
  return {
    userId: hit.Id,
    entityType: hit.EntityType,
    email: hit.Email,
    firstname: hit.FirstName,
    lastname: hit.LastName,
    username: hit.UserName,
    profileImageUri: hit.ProfileImageUri
  };
}

// src/api/video.ts
init_rev_error();
init_utils();

// src/api/video-download.ts
init_utils();
function videoDownloadAPI(rev) {
  async function download(videoId, options = {}) {
    const response = await rev.request("GET", `/api/v2/videos/${videoId}/download`, void 0, {
      responseType: "stream",
      ...options
    });
    return response;
  }
  async function downloadChapter(chapter, options = {}) {
    const { imageUrl } = chapter;
    const { body } = await rev.request("GET", imageUrl, void 0, { responseType: "blob", ...options });
    return body;
  }
  async function downloadSupplemental(videoId, fileId, options) {
    const endpoint = isPlainObject(videoId) ? videoId.downloadUrl : `/api/v2/videos/${videoId}/supplemental-files/${fileId}`;
    const opts = isPlainObject(fileId) ? fileId : options;
    const { body } = await rev.request("GET", endpoint, void 0, { responseType: "blob", ...opts });
    return body;
  }
  async function downloadTranscription(videoId, language, options) {
    const endpoint = isPlainObject(videoId) ? videoId.downloadUrl : `/api/v2/videos/${videoId}/transcription-files/${language}`;
    const opts = isPlainObject(language) ? language : options;
    const { body } = await rev.request("GET", endpoint, void 0, { responseType: "blob", ...opts });
    return body;
  }
  async function downloadThumbnail(query, options = {}) {
    let {
      videoId = "",
      imageId = ""
    } = typeof query === "string" ? { imageId: query } : query;
    if (!(videoId || imageId)) {
      throw new TypeError("No video/image specified to download");
    }
    let thumbnailUrl = "";
    if (videoId) {
      thumbnailUrl = `/api/v2/videos/${videoId}/thumbnail`;
    } else if (imageId.startsWith("http")) {
      thumbnailUrl = `${imageId}${!imageId.endsWith(".jpg") ? ".jpg" : ""}`;
    } else {
      thumbnailUrl = `/api/v2/media/videos/thumbnails/${imageId}.jpg`;
    }
    const { body } = await rev.request("GET", thumbnailUrl, void 0, { responseType: "blob", ...options });
    return body;
  }
  async function downloadThumbnailSheet(thumbnailSheet, options) {
    let thumbnailSheetsUri = "";
    if (typeof thumbnailSheet === "string") {
      thumbnailSheetsUri = thumbnailSheet;
    } else if (thumbnailSheet && typeof thumbnailSheet === "object" && "thumbnailSheetsUri" in thumbnailSheet) {
      thumbnailSheetsUri = thumbnailSheet.thumbnailSheetsUri;
    } else if (thumbnailSheet?.videoId) {
      const { videoId, sheetIndex = "1" } = thumbnailSheet;
      thumbnailSheetsUri = `/api/v2/videos/${videoId}/thumbnail-sheets/${sheetIndex}`;
    }
    if (!thumbnailSheetsUri) {
      throw new TypeError("No thumbnail sheet specified to download");
    }
    const { body } = await rev.request("GET", thumbnailSheetsUri, void 0, { responseType: "blob", ...options });
    return body;
  }
  return {
    download,
    downloadChapter,
    downloadSupplemental,
    downloadThumbnail,
    downloadTranscription,
    downloadThumbnailSheet
  };
}

// src/api/video-external-access.ts
init_utils();
function videoExternalAccessAPI(rev) {
  return {
    /**
     *
     * @param videoId Id of video to submit emails for external access
     * @param q       Search string
     * @param options search options
     * @returns
     */
    listExternalAccess(videoId, q, options) {
      const searchDefinition = {
        endpoint: `/api/v2/videos/${videoId}/external-access`,
        /** NOTE: this API doesn't actually return a total, so this will always be undefined */
        totalKey: "total",
        hitsKey: "items"
      };
      const payload = q ? { q } : void 0;
      return new SearchRequest(rev, searchDefinition, payload, options);
    },
    async createExternalAccess(videoId, request) {
      await rev.post(`/api/v2/videos/${videoId}/external-access`, request);
    },
    async renewExternalAccess(videoId, request) {
      return rev.put(`/api/v2/videos/${videoId}/external-access`, request);
    },
    async deleteExternalAccess(videoId, request) {
      return rev.delete(`/api/v2/videos/${videoId}/external-access`, request);
    },
    async revokeExternalAccess(videoId, request) {
      return rev.put(`/api/v2/videos/${videoId}/external-access/revoke`, request);
    }
  };
}

// src/api/video-report-request.ts
init_utils();
var DEFAULT_INCREMENT = 30;
var DEFAULT_SORT = "asc";
function addDays(date, numDays) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + numDays);
  return d;
}
function parseOptions(options) {
  let {
    incrementDays = DEFAULT_INCREMENT,
    sortDirection = DEFAULT_SORT,
    videoIds,
    startDate,
    endDate,
    ...otherOptions
  } = options;
  incrementDays = Math.min(
    Math.max(
      1 / 24 / 60,
      parseFloat(incrementDays) || DEFAULT_INCREMENT
    ),
    30
  );
  if (Array.isArray(videoIds)) {
    videoIds = videoIds.map((s) => s.trim()).filter(Boolean).join(",");
  }
  return {
    incrementDays,
    sortDirection,
    videoIds,
    ...parseDates(startDate, endDate),
    ...otherOptions
  };
}
function parseDates(startArg, endArg) {
  const now = /* @__PURE__ */ new Date();
  let startDate = asValidDate(startArg);
  let endDate = asValidDate(endArg);
  if (!endDate) {
    if (startDate) {
      endDate = addDays(startDate, 30);
      if (endDate.getTime() > now.getTime()) {
        endDate = now;
      }
    } else {
      endDate = now;
    }
  }
  if (!startDate) {
    startDate = addDays(endDate, -30);
  }
  if (startDate.getTime() > endDate.getTime()) {
    [startDate, endDate] = [endDate, startDate];
  }
  return { startDate, endDate };
}
var VideoReportRequest = class extends PagedRequest {
  _rev;
  _endpoint;
  /**
   * @hidden
   * @param rev
   * @param options
   * @param endpoint
   */
  constructor(rev, options = {}, endpoint = "/api/v2/videos/report") {
    super(parseOptions(options));
    this._endpoint = endpoint;
    this._rev = rev;
  }
  async _requestPage() {
    const { startDate, endDate } = this;
    const { incrementDays, sortDirection, videoIds, scrollId } = this.options;
    const isAscending = sortDirection === "asc";
    let rangeStart = startDate;
    let rangeEnd = endDate;
    let done = false;
    if (isAscending) {
      rangeEnd = addDays(rangeStart, incrementDays);
      if (rangeEnd >= endDate) {
        done = true;
        rangeEnd = endDate;
      }
    } else {
      rangeStart = addDays(rangeEnd, -1 * incrementDays);
      if (rangeStart <= startDate) {
        done = true;
        rangeStart = startDate;
      }
    }
    const query = {
      after: rangeStart.toJSON(),
      before: rangeEnd.toJSON(),
      ...scrollId && { scrollId },
      ...videoIds && { videoIds }
    };
    await this._rev.session.queueRequest("viewReport" /* GetVideoViewReport */);
    const page = await this._rev.post(this._endpoint, query, { responseType: "json" });
    const items = page.sessions ?? [];
    this.options.scrollId = items.length === 0 ? void 0 : page.scrollId;
    if (this.options.scrollId) {
      done = false;
    } else if (!done) {
      if (isAscending) {
        this.startDate = rangeEnd;
      } else {
        this.endDate = rangeStart;
      }
    }
    return {
      items,
      done
    };
  }
  get startDate() {
    return this.options.startDate;
  }
  set startDate(value) {
    this.options.startDate = value;
  }
  get endDate() {
    return this.options.endDate;
  }
  set endDate(value) {
    this.options.endDate = value;
  }
};
function videoReportAPI(rev) {
  function report(videoId, options = {}) {
    if (isPlainObject(videoId)) {
      options = videoId;
    } else if (typeof videoId === "string") {
      options = {
        ...options ?? {},
        videoIds: videoId
      };
    }
    return new VideoReportRequest(rev, options, "/api/v2/videos/report");
  }
  function summaryStatistics(videoId, startDate, endDate = /* @__PURE__ */ new Date(), options) {
    const payload = startDate ? { after: new Date(startDate).toISOString(), before: asValidDate(endDate, /* @__PURE__ */ new Date()).toISOString() } : void 0;
    return rev.get(`/api/v2/videos/${videoId}/summary-statistics`, payload, options);
  }
  return {
    report,
    uniqueSessionsReport(videoId, options = {}) {
      return new VideoReportRequest(rev, options, `/api/v2/videos/${videoId}/report`);
    },
    summaryStatistics
  };
}

// src/api/video.ts
function videoAPIFactory(rev) {
  async function comments(videoId, showAll = false) {
    const response = await rev.get(`/api/v2/videos/${videoId}/comments`, showAll ? { showAll: "true" } : void 0);
    return response.comments;
  }
  const videoAPI = {
    /**
     * This is an example of using the video Patch API to only update a single field
     * @param videoId
     * @param title
     */
    async setTitle(videoId, title) {
      const payload = [{ op: "add", path: "/Title", value: title }];
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.patch(`/api/v2/videos/${videoId}`, payload);
    },
    /**
     * Use the Patch API to update a single Custom Field.
     * @param videoId - id of video to update
     * @param customField - the custom field object (with id and value)
     */
    async setCustomField(videoId, customField) {
      const payload = [{
        op: "replace",
        path: "/CustomFields",
        value: [customField]
      }];
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.patch(`/api/v2/videos/${videoId}`, payload);
    },
    async delete(videoId, options) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.delete(`/api/v2/videos/${videoId}`, void 0, options);
    },
    /**
     * get processing status of a video
     * @see [API Docs](https://revdocs.vbrick.com/reference/getvideostatus)
     */
    async status(videoId, options) {
      return rev.get(`/api/v2/videos/${videoId}/status`, void 0, options);
    },
    /**
     * get details of a video
     * @see [API Docs](https://revdocs.vbrick.com/reference/getvideosdetails)
     * @param videoId
     * @param options
     * @returns
     */
    async details(videoId, options) {
      await rev.session.queueRequest("videoDetails" /* GetVideoDetails */);
      return rev.get(`/api/v2/videos/${videoId}/details`, void 0, options);
    },
    async update(videoId, metadata, options) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.put(`/api/v2/videos/${videoId}`, metadata, options);
    },
    comments,
    async chapters(videoId, options) {
      try {
        const { chapters } = await rev.get(`/api/v2/videos/${videoId}/chapters`, void 0, options);
        return chapters;
      } catch (err) {
        if (err instanceof RevError && err.code === "NoVideoChapters") {
          return [];
        }
        throw err;
      }
    },
    async supplementalFiles(videoId, options) {
      const { supplementalFiles } = await rev.get(`/api/v2/videos/${videoId}/supplemental-files`, void 0, options);
      return supplementalFiles;
    },
    // async deleteSupplementalFiles(videoId: string, fileId: string | string[]): Promise<void> {
    //     const fileIds = Array.isArray(fileId)
    //         ? fileId.join(',')
    //         : fileId
    //     await rev.delete(`/api/v2/videos/${videoId}/supplemental-files`, { fileIds });
    // },
    async thumbnailConfiguration(videoId, options) {
      const { thumbnailCfg } = await rev.get(`/api/v2/videos/${videoId}/thumbnail-config`, void 0, options);
      return thumbnailCfg;
    },
    async transcriptions(videoId, options) {
      const { transcriptionFiles } = await rev.get(`/api/v2/videos/${videoId}/transcription-files`, void 0, options);
      return transcriptionFiles;
    },
    get upload() {
      return rev.upload.video;
    },
    get replace() {
      return rev.upload.replaceVideo;
    },
    async migrate(videoId, options, requestOptions) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.put(`/api/v2/videos/${videoId}/migration`, options, requestOptions);
    },
    /**
     * search for videos, return as one big list. leave blank to get all videos in the account
     */
    search(query = {}, options = {}) {
      const searchDefinition = {
        endpoint: "/api/v2/videos/search",
        totalKey: "totalVideos",
        hitsKey: "videos",
        async request(endpoint, query2, options2) {
          await rev.session.queueRequest("searchVideos" /* SearchVideos */);
          return rev.get(endpoint, query2, options2);
        }
      };
      const request = new SearchRequest(rev, searchDefinition, query, options);
      return request;
    },
    /**
     * Example of using the video search API to search for videos, then getting
     * the details of each video
     * @deprecated This method can cause timeouts if iterating through a very
     *             large number of results, as the search scroll cursor has a
     *             timeout of ~5 minutes. Consider getting all search results
     *             first, then getting details
     * @param query
     * @param options
     */
    searchDetailed(query = {}, options = {}) {
      const searchDefinition = {
        endpoint: "/api/v2/videos/search",
        totalKey: "totalVideos",
        hitsKey: "videos",
        transform: async (videos) => {
          const result = [];
          for (let rawVideo of videos) {
            const out = rawVideo;
            try {
              const details = await videoAPI.details(rawVideo.id);
              Object.assign(out, details);
            } catch (error) {
              out.error = error;
            }
            result.push(out);
          }
          return result;
        }
      };
      const request = new SearchRequest(rev, searchDefinition, query, options);
      return request;
    },
    async playbackInfo(videoId) {
      const { video } = await rev.get(`/api/v2/videos/${videoId}/playback-url`);
      return video;
    },
    async playbackUrls(videoId, { ip, userAgent } = {}, options) {
      const query = ip ? { ip } : void 0;
      const opts = {
        ...options,
        ...userAgent && {
          headers: mergeHeaders(options?.headers, { "User-Agent": userAgent })
        },
        responseType: "json"
      };
      return rev.get(`/api/v2/videos/${videoId}/playback-urls`, query, opts);
    },
    ...videoDownloadAPI(rev),
    ...videoReportAPI(rev),
    ...videoExternalAccessAPI(rev),
    listDeleted(query = {}, options = {}) {
      const searchDefinition = {
        endpoint: "/api/v2/videos/deleted",
        totalKey: "totalVideos",
        hitsKey: "deletedVideos",
        async request(endpoint, query2, options2) {
          await rev.session.queueRequest("searchVideos" /* SearchVideos */);
          return rev.get(endpoint, query2, options2);
        }
      };
      const request = new SearchRequest(rev, searchDefinition, query, options);
      return request;
    },
    /**
     * @deprecated Use edit() API instead
     */
    async trim(videoId, removedSegments) {
      await rev.session.queueRequest("uploadVideo" /* UploadVideo */);
      return rev.post(`/api/v2/videos/${videoId}/trim`, removedSegments);
    },
    async convertDualStreamToSwitched(videoId) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      return rev.put(`/api/v2/videos/${videoId}/convert-dual-streams-to-switched-stream`);
    },
    async edit(videoId, keepRanges, options) {
      await rev.session.queueRequest("uploadVideo" /* UploadVideo */);
      return rev.post(`/api/v2/videos/${videoId}/edit`, keepRanges, options);
    },
    async patch(videoId, operations, options) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.patch(`/api/v2/videos/${videoId}`, operations, options);
    },
    async generateMetadata(videoId, fields = ["all"], options) {
      await rev.session.queueRequest("updateVideo" /* UpdateVideoMetadata */);
      await rev.put(`/api/v2/videos/${videoId}/generate-metadata`, { metadataGenerationFields: fields }, options);
    },
    async generateMetadataStatus(videoId, options) {
      const { description } = await rev.get(`/api/v2/videos/${videoId}/metadata-generation-status`, void 0, { ...options, responseType: "json" });
      return description.status;
    },
    async transcribe(videoId, language, options) {
      const payload = typeof language === "string" ? { language } : language;
      return rev.post(`/api/v2/videos/${videoId}/transcription`, payload, { ...options, responseType: "json" });
    },
    async transcriptionStatus(videoId, transcriptionId, options) {
      return rev.get(`/api/v2/videos/${videoId}/transcriptions/${transcriptionId}/status`, void 0, { ...options, responseType: "json" });
    },
    async translate(videoId, source, target, options) {
      const payload = {
        sourceLanguage: source,
        targetLanguages: typeof target === "string" ? [target] : target
      };
      return rev.post(`/api/v2/videos/${videoId}/translations`, payload, { ...options, responseType: "json" });
    },
    async getTranslationStatus(videoId, language, options) {
      const { status } = await rev.get(`/api/v2/videos/${videoId}/translations/${language}/status`, void 0, { ...options, responseType: "json" });
      return status;
    },
    async deleteTranscription(videoId, language, options) {
      const locale = Array.isArray(language) ? language.map((s) => s.trim()).join(",") : language;
      await rev.delete(`/api/v2/videos/${videoId}`, locale ? { locale } : void 0, options);
    },
    /**
     * Helper - update the audio language for a video. If index isn't specified then update the default language
     * @param video - videoId or video details (from video.details api call)
     * @param language - language to use, for example 'en'
     * @param trackIndex - index of audio track - if not supplied then update default or first index
     * @param options
     * @deprecated - use `video.patchAudioTracks(video, [{ op: 'replace', track: 0, value: { languageId: 'en', isDefault: true } }])`
     */
    async setAudioLanguage(video, language, trackIndex, options) {
      const { id, audioTracks = [] } = typeof video === "string" ? { id: video } : video;
      let index = trackIndex ?? audioTracks.findIndex((t) => t.isDefault === true) ?? 0;
      const op = {
        op: "replace",
        path: `/audioTracks/${index}`,
        value: { track: index, languageId: language }
      };
      await videoAPI.patch(id, [op], options);
    },
    /**
     * Helper - updating audioTracks or generating new ones requires some specific formatting and making sure that the track indexes are correct. This wraps up the logic of converting tasks into the correct PATCH operations
     * NOTE: Adding audio tracks will use RevIQ credits to generate the new audio.
     * @param video videoId or Video Details object. If videoId is passed then the Get Video Details API will automatically be called to get the latest audioTrack data
     * @param operations List of updates to audio tracks.
     * @param options
     * @returns {Promise<void>}
     * @example
     * ```js
     * const rev = new RevClient(...config...);
     * await rev.connect();
     * const videoId = '<guid>'
     *
     * // helper generator function - used to call status apis until a timeout
     * async function * pollEvery(intervalSeconds = 15, maxSeconds = 900) {
     *     for (let attempt = 0, maxAttempts = maxSeconds / intervalSeconds; attempt < maxAttempts; attempt += 1) {
     *         await new Promise(done => setTimeout(done, intervalSeconds * 1000));
     *         yield attempt;
     *     }
     * }
     *
     * // helper function to generate translation/transcription of a video
     * // NOTE: Uses Rev IQ Credits
     * async function transcribeOrTranslate(videoId, languageId, sourceLanguageId) {
     *     // call translate or transcribe based on if 3rd arg is passed
     *     const response = sourceLanguageId
     *         ? await rev.video.translate(videoId, sourceLanguageId, languageId)
     *         : await rev.video.transcribe(videoId, languageId);
     *
     *     // get the id and status depending on if translate or transcribe
     *     let {transcriptionId, status} = sourceLanguageId
     *         ? response.translations[0]
     *         : response;
     *
     *     for await (let attempt of pollEvery(5)) {
     *         status = (await rev.video.transcriptionStatus(videoId, transcriptionId)).status;
     *         if (['Success', 'Failed'].includes(status)) {
     *             break;
     *         } else {
     *             console.log(`Waiting for transcription to ${languageId} (${attempt}) - ${status}`);
     *         }
     *     }
     *     if (status === 'Success') {
     *         console.log('Transcription complete');
     *     } else {
     *         throw new Error(`Transcription incomplete (${status})`);
     *     }
     * }
     *
     * // get details of video
     * let details = await rev.video.details(videoId);
     * console.log('Initial audio tracks:', details.audioTracks);
     *
     * // set language of first audio track to English (Great Britain) and as the default (if no language set)
     * if (details.audioTracks[0].languageId === 'und') {
     *     console.warn('Setting language of default audio track');
     *     await rev.video.patchAudioTracks(details, [{ op: 'replace', track: 0, value: { languageId: 'en-gb', isDefault: true } }]);
     * }
     *
     * // make sure there's a transcription on the video. If not then add one
     * let transcriptions = await rev.video.transcriptions(videoId);
     * if (transcriptions.length === 0) {
     *   console.warn('A transcription is required for generating audio. Submitting job for transcription now');
     *   await transcribeOrTranslate(videoId, 'en-gb');
     *   transcriptions = await rev.video.transcriptions(videoId);
     * }
     *
     * // check if existing spanish translation
     * if (!transcriptions.some(t => t.locale === 'es')) {
     *     console.warn('A translation to target language is required for generating audio. Submitting job for translation now');
     *     await transcribeOrTranslate(videoId, 'es', transcriptions[0].locale);
     * }
     *
     * // start generating a spanish version of the audio
     * console.log('Generating Spanish audio track');
     * await rev.video.patchAudioTracks(details, [{ op: 'add', value: { languageId: 'es' }}]);
     *
     * // wait for audio generation to complete
     * for await (let attempt of pollEvery(15)) {
     *     details = await rev.video.details(videoId);
     *     const audioTrack = details.audioTracks.find(t => t.languageId === 'es');
     *     const isFinalState = ['Ready', 'AddingFailed'].includes(audioTrack?.status);
     *     if (isFinalState) {
     *         console.log('audio processing completed', audioTrack);
     *         break;
     *     } else {
     *         console.log(`Waiting for audio generation to complete (${attempt}) - ${audioTrack?.status}`);
     *     }
     * }
     *
     * console.log('Final audio tracks:', details.audioTracks);
     *
     * // Finally, if you want to delete the spanish version:
     * // WARNING: This is destructive and will remove the audio track
     * //await rev.video.patchAudioTracks(details, [{ op: 'remove', languageId: 'es' }]);
     *
     *
     * ```
     *
     */
    async patchAudioTracks(video, operations, options) {
      const { id, audioTracks } = typeof video === "string" ? await rev.video.details(video) : video;
      const request = new Map(audioTracks.map(({ languageName, ...t }) => [t.track, t]));
      for (let { op, languageId, track, value } of operations) {
        if (op === "add") {
          languageId ??= value?.languageId;
          if (!languageId) throw new TypeError("value languageId is required when adding audioTrack");
          const audioTrack = {
            isDefault: value?.isDefault ?? false,
            languageId,
            track: request.size,
            status: "Adding"
          };
          request.set(audioTrack.track, audioTrack);
          continue;
        }
        let existing = track != void 0 && request.has(track) ? request.get(track) : [...request.values()].find((t) => t.languageId === languageId);
        if (!existing && audioTracks.length === 1) {
          existing = request.get(audioTracks[0].track);
        }
        if (!existing) {
          throw new Error(`Attempt to ${op} audioTrack language ${languageId} ${track}, but no matching track found`);
        }
        Object.assign(existing, {
          ...value,
          status: op === "remove" ? "Deleting" : "Updating"
        });
      }
      const payload = {
        op: "replace",
        path: "/audioTracks",
        value: [...request.values()]
      };
      return videoAPI.patch(id, [payload], options);
    },
    /**
     * Helper - wait for video transcode to complete.
     * This doesn't indicate that a video is playable, rather that all transcoding jobs are complete
     * @param videoId
     * @param options
     */
    async waitTranscode(videoId, options = {}, requestOptions) {
      const {
        pollIntervalSeconds = 30,
        timeoutMinutes = 240,
        signal,
        ignorePlaybackWhileTranscoding = true,
        onProgress,
        onError = (error) => {
          throw error;
        }
      } = options;
      const ONE_MINUTE3 = 1e3 * 60;
      const timeoutDate = Date.now() + timeoutMinutes * ONE_MINUTE3 || Infinity;
      const pollInterval = Math.max((pollIntervalSeconds || 30) * 1e3, 5e3);
      let statusResponse = { status: "UploadFailed" };
      while (Date.now() < timeoutDate && !signal?.aborted) {
        try {
          statusResponse = await videoAPI.status(videoId, options);
          let {
            isProcessing,
            overallProgress = 0,
            status
          } = statusResponse;
          if (ignorePlaybackWhileTranscoding && status === "Ready" && isProcessing) {
            status = "Processing";
          }
          if (status === "ProcessingFailed") {
            overallProgress = 1;
            isProcessing = false;
          }
          Object.assign(statusResponse, { status, overallProgress, isProcessing });
          onProgress?.(statusResponse);
          if (overallProgress === 1 && !isProcessing) {
            break;
          }
        } catch (error) {
          await Promise.resolve(onError(error));
        }
        await sleep(pollInterval, signal);
      }
      return statusResponse;
    }
  };
  return videoAPI;
}

// src/api/webcast.ts
init_utils();

// src/api/webcast-report-request.ts
init_rev_error();
init_utils();
function getSummaryFromResponse2(response, hitsKey) {
  const ignoreKeys = ["scrollId", "statusCode", "statusDescription"];
  const summary = Object.fromEntries(Object.entries(response).filter(([key, value]) => {
    return !(key === hitsKey || ignoreKeys.includes(key) || Array.isArray(value));
  }));
  return summary;
}
var RealtimeReportRequest = class extends SearchRequest {
  /**
   * @hidden
   * @param rev
   * @param eventId
   * @param query
   * @param options
   */
  constructor(rev, eventId, query = {}, options = {}) {
    const searchDefinition = {
      endpoint: `/api/v2/scheduled-events/${eventId}/real-time/attendees`,
      totalKey: "total",
      hitsKey: "attendees",
      // get summary from initial response
      request: async (endpoint, query2, options2) => {
        await rev.session.queueRequest("attendeesRealtime" /* GetWebcastAttendeesRealtime */);
        const response = await rev.post(endpoint, query2, options2);
        const summary = getSummaryFromResponse2(response, "attendees");
        Object.assign(this.summary, summary);
        return response;
      }
    };
    super(rev, searchDefinition, query, options);
    this.summary = {};
  }
  /**
   * get the aggregate statistics only, instead of actual session data.
   * @returns {Webcast.PostEventSummary}
   */
  async getSummary() {
    this.options.maxResults = 0;
    await this.nextPage();
    return this.summary;
  }
};
var PostEventReportRequest = class extends SearchRequest {
  /**
   * @hidden
   * @param rev
   * @param query
   * @param options
   */
  constructor(rev, query, options = {}) {
    const { eventId, runNumber } = query;
    const runQuery = runNumber && runNumber >= 0 ? { runNumber } : {};
    const searchDefinition = {
      endpoint: `/api/v2/scheduled-events/${eventId}/post-event-report`,
      totalKey: "totalSessions",
      hitsKey: "sessions",
      request: async (endpoint, query2, options2) => {
        const response = await rev.request("GET", endpoint, query2, {
          ...options2,
          responseType: "json",
          throwHttpErrors: false
        });
        await this._assertResponseOk(response);
        Object.assign(this.summary, getSummaryFromResponse2(response.body, "sessions"));
        return response.body;
      }
    };
    super(rev, searchDefinition, runQuery, options);
    this.summary = {};
  }
  async _assertResponseOk({ response, statusCode, body }) {
    if (response.ok) {
      return body;
    }
    if (statusCode == 400 && body?.errorDescription) {
      throw new RevError(response, { details: body.errorDescription });
    }
    const error = !!body || response.bodyUsed ? new RevError(response, body) : await RevError.create(response);
    throw error;
  }
  /**
   * get the aggregate statistics only, instead of actual session data.
   * @returns {Webcast.PostEventSummary}
   */
  async getSummary() {
    this.options.maxResults = 0;
    await this.nextPage();
    return this.summary;
  }
};

// src/api/webcast.ts
function webcastAPIFactory(rev) {
  const webcastAPI = {
    async list(options = {}, requestOptions) {
      return rev.get("/api/v2/scheduled-events", options, { ...requestOptions, responseType: "json" });
    },
    search(query, options) {
      const searchDefinition = {
        endpoint: `/api/v2/search/scheduled-events`,
        totalKey: "total",
        hitsKey: "events",
        request: (endpoint, query2, options2) => rev.post(endpoint, query2, options2),
        isPost: true
      };
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    async create(event) {
      const { eventId } = await rev.post(`/api/v2/scheduled-events`, event);
      return eventId;
    },
    async details(eventId, requestOptions) {
      return rev.get(`/api/v2/scheduled-events/${eventId}`, void 0, requestOptions);
    },
    async edit(eventId, event) {
      return rev.put(`/api/v2/scheduled-events/${eventId}`, event);
    },
    /**
     * Partially edits the details of a webcast. You do not need to provide the fields that you are not changing.
     * Webcast status determines which fields are modifiable and when.
     *
     * If the webcast pre-production or main event is in progress, only fields available for inline editing may be patched/edited.
     *
     * If the webcast main event has been run once, only fields available after the webcast has ended are available for editing. That includes all fields with the exception of start/end dates, lobbyTimeMinutes, preProduction, duration, userIds, and groupIds.
     *
     * If the webcast end time has passed and is Completed, only edits to linkedVideoId and redirectVod are allowed.
     *
     * Event Admins can be removed using their email addresses as path pointer for the fields 'EventAdminEmails' and 'EventAdmins', provided that all of the Event Admins associated with the webcast have email addresses. This is also applicable for the field 'Moderators'.
     * @example
     * ```js
     * const rev = new RevClient(...config...);
     * await rev.connect();
     *
     * // using eventadmins
     * await rev.webcast.patch(eventId, [{ 'op': 'remove', 'path': '/EventAdmins/Email', 'value': 'x1@test.com' }]);
     * // change shortcut
     * await rev.webcast.patch(eventId, [{ 'op': 'replace', 'path': '/ShortcutName', 'value': 'weekly-meeting' }]);
     * ```
     */
    async patch(eventId, operations, options) {
      await rev.patch(`/api/v2/scheduled-events/${eventId}`, operations, options);
    },
    // async patch - not yet implemented
    async delete(eventId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}`);
    },
    async editAccess(eventId, entities) {
      return rev.put(`/api/v2/scheduled-events/${eventId}/access-control`, entities);
    },
    attendees(eventId, runNumber, options) {
      return new PostEventReportRequest(rev, { eventId, runNumber }, options);
    },
    realtimeAttendees(eventId, query, options) {
      return new RealtimeReportRequest(rev, eventId, query, options);
    },
    async questions(eventId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      return rev.get(`/api/v2/scheduled-events/${eventId}/questions`, query, { responseType: "json" });
    },
    async pollResults(eventId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      const rawResponse = await rev.get(`/api/v2/scheduled-events/${eventId}/poll-results`, query, { responseType: "text" });
      const { polls = [] } = rawResponse ? JSON.parse(rawResponse) : {};
      return polls;
    },
    async comments(eventId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      return rev.get(`/api/v2/scheduled-events/${eventId}/comments`, query, { responseType: "json" });
    },
    async reactions(eventId) {
      return rev.get(`/api/v2/scheduled-events/${eventId}/reactions`, void 0, { responseType: "json" });
    },
    async status(eventId, requestOptions) {
      return rev.get(`/api/v2/scheduled-events/${eventId}/status`, void 0, requestOptions);
    },
    async isPublic(eventId, requestOptions) {
      const response = await rev.request("GET", `/api/v2/scheduled-events/${eventId}/is-public`, void 0, { ...requestOptions, throwHttpErrors: false, responseType: "json" });
      return response.statusCode !== 401 && response.body?.isPublic;
    },
    /**
     * This endpoint deletes all events for a given date range or custom field query. The response returns a jobId and a count of webcasts to be deleted. The jobId can be used to check the status of the deletion.
     * @param query Fields that are going to be used to search Webcasts that are to be deleted.
     * @param options
     */
    async bulkDelete(query, options) {
      const { body } = await rev.request("DELETE", `/api/v2/scheduled-events`, query, options);
      return body;
    },
    bulkDeleteStatus(jobId) {
      return rev.get(`/api/v2/scheduled-events/delete-status/${jobId}`);
    },
    async playbackUrls(eventId, { ip, userAgent } = {}, options) {
      const query = ip ? { ip } : void 0;
      const opts = {
        ...options,
        ...userAgent && {
          headers: mergeHeaders(options?.headers, { "User-Agent": userAgent })
        },
        responseType: "json"
      };
      return rev.get(`/api/v2/scheduled-events/${eventId}/playback-url`, query, opts);
    },
    /**
     * @deprecated
     * @param eventId
     * @param options
     * @returns
     */
    async playbackUrl(eventId, options = {}) {
      rev.log("debug", "webcast.playbackUrl is deprecated - use webcast.playbackUrls instead");
      const { playbackResults } = await webcastAPI.playbackUrls(eventId, options);
      return playbackResults;
    },
    async startEvent(eventId, preProduction = false) {
      await rev.put(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
    },
    async stopEvent(eventId, preProduction = false) {
      await rev.delete(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
    },
    async startBroadcast(eventId) {
      await rev.put(`/api/v2/scheduled-events/${eventId}/broadcast`);
    },
    async stopBroadcast(eventId) {
      await rev.delete(`/api/v2/scheduled-events/${eventId}/broadcast`);
    },
    async startRecord(eventId) {
      await rev.put(`/api/v2/scheduled-events/${eventId}/record`);
    },
    async stopRecord(eventId) {
      await rev.delete(`/api/v2/scheduled-events/${eventId}/record`);
    },
    async linkVideo(eventId, videoId, autoRedirect = true) {
      const payload = {
        videoId,
        redirectVod: autoRedirect
      };
      return rev.put(`/api/v2/scheduled-events/${eventId}/linked-video`, payload);
    },
    async unlinkVideo(eventId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/linked-video`);
    },
    /**
     * Retrieve details of a specific guest user Public webcast registration.
     * @param eventId - Id of the Public webcast
     * @param registrationId - Id of guest user's registration to retrieve
     * @returns
     */
    async guestRegistration(eventId, registrationId) {
      return rev.get(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`);
    },
    /**
     * Mute attendee for a specified webcast
     */
    async muteAttendee(eventId, userId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      await rev.put(`/api/v2/scheduled-events/${eventId}/users/${userId}/mute`, query);
    },
    /**
     * Unmute attendee for a specified webcast
     */
    async unmuteAttendee(eventId, userId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      await rev.delete(`/api/v2/scheduled-events/${eventId}/users/${userId}/mute`, query);
    },
    /**
     * Hide specific comment for a specified webcast
     */
    async hideComment(eventId, commentId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      await rev.put(`/api/v2/scheduled-events/${eventId}/comments/${commentId}/hide`, query);
    },
    /**
     * Unhide specific comment for a specified webcast
     */
    async unhideComment(eventId, commentId, runNumber) {
      const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
      await rev.delete(`/api/v2/scheduled-events/${eventId}/comments/${commentId}/hide`, query);
    },
    /**
     * Register one attendee/guest user for an upcoming Public webcast. Make sure you first enable Public webcast pre-registration before adding registrations.
     * @param eventId
     * @param registration
     * @returns
     */
    async createGuestRegistration(eventId, registration) {
      return rev.post(`/api/v2/scheduled-events/${eventId}/registrations`, registration);
    },
    listGuestRegistrations(eventId, query = {}, options) {
      const searchDefinition = {
        endpoint: `/api/v2/scheduled-events/${eventId}/registrations`,
        /** NOTE: this API doesn't actually return a total, so this will always be undefined */
        totalKey: "total",
        hitsKey: "guestUsers"
      };
      return new SearchRequest(rev, searchDefinition, query, options);
    },
    updateGuestRegistration(eventId, registrationId, registration) {
      return rev.put(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`, registration);
    },
    patchGuestRegistration(eventId, registrationId, registration) {
      const operations = Object.entries(registration).map(([key, value]) => {
        let path2 = `/${titleCase(key)}`;
        return { op: "replace", path: path2, value };
      });
      return rev.put(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`, operations);
    },
    deleteGuestRegistration(eventId, registrationId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`);
    },
    /**
     * Resend email to external presenters for Producer type webcast.
     * @param eventId id of the webcast
     * @param email Email of the external presenter.
     */
    resendEmailToExternalPresenter(eventId, email) {
      return rev.post(`/api/v2/scheduled-events/${eventId}/presenter-resend-email?email=${encodeURIComponent(email)}`);
    },
    async listEmbeddedEngagements(eventId) {
      const { contentLinks } = await rev.get(`/api/v2/scheduled-events/${eventId}/embedded-content/links`);
      return contentLinks || [];
    },
    addEmbeddedEngagement(eventId, contentLink) {
      return rev.post(`/api/v2/scheduled-events/${eventId}/embedded-content/link`, contentLink);
    },
    setEmbeddedEngagementStatus(eventId, linkId, isEnabled) {
      return rev.put(`/api/v2/scheduled-events/${eventId}/embedded-content/links/${linkId}/status`, { isEnabled });
    },
    updateEmbeddedEngagement(eventId, contentLink) {
      const { id, ...payload } = contentLink;
      return rev.put(`/api/v2/scheduled-events/${eventId}/embedded-content/links/${id}`, payload);
    },
    deleteEmbeddedEngagement(eventId, linkId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/embedded-content/links/${linkId}`);
    },
    async listBanners(eventId) {
      const { banners } = await rev.get(`/api/v2/scheduled-events/${eventId}/banners`);
      return banners || [];
    },
    addBanner(eventId, banner) {
      return rev.post(`/api/v2/scheduled-events/${eventId}/banner`, banner);
    },
    setBannerStatus(eventId, bannerId, isEnabled) {
      return rev.put(`/api/v2/scheduled-events/${eventId}/banner/${bannerId}/status`, { isEnabled });
    },
    updateBanner(eventId, banner) {
      const { id, ...payload } = banner;
      return rev.put(`/api/v2/scheduled-events/${eventId}/banner/${id}`, payload);
    },
    deleteBanner(eventId, bannerId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/banner/${bannerId}`);
    },
    get uploadBranding() {
      return rev.upload.webcastBranding;
    },
    get uploadPresentation() {
      return rev.upload.webcastPresentation;
    },
    get uploadBackgroundImage() {
      return rev.upload.webcastBackground;
    },
    deleteBackgroundImage(eventId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/background-image`);
    },
    get uploadProducerLayoutBackground() {
      return rev.upload.webcastProducerLayoutBackground;
    },
    deleteProducerLayoutBackground(eventId) {
      return rev.delete(`/api/v2/scheduled-events/${eventId}/webcast-producer-bgimage`);
    }
  };
  return webcastAPI;
}

// src/api/zones.ts
function zonesAPIFactory(rev) {
  const zonesAPI = {
    async list() {
      return rev.get(`/api/v2/zones`, void 0, { responseType: "json" });
    },
    async flatList() {
      const {
        defaultZone,
        zones
      } = await zonesAPI.list();
      const flatZones = [defaultZone];
      function recursiveAdd(inZone) {
        const {
          childZones = [],
          ...zone
        } = inZone;
        flatZones.push(zone);
        childZones.forEach(recursiveAdd);
      }
      zones.forEach(recursiveAdd);
      return flatZones;
    },
    async create(zone) {
      const { zoneId } = await rev.post(`/api/v2/zones`, zone, { responseType: "json" });
      return zoneId;
    },
    async edit(zoneId, zone) {
      return rev.put(`/api/v2/zones/${zoneId}`, zone);
    },
    delete(zoneId) {
      return rev.delete(`/api/v2/zones/${zoneId}`);
    },
    get devices() {
      return rev.device.listZoneDevices;
    }
  };
  return zonesAPI;
}

// src/api/environment.ts
function environmentAPIFactory(rev) {
  let accountId = "";
  let version = "";
  let ulsInfo = void 0;
  const environmentAPI = {
    /**
     * Get's the accountId embedded in Rev's main entry point
     * @returns
     */
    async getAccountId(forceRefresh = false) {
      if (!accountId || forceRefresh) {
        const text = await rev.get("/", void 0, { responseType: "text" }).catch((error) => "");
        accountId = (/BootstrapContext.*account[":{ ]*"id"\s*:\s*"([^"]+)"/.exec(text) || [])[1] || "";
      }
      return accountId;
    },
    /**
     * Get's the version of Rev returned by /js/version.js
     * @returns
     */
    async getRevVersion(forceRefresh = false) {
      if (!version || forceRefresh) {
        const text = await rev.get("/js/version.js", void 0, { responseType: "text" }).catch((error) => "");
        version = (/buildNumber:\s+['"]([\d.]+)/.exec(text) || [])[1] || "";
      }
      return version;
    },
    /**
     * Use the Get User Location Service API to get a user's IP address for zoning purposes
     * Returns the IP if ULS enabled and one successfully found, otherwise undefined.
     * undefined response indicates Rev should use the user's public IP for zoning.
     * @param timeoutMs    - how many milliseconds to wait for a response (if user is not)
     *                       on VPN / intranet with ULS DME then DNS lookup or request
     *                       can time out, so don't set this too long.
     *                       Default is 10 seconds
     * @param forceRefresh   By default the User Location Services settings is cached
     *                       (not the user's detected IP). Use this to force reloading
     *                       the settings from Rev.
     * @returns
     */
    async getUserLocalIp(timeoutMs = 10 * 1e3, forceRefresh = false) {
      if (!ulsInfo || forceRefresh) {
        ulsInfo = await rev.get("/api/v2/user-location");
      }
      if (!ulsInfo?.enabled || ulsInfo.locationUrls.length === 0) {
        return void 0;
      }
      const controller = new AbortController();
      const getIp = async function(ulsUrl) {
        try {
          let { ip = "" } = await rev.get(ulsUrl, {}, {
            headers: { Authorization: "" },
            responseType: "json",
            signal: controller.signal
          });
          ip = `${ip}`.split(",")[0].trim();
          if (ip) {
            controller.abort();
          }
          return ip;
        } catch (error) {
          rev.log("debug", `ULS URL Failed: ${ulsUrl}`, error);
          return void 0;
        }
      };
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const ips = await Promise.all(ulsInfo.locationUrls.map(getIp));
        return ips.find((ip) => !!ip);
      } finally {
        clearTimeout(timer);
      }
    }
  };
  return environmentAPI;
}

// src/rev-client.ts
init_polyfills();
init_rev_error();

// src/rev-session.ts
init_utils();
init_polyfills();
init_rate_limit_queues();
var ONE_MINUTE2 = 1e3 * 60;
var DEFAULT_EXPIRE_MINUTES = 10;
var _credentials = Symbol("credentials");
var SessionKeepAlive = class {
  _session;
  controller;
  extendOptions;
  error;
  _isExtending = false;
  constructor(session, options = {}) {
    this.extendOptions = {
      extendThresholdMilliseconds: 3 * ONE_MINUTE2,
      keepAliveInterval: 10 * ONE_MINUTE2,
      verify: true,
      ...options
    };
    Object.defineProperties(this, {
      _session: {
        get: () => session,
        enumerable: false
      }
    });
  }
  getNextExtendTime() {
    const { expires } = this._session;
    if (!expires) {
      return 0;
    }
    const {
      keepAliveInterval: interval,
      extendThresholdMilliseconds: threshold
    } = this.extendOptions;
    const MIN_INTERVAL_MS = 5 * 1e3;
    const timeTillExpiration = expires.getTime() - Date.now();
    return Math.max(MIN_INTERVAL_MS, Math.min(timeTillExpiration - threshold, interval));
  }
  async _poll() {
    const { _session: session } = this;
    const controller = this._reset();
    const { signal } = controller;
    while (session.isConnected && !signal.aborted) {
      const nextExtendTime = this.getNextExtendTime();
      await sleep(nextExtendTime, signal);
      if (signal.aborted) {
        break;
      }
      try {
        this._isExtending = true;
        await session.lazyExtend(this.extendOptions);
      } catch (err) {
        controller.abort();
        this.error = err;
      } finally {
        this._isExtending = false;
      }
    }
  }
  start() {
    if (this._isExtending) {
      return;
    }
    this._poll();
  }
  stop() {
    if (this._isExtending) {
      return;
    }
    if (this.controller) {
      this.controller.abort();
    }
  }
  _reset() {
    this.error = void 0;
    this._isExtending = false;
    const oldController = this.controller;
    this.controller = new polyfills_default.AbortController();
    if (oldController) {
      oldController.abort();
    }
    return this.controller;
  }
  get isAlive() {
    return this.controller && !this.controller.signal.aborted;
  }
};
var SessionBase = class {
  token;
  expires;
  rev;
  [_credentials];
  keepAlive;
  _rateLimits;
  constructor(rev, credentials, keepAliveOptions, rateLimits) {
    this.expires = /* @__PURE__ */ new Date();
    if (keepAliveOptions === true) {
      this.keepAlive = new SessionKeepAlive(this);
    } else if (isPlainObject(keepAliveOptions)) {
      this.keepAlive = new SessionKeepAlive(this, keepAliveOptions);
    }
    let rateLimitQueues = void 0;
    if (rateLimits) {
      rateLimitQueues = makeQueues(isPlainObject(rateLimits) ? rateLimits : void 0);
    }
    Object.defineProperties(this, {
      rev: {
        get() {
          return rev;
        },
        enumerable: false
      },
      [_credentials]: {
        get() {
          return credentials;
        },
        enumerable: false
      },
      _rateLimits: {
        get() {
          return rateLimitQueues;
        },
        enumerable: false
      }
    });
  }
  async login() {
    this.token = void 0;
    this.expires = /* @__PURE__ */ new Date();
    const {
      expiration,
      ...session
    } = await this._login();
    Object.assign(this, session);
    const expires = new Date(expiration);
    if (isNaN(expires.getTime()) || expires.getTime() < this.expires.getTime()) {
      this.expires.setUTCMinutes(this.expires.getUTCMinutes() + DEFAULT_EXPIRE_MINUTES);
    } else {
      this.expires = expires;
    }
    if (this.keepAlive) {
      this.keepAlive.start();
    }
  }
  async extend() {
    const { expiration } = await this._extend();
    this.expires = new Date(expiration);
  }
  async logoff() {
    if (this.keepAlive) {
      this.keepAlive.stop();
    }
    try {
      await this._logoff();
    } finally {
      this.token = void 0;
      this.expires = /* @__PURE__ */ new Date();
    }
  }
  async verify() {
    try {
      await this.rev.auth.verifySession();
      return true;
    } catch (err) {
      return false;
    }
  }
  /**
   *
   * @returns wasExtended - whether session was extended / re-logged in
   */
  async lazyExtend(options = {}) {
    const {
      extendThresholdMilliseconds: threshold = 3 * ONE_MINUTE2,
      verify: shouldVerify = true
    } = options;
    const { expires } = this;
    const timeLeft = expires ? expires.getTime() - Date.now() : -1;
    if (timeLeft <= 0) {
      await this.login();
      return true;
    }
    if (timeLeft > threshold) {
      try {
        await this.extend();
        return true;
      } catch (error) {
        this.rev.log("warn", "Error extending session - re-logging in", error);
      }
    } else if (!shouldVerify || await this.verify()) {
      return false;
    }
    await this.login();
    return true;
  }
  async queueRequest(queue) {
    await this._rateLimits?.[queue]?.();
  }
  /**
   * Abort pending executions. All unresolved promises are rejected with a `AbortError` error.
   * @param {string} [message] - message parameter for rejected AbortError
   */
  async clearQueues(message) {
    await clearQueues(this._rateLimits ?? {}, message);
  }
  /**
   * check if expiration time of session has passed
   */
  get isExpired() {
    const { expires } = this;
    if (!expires) {
      return true;
    }
    return Date.now() > expires.getTime();
  }
  /**
   * returns true if session isn't expired and has a token
   */
  get isConnected() {
    return !!this.token && !this.isExpired;
  }
  get username() {
    return this[_credentials].username;
  }
  get hasRateLimits() {
    return !!this._rateLimits;
  }
};
var OAuthSession = class extends SessionBase {
  refreshToken;
  async _login() {
    const { oauthConfig, authCode } = this[_credentials];
    if (!oauthConfig || !authCode) {
      throw new TypeError("OAuth Config / auth code not specified");
    }
    const {
      accessToken: token,
      expiration,
      refreshToken,
      userId
    } = await this.rev.auth.loginOAuth(oauthConfig, authCode);
    return { token, expiration, refreshToken, userId };
  }
  async _extend() {
    const { [_credentials]: { oauthConfig } } = this;
    const {
      // other API calls call this "token" instead of "accessToken", hence the rename
      accessToken: token,
      expiration,
      refreshToken
    } = await this.rev.auth.extendSessionOAuth(oauthConfig, this.refreshToken);
    Object.assign(this, { token, refreshToken });
    return { expiration };
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires,
      refreshToken: this.refreshToken
    };
  }
};
var OAuth2Session = class extends SessionBase {
  refreshToken;
  async _login() {
    const { oauthConfig, code, codeVerifier } = this[_credentials];
    if (!oauthConfig || !code || !codeVerifier) {
      throw new TypeError("OAuth Config / auth code / verifier not specified");
    }
    const {
      access_token: token,
      expires_in,
      refresh_token: refreshToken,
      userId
    } = await this.rev.auth.loginOAuth2(oauthConfig, code, codeVerifier);
    const expiresTime = Date.now() + parseInt(expires_in, 10) * 1e3;
    const expiration = new Date(expiresTime).toISOString();
    return { token, expiration, refreshToken, userId };
  }
  async _extend() {
    return this.rev.auth.extendSession();
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires
    };
  }
};
var UserSession = class extends SessionBase {
  userId;
  async _login() {
    const { username, password } = this[_credentials];
    if (!username || !password) {
      throw new TypeError("username/password not specified");
    }
    const {
      token,
      expiration,
      id: userId
    } = await this.rev.auth.loginUser(username, password);
    return { token, expiration, userId };
  }
  async _extend() {
    const { userId } = this;
    return this.rev.auth.extendSessionUser(userId);
  }
  async _logoff() {
    const { userId } = this;
    return this.rev.auth.logoffUser(userId);
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires,
      userId: this.userId
    };
  }
};
var ApiKeySession = class extends SessionBase {
  async _login() {
    const { apiKey, secret } = this[_credentials];
    if (!apiKey || !secret) {
      throw new TypeError("apiKey/secret not specified");
    }
    return this.rev.auth.loginToken(apiKey, secret);
  }
  async _extend() {
    const { apiKey } = this[_credentials];
    return this.rev.auth.extendSessionToken(apiKey);
  }
  async _logoff() {
    const { apiKey } = this[_credentials];
    return this.rev.auth.logoffToken(apiKey);
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires,
      apiKey: this[_credentials].apiKey
    };
  }
};
var JWTSession = class extends SessionBase {
  async _login() {
    const { jwtToken } = this[_credentials];
    if (!jwtToken) {
      throw new TypeError("JWT Token not specified");
    }
    const { accessToken: token, expiration } = await this.rev.auth.loginJWT(jwtToken);
    return { token, expiration, issuer: "vbrick" };
  }
  async _extend() {
    return this.rev.auth.extendSession();
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires
    };
  }
};
var GuestRegistrationSession = class extends SessionBase {
  async _login() {
    const { webcastId, guestRegistrationToken } = this[_credentials];
    if (!guestRegistrationToken || !webcastId) {
      throw new TypeError("Guest Registration Token or Webcast ID not specified");
    }
    const { accessToken: token } = await this.rev.auth.loginGuestRegistration(webcastId, guestRegistrationToken);
    const expiresTime = Date.now() + 1e3 * 60 * 15;
    const expiration = new Date(expiresTime).toISOString();
    return { token, expiration, issuer: "vbrick" };
  }
  async _extend() {
    return this.rev.auth.extendSession();
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires
    };
  }
};
var AccessTokenSession = class extends SessionBase {
  // just verify user on login
  async _login() {
    await this.rev.auth.verifySession();
    this.expires ||= new Date(Date.now() + 15 * 60 * 1e3);
    return {
      token: this.token || "",
      expiration: this.expires.toISOString(),
      issuer: "vbrick"
    };
  }
  async _extend() {
    return this.rev.auth.extendSession();
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires
    };
  }
  get isConnected() {
    return true;
  }
  get isExpired() {
    return false;
  }
};
var PublicOnlySession = class extends SessionBase {
  async _login() {
    this.rev.log("debug", "Using client with no authentication (publicOnly) - non-public endpoints will return 401");
    return {
      token: this.token || "",
      // very long expiration
      expiration: new Date(Date.now() + 24 * 60 * ONE_MINUTE2).toISOString(),
      issuer: "vbrick"
    };
  }
  async _extend() {
    return {
      expiration: new Date(Date.now() + 24 * 60 * ONE_MINUTE2).toISOString()
    };
  }
  async _logoff() {
    return;
  }
  toJSON() {
    return {
      token: this.token || "",
      expiration: this.expires
    };
  }
  get isConnected() {
    return true;
  }
  get isExpired() {
    return false;
  }
};
function createSession(rev, credentials, keepAliveOptions, rateLimits) {
  let session;
  const {
    session: sessionState = {},
    publicOnly,
    ...creds
  } = credentials;
  const {
    token,
    expiration,
    refreshToken,
    userId
  } = sessionState;
  const now = Date.now();
  const expires = new Date(expiration || now);
  const hasSession = token && typeof token === "string" && expires.getTime() > now;
  const isOAuth2Login = credentials.oauthConfig && (credentials.code && credentials.codeVerifier);
  const isLegacyOauthLogin = credentials.oauthConfig && (credentials.authCode || hasSession && refreshToken);
  const isApiKeyLogin = credentials.apiKey && (credentials.secret || hasSession && !userId);
  const isUsernameLogin = credentials.username && (credentials.password || hasSession && userId);
  const isJWTLogin = credentials.jwtToken;
  const isGuestRegistration = credentials.webcastId && credentials.guestRegistrationToken;
  if (isOAuth2Login) {
    session = new OAuth2Session(rev, creds, keepAliveOptions, rateLimits);
  } else if (isLegacyOauthLogin) {
    session = new OAuthSession(rev, creds, keepAliveOptions, rateLimits);
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
  } else if (isApiKeyLogin) {
    session = new ApiKeySession(rev, creds, keepAliveOptions, rateLimits);
  } else if (isJWTLogin) {
    session = new JWTSession(rev, creds, keepAliveOptions, rateLimits);
  } else if (isGuestRegistration) {
    session = new GuestRegistrationSession(rev, creds, keepAliveOptions, rateLimits);
  } else if (isUsernameLogin) {
    session = new UserSession(rev, creds, keepAliveOptions, rateLimits);
    if (userId) {
      session.userId = userId;
    }
  } else if (publicOnly) {
    session = new PublicOnlySession(rev, creds, false, rateLimits);
  } else if (hasSession) {
    session = new AccessTokenSession(rev, creds, keepAliveOptions, rateLimits);
  } else {
    throw new TypeError("Must specify credentials (username+password, apiKey+secret or oauthConfig+authCode)");
  }
  if (hasSession) {
    session.token = token;
    session.expires = expires;
  }
  return session;
}

// src/rev-client.ts
init_utils();
var RevClient3 = class {
  /**
   * The Rev tenant url (i.e. https://my.rev.url)
   * @group Properties
   */
  url;
  /**
   * turns on/off debug logging to console
   * @group Internal
   */
  logEnabled;
  /**
   ** This is an internal class that handles authentication and maintaining the session. It should not be used directly.
   * @group Internal
   */
  session;
  /**
   * @group APIs
   */
  admin;
  /**
   * @group APIs
   */
  audit;
  /**
   * @group APIs
   */
  auth;
  /**
   * @group APIs
   */
  category;
  /**
   * @group APIs
   */
  channel;
  /**
   * @group APIs
   */
  device;
  /**
   * @group APIs
   */
  environment;
  /**
   * @group APIs
   */
  group;
  /**
   * @group APIs
   */
  playlist;
  /**
   *
   * @group APIs
   */
  recording;
  /**
   * @group APIs
   */
  upload;
  /**
   * @group APIs
   */
  user;
  /**
   * @group APIs
   */
  video;
  /**
   * @group APIs
   */
  webcast;
  /**
   * @group APIs
   */
  zones;
  /**
   * @internal
   */
  _streamPreference;
  /**
   *
   * @param options The configuration options including target Rev URL and authentication credentials
   */
  constructor(options) {
    if (!isPlainObject(options) || !options.url) {
      throw new TypeError("Missing configuration options for client - url and username/password or apiKey/secret");
    }
    const {
      url,
      log,
      logEnabled = false,
      keepAlive = true,
      // NOTE default to false rate limiting for now. In future this may change
      rateLimits = false,
      defaultStreamPreference = "stream",
      ...credentials
    } = options;
    const urlObj = new URL(url);
    this.url = urlObj.origin;
    this.session = createSession(this, credentials, keepAlive, rateLimits);
    this.logEnabled = !!logEnabled;
    if (log) {
      this.log = (severity, ...args) => {
        if (!this.logEnabled) {
          return;
        }
        log(severity, ...args);
      };
    }
    this._streamPreference = defaultStreamPreference;
    Object.defineProperties(this, {
      admin: { value: adminAPIFactory(this), writable: false },
      // NOTE rate limiting option passed into api factory since its
      audit: { value: auditAPIFactory(this, rateLimits), writable: false },
      auth: { value: authAPIFactory(this), writable: false },
      category: { value: categoryAPIFactory(this), writable: false },
      channel: { value: channelAPIFactory(this), writable: false },
      device: { value: deviceAPIFactory(this), writable: false },
      environment: { value: environmentAPIFactory(this), writable: false },
      group: { value: groupAPIFactory(this), writable: false },
      playlist: { value: playlistAPIFactory(this), writable: false },
      recording: { value: recordingAPIFactory(this), writable: false },
      upload: { value: uploadAPIFactory(this), writable: false },
      user: { value: userAPIFactory(this), writable: false },
      video: { value: videoAPIFactory(this), writable: false },
      webcast: { value: webcastAPIFactory(this), writable: false },
      // COMBAK - DEPRECATED
      webcasts: { get: () => {
        this.log("debug", "webcasts is deprecated - use rev.webcast instead");
        return this.webcast;
      }, enumerable: false },
      zones: { value: zonesAPIFactory(this), writable: false }
    });
  }
  /**
   * make a REST request.
   * The Authorization http header for the current session will automatically be added.
   *
   * @group Request
   * @param method HTTP Method
   * @param endpoint API endpoint path
   * @param data Request body if PUT/POST/PATCH or query parameters object if GET/DELETE/HEAD. objects/arrays are automatically stringified
   * @param options additional request options, including additional HTTP Headers if necessary.
   * @returns the decoded response body as well as statuscode/headers/and raw response
   *
   */
  async request(method, endpoint, data = void 0, options = {}) {
    if (shouldInitialize()) await onInitialize();
    const url = new URL(endpoint, this.url);
    if (url.origin !== this.url) {
      throw new TypeError(`Invalid endpoint - must be relative to ${this.url}`);
    }
    let {
      headers: optHeaders,
      responseType,
      throwHttpErrors = true,
      ...requestOpts
    } = options;
    const headers = new polyfills_default.Headers(optHeaders);
    if (this.session.token && !headers.has("Authorization")) {
      headers.set("Authorization", `VBrick ${this.session.token}`);
    }
    if (headers.get("Authorization") === "") {
      headers.delete("Authorization");
    }
    const fetchOptions = {
      mode: "cors",
      method,
      ...requestOpts,
      headers
    };
    let shouldSetAsJSON = !headers.has("Content-Type");
    const normalizedMethod = method.toUpperCase();
    if (data) {
      if (["POST", "PUT", "PATCH"].includes(normalizedMethod)) {
        if (typeof data === "string") {
          fetchOptions.body = data;
        } else if (data instanceof polyfills_default.FormData) {
          shouldSetAsJSON = false;
          fetchOptions.body = data;
        } else if (isPlainObject(data) || Array.isArray(data)) {
          fetchOptions.body = JSON.stringify(data);
        } else {
          fetchOptions.body = data;
        }
      } else if (isPlainObject(data)) {
        for (let [key, value] of Object.entries(data)) {
          if (value instanceof Date) value = value.toISOString();
          url.searchParams.append(key, value);
        }
      } else {
        throw new TypeError(`Invalid payload for request to ${method} ${endpoint}`);
      }
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (shouldSetAsJSON && fetchOptions.body) {
      headers.set("Content-Type", "application/json");
    }
    this.log("debug", `Request ${method} ${endpoint}`);
    if (this.session.hasRateLimits) {
      switch (normalizedMethod) {
        case "GET":
          await this.session.queueRequest("get" /* Get */);
          break;
        case "POST":
        case "PATCH":
        case "PUT":
        case "DELETE":
          await this.session.queueRequest("post" /* Post */);
          break;
      }
    }
    const response = await polyfills_default.fetch(`${url}`, {
      ...fetchOptions,
      method,
      headers
    });
    const {
      ok,
      status: statusCode,
      statusText,
      headers: responseHeaders
    } = response;
    if (!ok) {
      if (throwHttpErrors) {
        const err = await RevError.create(response);
        this.log("debug", `Response ${method} ${endpoint} ${statusCode} ${err.code || statusText}`);
        throw err;
      }
      responseType = void 0;
    }
    this.log("debug", `Response ${method} ${endpoint} ${statusCode} ${statusText}`);
    let body = response.body;
    switch (responseType) {
      case "json":
        if (`${responseHeaders.get("content-length")}` === "0") {
          body = null;
        } else {
          body = await response.json();
        }
        break;
      case "text":
        body = await response.text();
        break;
      case "blob":
        body = await response.blob();
        break;
      case "stream":
        switch (this._streamPreference) {
          case "webstream":
            body = polyfills_default.asWebStream(response.body);
            break;
          case "nativestream":
            body = polyfills_default.asPlatformStream(response.body);
            break;
          default:
            body = response.body;
        }
        body = response.body;
        break;
      case "webstream":
        body = polyfills_default.asWebStream(response.body);
        break;
      case "nativestream":
        body = polyfills_default.asPlatformStream(response.body);
        break;
      default:
        body = await decodeBody(response, headers.get("Accept"));
    }
    return {
      statusCode,
      headers: responseHeaders,
      body,
      response
    };
  }
  /**
   *
   * Make a GET Request
   * @group Request
   * @param endpoint API path
   * @param data Query parameters as json object
   * @param options Additional request options
   * @returns Depends on options.responseType/API response - usually JSON object except for binary download endpoints
   */
  async get(endpoint, data, options) {
    const { body } = await this.request("GET", endpoint, data, options);
    return body;
  }
  /**
   *
   * Make a POST Request
   * @group Request
   * @param endpoint API path
   * @param data Request body
   * @param options Additional request options
   * @returns Depends on options.responseType/API response - usually JSON object
   */
  async post(endpoint, data, options) {
    const { body } = await this.request("POST", endpoint, data, options);
    return body;
  }
  /**
   *
   * Make a GET Request
   * @group Request
   * @param endpoint API path
   * @param data Request body
   * @param options Additional request options
   * @returns Depends on options.responseType/API response - usually JSON object or void
   */
  async put(endpoint, data, options) {
    const { body } = await this.request("PUT", endpoint, data, options);
    return body;
  }
  /**
   *
   * Make a PATCH Request
   * @group Request
   * @param endpoint API path
   * @param data Request body
   * @param options Additional request options
   * @returns
   */
  async patch(endpoint, data, options) {
    await this.request("PATCH", endpoint, data, options);
  }
  /**
   *
   * Make a DELETE Request
   * @group Request
   * @param endpoint API path
   * @param data query parameters as JSON object
   * @param options Additional request options
   * @returns
   */
  async delete(endpoint, data, options) {
    await this.request("DELETE", endpoint, data, options);
  }
  /**
   *
   * authenticate with Rev
   * @group Session
   */
  async connect() {
    await retry(
      () => this.session.login(),
      // Do not re-attempt logins with invalid user/password or rate limiting - it can lock out the user
      (err) => ![401, 429].includes(err.status)
    );
  }
  /**
   *
   * end rev session
   * @group Session
   */
  async disconnect() {
    try {
      await this.session.logoff();
    } catch (error) {
      this.log("warn", `Error in logoff, ignoring: ${error}`);
    }
  }
  /**
   *
   * Call the Extend Session API to maintain the current session's expiration time
   * Note that this API call is automatically handled unless `keepAlive: false` was specified in configuring the client.
   * @group Session
   */
  async extendSession() {
    return this.session.extend();
  }
  /**
   *
   * Returns true/false based on if the session is currently valid
   * @group Session
   * @returns Promise<boolean>
   */
  async verifySession() {
    return this.session.verify();
  }
  /**
   *
   * Returns true if session is connected and token's expiration date is in the future
   * @group Properties
   */
  get isConnected() {
    return this.session.isConnected;
  }
  /**
   *
   * the current session's `accessToken`
   * @group Properties
   */
  get token() {
    return this.session.token;
  }
  /**
   *
   * `Date` value when current `accessToken` will expire
   * @group Properties
   */
  get sessionExpires() {
    return this.session.expires;
  }
  /**
   *
   * get/set serialized session state (accessToken, expiration, and userId/apiKey)
   * Useful if you need to create a new RevClient instance with the same accessToken
   * @group Properties
   */
  get sessionState() {
    return this.session.toJSON();
  }
  /**
   *
   * get/set serialized session state (accessToken, expiration, and userId/apiKey)
   * Useful if you need to create a new RevClient instance with the same accessToken
   * @group Properties
   */
  set sessionState(state) {
    this.session.token = `${state.token}`;
    this.session.expires = new Date(state.expiration);
    for (let key of ["apiKey", "refreshToken", "userId"]) {
      if (key in state) {
        this.session[key] = `${state[key] || ""}`;
      }
    }
  }
  /**
   *
   * used internally to write debug log entries. Does nothing if `logEnabled` is `false`
   * @group Internal
   * @param severity
   * @param args
   * @returns
   */
  log(severity, ...args) {
    if (!this.logEnabled) {
      return;
    }
    const ts = (/* @__PURE__ */ new Date()).toJSON().replace("T", " ").slice(0, -5);
    console.debug(`${ts} REV-CLIENT [${severity}]`, ...args);
  }
};

// src/index.ts
init_rev_error();
init_utils();
init_file_utils();
init_polyfills();
var utils = {
  /**
   * Rate-limit a function - useful to throttle the number of API requests made in a minute
   * @example
   * ```js
   * const {utils} = import '@vbrick/rev-client'
   * const lock = utils.rateLimit(() => {}, { perSecond: 1 });
   * for (let i = 0; i < 10; i++) {
   *   await lock();
   *   console.log(`${i}: this will only be called once per second`);
   * }
   * ```
   */
  rateLimit: rate_limit_default,
  /**
   * Get a valid file extension for a given mimetype (used for uploading videos/transcriptions/etc)
   */
  getExtensionForMime,
  /**
   * Get a valid mimetype for a given file extension (used for uploading videos/transcriptions/etc)
   */
  getMimeForExtension,
  /**
   * ADVANCED - Override the underlying classes used in making requests. This is for internal use only and shouldn't typically be used.
   */
  setPolyfills
};

// src/index-nodefetch.cts
var { setPolyfills: setPolyfills2 } = (init_polyfills(), __toCommonJS(polyfills_exports));
var { nodePolyfillsCallback } = (init_node_polyfills(), __toCommonJS(node_polyfills_exports));
var { nodeFetchPolyfills } = (init_node_fetch_commonjs(), __toCommonJS(node_fetch_commonjs_exports));
setPolyfills2(nodePolyfillsCallback);
setPolyfills2(nodeFetchPolyfills);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RevClient,
  RevError,
  ScrollError,
  utils
});
//# sourceMappingURL=rev-client.cjs.map
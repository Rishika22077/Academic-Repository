const BASE = import.meta.env.VITE_API_BASE || "";
const TOKEN_KEY = "archive_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || null;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = "GET", body, form, params, raw = false } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check that the backend is running.");
  }

  // An expired or invalid token: sign the user out (but not for a failed login attempt).
  if (res.status === 401 && token && !path.startsWith("/api/auth/login")) onUnauthorized();

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.fieldErrors);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  postForm: (path, form) => request(path, { method: "POST", form }),
  putForm: (path, form) => request(path, { method: "PUT", form }),
};

/**
 * PDFs are protected by the login token, so a plain link cannot open them.
 * We fetch with the token and show the file from a temporary in-memory URL.
 */
export async function openReport(reportUrl) {
  const tab = window.open("", "_blank"); // opened first so the popup blocker allows it
  if (!tab) throw new ApiError(0, "Your browser blocked the new tab. Allow pop-ups for this site and try again.");
  try {
    const res = await request(reportUrl, { raw: true });
    const blob = await res.blob();
    tab.location = URL.createObjectURL(blob);
  } catch (e) {
    tab.close();
    throw e;
  }
}

export async function downloadReport(reportUrl, filename) {
  const res = await request(reportUrl, { raw: true, params: { download: true } });
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

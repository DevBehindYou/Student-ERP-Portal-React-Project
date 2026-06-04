const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": options.body instanceof FormData ? undefined : "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) throw new Error(await res.text());
  try { return await res.json(); } catch { return null; }
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: "POST", body: JSON.stringify(b) }),
  put: (p, b) => request(p, { method: "PUT", body: JSON.stringify(b) }),
  del: (p) => request(p, { method: "DELETE" }),
  upload: (p, fd) => request(p, { method: "POST", body: fd }),
};

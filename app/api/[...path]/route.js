const API_BASE =
  process.env.API_PROXY_TARGET || "http://161.97.114.108/hss/api";

const HIDDEN_LOGIN_IDS = new Set(["HSS-SUPER"]);

function isHiddenSystemUser(user) {
  if (!user || typeof user !== "object") return false;
  if (user.isSystemUser === true) return true;
  const loginID = String(user.loginID || user.loginId || "").trim();
  if (HIDDEN_LOGIN_IDS.has(loginID)) return true;
  const username = String(user.username || "").trim().toLowerCase();
  return username === "systemsuperadmin";
}

function stripHiddenUsers(payload) {
  if (Array.isArray(payload)) {
    return payload.filter((u) => !isHiddenSystemUser(u));
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.users)) {
    return { ...payload, users: payload.users.filter((u) => !isHiddenSystemUser(u)) };
  }
  return payload;
}

function isUsersListPath(pathParts) {
  const joined = pathParts.map((p) => String(p).toLowerCase()).join("/");
  return (
    joined === "users" ||
    joined === "auth/users" ||
    joined.endsWith("/users")
  );
}

async function handler(request, { params }) {
  const { path } = await params;
  const pathParts = Array.isArray(path) ? path : [];
  const target = `${API_BASE}/${pathParts.join("/")}`;

  const url = new URL(target);
  const incoming = new URL(request.url);
  incoming.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  const headers = new Headers();
  for (const [k, v] of request.headers.entries()) {
    if (
      ["host", "connection", "transfer-encoding", "content-length"].includes(
        k.toLowerCase()
      )
    )
      continue;
    headers.set(k, v);
  }

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(url.toString(), init);
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("transfer-encoding");

  if (
    request.method === "GET" &&
    isUsersListPath(pathParts) &&
    upstream.ok
  ) {
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await upstream.json();
      const filtered = stripHiddenUsers(data);
      return Response.json(filtered, {
        status: upstream.status,
        headers: resHeaders,
      });
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

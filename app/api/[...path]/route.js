const API_BASE =
  process.env.API_PROXY_TARGET || "http://161.97.114.108/api";

async function handler(request, { params }) {
  const { path } = await params;
  const target = `${API_BASE}/${path.join("/")}`;

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
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(url.toString(), init);

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("transfer-encoding");

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

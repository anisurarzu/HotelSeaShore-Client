// /utils/axiosInstance.js
import axios from "axios";

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_MAIN_URL || "/api/";

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    const isHttpApi =
      configured.startsWith("http://") || configured.startsWith("https://");
    if (isHttpApi) {
      try {
        const apiOrigin = new URL(configured).origin;
        if (apiOrigin !== window.location.origin) {
          return "/api/";
        }
      } catch {
        return "/api/";
      }
    }
  }

  return configured.endsWith("/") ? configured : `${configured}/`;
}

const coreAxios = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Access-Control-Allow-Origin": "*" },
});

coreAxios.interceptors.request.use((req) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    req.headers.authorization = "Bearer " + token;
  }
  return req;
});

coreAxios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // Redirecting on client-side
      if (typeof window !== "undefined") {
        window.location.href = "/";
        localStorage.clear();
      }
      return Promise.reject(error);
    } else {
      return Promise.reject(error);
    }
  }
);

export default coreAxios;

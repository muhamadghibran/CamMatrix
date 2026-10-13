export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
export const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws";
export const MEDIAMTX_URL =
  import.meta.env.VITE_MEDIAMTX_URL || "http://localhost:8889";

export function getWsUrl(path = "") {
  const envWs = import.meta.env.VITE_WS_BASE_URL;
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  if (envWs && (envWs.startsWith("ws://") || envWs.startsWith("wss://"))) {
    return `${envWs.replace(/\/+$/, "")}${cleanPath}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;
  const port = window.location.port === "5173" ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
  const basePrefix = envWs && envWs.startsWith("/") ? envWs : "/ws";
  return `${protocol}//${hostname}${port}${basePrefix.replace(/\/+$/, "")}${cleanPath}`;
}

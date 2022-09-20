import { ServerResponse, IncomingMessage } from "http";

export function prettyBytes(size: number) {
  return `${(size / 1024).toFixed(2)} k`;
}

export function useUrl(req: IncomingMessage) {
  return new URL(req.url!, `http://${req.headers.host}`);
}

export function sendJson(res: ServerResponse, data: Record<string, any>) {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

export function debounce(func: Function, timeout = 300) {
  let timer: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

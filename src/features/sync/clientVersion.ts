const DEFAULT_CLIENT_VERSION = "yasumi-frontend/0.1.0";

export function getSyncClientVersion(): string {
  const env = import.meta.env as { readonly VITE_YASUMI_CLIENT_VERSION?: unknown };
  const configured = env.VITE_YASUMI_CLIENT_VERSION;
  return typeof configured === "string" && configured.length > 0 ? configured : DEFAULT_CLIENT_VERSION;
}

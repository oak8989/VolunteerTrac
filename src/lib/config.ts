// Runtime configuration injected by the container (docker/entrypoint.sh renders
// /config.js from ADMIN_* / ORG_NAME / SMTP_* environment variables). In plain
// static/dev mode the fallback file in public/ provides the same shape.

export interface AppConfig {
  admin: { name: string; email: string; password: string };
  orgName: string;
  smtp: { host: string; port: string; user: string; from: string };
}

type Raw = {
  admin?: Partial<AppConfig["admin"]>;
  orgName?: string;
  smtp?: Partial<AppConfig["smtp"]>;
};

const raw: Raw =
  (typeof window !== "undefined" && (window as unknown as { __VOLUNTEERTRAC_CONFIG__?: Raw }).__VOLUNTEERTRAC_CONFIG__) || {};

export const appConfig: AppConfig = {
  admin: {
    name: raw.admin?.name?.trim() || "Alex Morgan",
    email: raw.admin?.email?.trim() || "admin@volunteertrac.local",
    password: raw.admin?.password || "changeme",
  },
  orgName: raw.orgName?.trim() || "",
  smtp: {
    host: raw.smtp?.host?.trim() || "",
    port: raw.smtp?.port?.trim() || "587",
    user: raw.smtp?.user?.trim() || "",
    from: raw.smtp?.from?.trim() || "",
  },
};

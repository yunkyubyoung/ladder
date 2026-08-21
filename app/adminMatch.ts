export type AdminMatchConfig = {
  enabled: boolean;
  topItem: string;
  bottomItem: string;
};

export const EMPTY_ADMIN_MATCH: AdminMatchConfig = {
  enabled: false,
  topItem: "",
  bottomItem: "",
};

export async function loadAdminMatch(): Promise<AdminMatchConfig> {
  try {
    const response = await fetch("/api/admin-match", {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return EMPTY_ADMIN_MATCH;
    const data = await response.json() as { config?: Partial<AdminMatchConfig> };
    return {
      enabled: data.config?.enabled === true,
      topItem: typeof data.config?.topItem === "string" ? data.config.topItem : "",
      bottomItem: typeof data.config?.bottomItem === "string" ? data.config.bottomItem : "",
    };
  } catch {
    return EMPTY_ADMIN_MATCH;
  }
}

export async function saveAdminMatch(config: AdminMatchConfig, password: string) {
  const response = await fetch("/api/admin-match", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ password, config }),
  });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || "설정을 저장하지 못했습니다.");
}

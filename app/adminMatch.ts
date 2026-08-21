export type AdminMatchConfig = {
  enabled: boolean;
  topItem: string;
  bottomItem: string;
};

export const ADMIN_MATCH_STORAGE_KEY = "ladder-admin-match";

export const EMPTY_ADMIN_MATCH: AdminMatchConfig = {
  enabled: false,
  topItem: "",
  bottomItem: "",
};

export function loadAdminMatch(): AdminMatchConfig {
  try {
    const saved = localStorage.getItem(ADMIN_MATCH_STORAGE_KEY);
    if (!saved) return EMPTY_ADMIN_MATCH;
    const parsed = JSON.parse(saved) as Partial<AdminMatchConfig>;
    return {
      enabled: parsed.enabled === true,
      topItem: typeof parsed.topItem === "string" ? parsed.topItem : "",
      bottomItem: typeof parsed.bottomItem === "string" ? parsed.bottomItem : "",
    };
  } catch {
    return EMPTY_ADMIN_MATCH;
  }
}

export function saveAdminMatch(config: AdminMatchConfig) {
  localStorage.setItem(ADMIN_MATCH_STORAGE_KEY, JSON.stringify(config));
}

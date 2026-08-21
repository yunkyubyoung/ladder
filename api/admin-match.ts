import { createClient } from "@vercel/edge-config";

type AdminMatchConfig = {
  enabled: boolean;
  topItem: string;
  bottomItem: string;
};

const CONFIG_KEY = "ladderAdminMatch";
const EMPTY_CONFIG: AdminMatchConfig = { enabled: false, topItem: "", bottomItem: "" };

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function normalize(value: unknown): AdminMatchConfig {
  if (!value || typeof value !== "object") return EMPTY_CONFIG;
  const config = value as Partial<AdminMatchConfig>;
  return {
    enabled: config.enabled === true,
    topItem: typeof config.topItem === "string" ? config.topItem.trim().slice(0, 10) : "",
    bottomItem: typeof config.bottomItem === "string" ? config.bottomItem.trim().slice(0, 12) : "",
  };
}

async function readConfig() {
  const connectionString = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG;
  if (!connectionString) throw new Error("GLOBAL_CONFIG 환경변수가 설정되지 않았습니다.");
  const client = createClient(connectionString);
  return normalize(await client.get(CONFIG_KEY));
}

async function writeConfig(config: AdminMatchConfig) {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !apiToken) throw new Error("Edge Config 쓰기 환경변수가 설정되지 않았습니다.");
  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  const response = await fetch(`https://api.vercel.com/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items${query}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ operation: "upsert", key: CONFIG_KEY, value: config }] }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Edge Config 저장 실패 (${response.status}): ${detail.slice(0, 160)}`);
  }
}

export default {
  async fetch(request: Request) {
    if (request.method === "GET") {
      try {
        return json({ config: await readConfig() });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "설정을 불러오지 못했습니다." }, 503);
      }
    }
    if (request.method === "POST") {
      try {
        const body = await request.json() as { password?: unknown; config?: unknown };
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) return json({ error: "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다." }, 503);
        if (typeof body.password !== "string" || body.password !== adminPassword) {
          return json({ error: "관리자 비밀번호가 올바르지 않습니다." }, 401);
        }
        const config = normalize(body.config);
        if (config.enabled && (!config.topItem || !config.bottomItem)) {
          return json({ error: "상단 항목과 하단 항목이 모두 필요합니다." }, 400);
        }
        await writeConfig(config);
        return json({ ok: true, config });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "설정을 저장하지 못했습니다." }, 500);
      }
    }
    return json({ error: "지원하지 않는 요청입니다." }, 405);
  },
};

const GITHUB_API_BASE = "https://api.github.com";

const GH_WORKFLOW_TOKEN = Deno.env.get("GH_WORKFLOW_TOKEN") ?? "";
const GH_WORKFLOW_OWNER = Deno.env.get("GH_WORKFLOW_OWNER") ?? "easony123";
const GH_WORKFLOW_REPO = Deno.env.get("GH_WORKFLOW_REPO") ?? "xauradar";
const GH_SIGNAL_WORKFLOW_ID = Deno.env.get("GH_SIGNAL_WORKFLOW_ID") ?? "signal_bot.yml";
const GH_SIGNAL_WORKFLOW_REF = Deno.env.get("GH_SIGNAL_WORKFLOW_REF") ?? "main";
const SIGNAL_ENGINE_CRON_SECRET = Deno.env.get("SIGNAL_ENGINE_CRON_SECRET") ?? "";
const SIGNAL_ENGINE_DISPATCH_MIN_GAP_SECONDS = Math.max(
  Number(Deno.env.get("SIGNAL_ENGINE_DISPATCH_MIN_GAP_SECONDS") ?? "150") || 150,
  30,
);

type GitHubRun = {
  id: number;
  created_at?: string;
  event?: string;
  status?: string;
  conclusion?: string | null;
  head_branch?: string;
};

type GitHubRunsResponse = {
  workflow_runs?: GitHubRun[];
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function githubHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GH_WORKFLOW_TOKEN}`,
    "User-Agent": "xauusd-signal-engine-dispatcher",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function parseIsoMs(value: string | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function shouldSkipDispatch(runs: GitHubRun[], nowMs: number): { skip: boolean; reason?: string } {
  for (const run of runs) {
    if (run.head_branch && run.head_branch !== GH_SIGNAL_WORKFLOW_REF) continue;

    const status = String(run.status ?? "").toLowerCase();
    if (status === "in_progress" || status === "queued" || status === "waiting" || status === "requested") {
      return { skip: true, reason: `workflow_${status}` };
    }

    const createdAtMs = parseIsoMs(run.created_at);
    if (createdAtMs === null) continue;
    const ageSeconds = Math.floor((nowMs - createdAtMs) / 1000);
    if (ageSeconds >= 0 && ageSeconds < SIGNAL_ENGINE_DISPATCH_MIN_GAP_SECONDS) {
      return { skip: true, reason: `recent_dispatch_${ageSeconds}s` };
    }
  }
  return { skip: false };
}

async function listRecentRuns(): Promise<GitHubRun[]> {
  const url = new URL(
    `${GITHUB_API_BASE}/repos/${GH_WORKFLOW_OWNER}/${GH_WORKFLOW_REPO}/actions/workflows/${GH_SIGNAL_WORKFLOW_ID}/runs`,
  );
  url.searchParams.set("per_page", "10");
  url.searchParams.set("event", "workflow_dispatch");
  url.searchParams.set("branch", GH_SIGNAL_WORKFLOW_REF);

  const resp = await fetch(url.toString(), { headers: githubHeaders() });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`GitHub runs lookup failed (${resp.status}): ${detail}`);
  }

  const payload = (await resp.json()) as GitHubRunsResponse;
  return payload.workflow_runs ?? [];
}

async function dispatchWorkflow(): Promise<void> {
  const resp = await fetch(
    `${GITHUB_API_BASE}/repos/${GH_WORKFLOW_OWNER}/${GH_WORKFLOW_REPO}/actions/workflows/${GH_SIGNAL_WORKFLOW_ID}/dispatches`,
    {
      method: "POST",
      headers: {
        ...githubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: GH_SIGNAL_WORKFLOW_REF }),
    },
  );

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`GitHub workflow dispatch failed (${resp.status}): ${detail}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method === "GET") {
    return jsonResponse({
      ok: true,
      workflow_owner: GH_WORKFLOW_OWNER,
      workflow_repo: GH_WORKFLOW_REPO,
      workflow_id: GH_SIGNAL_WORKFLOW_ID,
      workflow_ref: GH_SIGNAL_WORKFLOW_REF,
      min_gap_seconds: SIGNAL_ENGINE_DISPATCH_MIN_GAP_SECONDS,
      cron_secret_enabled: Boolean(SIGNAL_ENGINE_CRON_SECRET),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!GH_WORKFLOW_TOKEN) {
    return jsonResponse({ error: "Missing required secret: GH_WORKFLOW_TOKEN" }, 500);
  }

  if (SIGNAL_ENGINE_CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret") ?? "";
    if (!secret || secret !== SIGNAL_ENGINE_CRON_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  try {
    const nowMs = Date.now();
    const recentRuns = await listRecentRuns();
    const skipDecision = shouldSkipDispatch(recentRuns, nowMs);
    if (skipDecision.skip) {
      return jsonResponse({
        ok: true,
        dispatched: false,
        reason: skipDecision.reason,
        workflow_id: GH_SIGNAL_WORKFLOW_ID,
      });
    }

    await dispatchWorkflow();
    return jsonResponse({
      ok: true,
      dispatched: true,
      workflow_id: GH_SIGNAL_WORKFLOW_ID,
      workflow_ref: GH_SIGNAL_WORKFLOW_REF,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

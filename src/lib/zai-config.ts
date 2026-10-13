import fs from "node:fs/promises";

/**
 * Z.ai SDK bootstrap for serverless deploys (Vercel).
 *
 * The SDK reads a JSON config file (.z-ai-config) from cwd, $HOME, or /etc.
 * The sandbox has /etc/.z-ai-config; a Vercel function has NONE, so
 * ZAI.create() fails. This helper:
 *   1. does nothing when a config file already resolves (sandbox/local), or
 *   2. writes /tmp/.z-ai-config from ZAI_* env vars and points $HOME at
 *      /tmp for the process, so the SDK picks it up.
 *
 * Set these five env vars on the hosting platform to activate the AI
 * assistant in production:
 *   ZAI_BASE_URL (e.g. https://internal-api.z.ai/v1)
 *   ZAI_API_KEY, ZAI_CHAT_ID, ZAI_TOKEN, ZAI_USER_ID
 */

/**
 * True when the SDK has a usable config (sandbox file or ZAI_* env vars).
 * When false, callers should degrade to the offline brain
 * (assistant-fallback.ts) instead of erroring — search stays available
 * with zero cost and zero secrets.
 */
export async function isZaiConfigured(): Promise<boolean> {
  // QA switch: force the offline brain locally
  if (process.env.ASSISTANT_FORCE_FALLBACK === "1") return false;
  try {
    await fs.access("/etc/.z-ai-config");
    return true;
  } catch {
    /* keep checking */
  }
  return Boolean(process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY);
}

let bootstrapped = false;

export async function ensureZaiConfig(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  // 1) A reachable config file already exists? (cwd / $HOME / /etc)
  try {
    await fs.access("/etc/.z-ai-config");
    return; // sandbox/local — the SDK will find it
  } catch {
    /* keep going */
  }

  // 2) Serverless: build the config from env vars.
  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;
  if (!baseUrl || !apiKey) {
    // Not configured — the route will answer with its graceful "unavailable"
    // message. The assistant stays dormant instead of crashing.
    return;
  }

  try {
    await fs.writeFile(
      "/tmp/.z-ai-config",
      JSON.stringify({
        baseUrl,
        apiKey,
        chatId: process.env.ZAI_CHAT_ID ?? "",
        token: process.env.ZAI_TOKEN ?? "",
        userId: process.env.ZAI_USER_ID ?? "",
      }),
      { mode: 0o600 }
    );
    // The SDK resolves $HOME at call time — point it at /tmp so its
    // second search path hits the file we just wrote.
    process.env.HOME = "/tmp";
  } catch (e) {
    console.error("ensureZaiConfig failed", e);
  }
}

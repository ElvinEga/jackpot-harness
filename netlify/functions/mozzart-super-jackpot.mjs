// Mozzart rejects non-mobile clients (Cloudflare error 1010) and sends no CORS headers, so this
// request has to happen server-side. Same leg as the dev proxy in vite.config.ts.

const UPSTREAM = "https://www.mozzartbet.co.ke/predefined-tickets";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

const LABEL = "[mozzart-super-jackpot]";

export default async function handler() {
  const startedAt = Date.now();
  try {
    const upstream = await fetch(UPSTREAM, {
      headers: {
        "User-Agent": "okhttp/4.9.0",
        Accept: "application/json, text/plain, */*",
      },
    });
    const body = await upstream.text();
    const summary = `${upstream.status} ${upstream.headers.get("content-type")} ${body.length}b in ${Date.now() - startedAt}ms`;
    if (upstream.ok) {
      console.log(`${LABEL} upstream ${summary}`);
    } else {
      console.warn(`${LABEL} upstream blocked ${summary} body: ${body.slice(0, 300).replace(/\s+/g, " ")}`);
    }
    return { statusCode: upstream.status, headers: HEADERS, body };
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}${err.cause ? ` (cause: ${err.cause})` : ""}` : String(err);
    console.error(`${LABEL} upstream fetch failed in ${Date.now() - startedAt}ms: ${detail}`);
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

// Mozzart rejects non-mobile clients (Cloudflare error 1010) and sends no CORS headers, so this
// request has to happen server-side. Same leg as the dev proxy in vite.config.ts.

const UPSTREAM = "https://www.mozzartbet.co.ke/predefined-tickets";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export default async function handler() {
  try {
    const upstream = await fetch(UPSTREAM, {
      headers: {
        "User-Agent": "okhttp/4.9.0",
        Accept: "application/json, text/plain, */*",
      },
    });
    return { statusCode: upstream.status, headers: HEADERS, body: await upstream.text() };
  } catch (err) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

// SportPesa sits behind Akamai, which serves a bot challenge to browsers and sends no CORS
// headers, so this request has to happen server-side. Same leg as the dev proxy in vite.config.ts.

const UPSTREAM = "https://jackpot-offer-api.ke.sportpesa.com/api/jackpots/active";

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

const STORE_KEY = "celebrate-rsvp-responses";
const API_PATH = "/api/rsvps";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json;charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readResponses(env) {
  const saved = await env.RSVPS.get(STORE_KEY, { type: "json" });
  return Array.isArray(saved) ? saved : [];
}

async function writeResponses(env, responses) {
  await env.RSVPS.put(STORE_KEY, JSON.stringify(responses));
}

async function handleApiRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!env.RSVPS) {
    return jsonResponse({ error: "Missing RSVPS KV binding." }, 500);
  }

  if (request.method === "GET") {
    return jsonResponse({ responses: await readResponses(env) });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const body = await request.json();

  if (body.action === "upsert") {
    const response = body.response;

    if (!response?.inviteeId) {
      return jsonResponse({ error: "Missing inviteeId." }, 400);
    }

    const responses = await readResponses(env);
    const index = responses.findIndex((savedResponse) => savedResponse.inviteeId === response.inviteeId);

    if (index >= 0) {
      responses[index] = response;
    } else {
      responses.push(response);
    }

    await writeResponses(env, responses);
    return jsonResponse({ ok: true, responses });
  }

  if (body.action === "clear") {
    const expectedPassword = env.RESET_PASSWORD || "archie";

    if (body.password !== expectedPassword) {
      return jsonResponse({ error: "Wrong password." }, 403);
    }

    await writeResponses(env, []);
    return jsonResponse({ ok: true, responses: [] });
  }

  return jsonResponse({ error: "Unknown action." }, 400);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === API_PATH) {
      return handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

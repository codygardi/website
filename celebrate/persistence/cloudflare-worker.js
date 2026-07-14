const STORE_KEY = "celebrate-rsvp-responses";

const defaultHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    ...defaultHeaders,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json;charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function responsesToCsv(responses) {
  const headers = ["inviteeId", "name", "phone", "status", "availability", "notes", "submittedAt", "updatedAt"];
  const rows = responses.map((response) => headers.map((header) => csvEscape(response[header])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

async function readResponses(env) {
  const saved = await env.RSVPS.get(STORE_KEY, { type: "json" });
  return Array.isArray(saved) ? saved : [];
}

async function writeResponses(env, responses) {
  await env.RSVPS.put(STORE_KEY, JSON.stringify(responses));
}

async function handleList(request, env) {
  const url = new URL(request.url);
  const responses = await readResponses(env);

  if (url.searchParams.get("format") === "csv") {
    return new Response(responsesToCsv(responses), {
      headers: {
        ...corsHeaders(request),
        "Content-Type": "text/csv;charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return jsonResponse(request, { responses });
}

async function readJsonBody(request) {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

async function handleUpsert(request, env, response) {
  if (!response?.inviteeId) {
    return jsonResponse(request, { error: "Missing inviteeId." }, 400);
  }

  const responses = await readResponses(env);
  const index = responses.findIndex((savedResponse) => savedResponse.inviteeId === response.inviteeId);

  if (index >= 0) {
    responses[index] = response;
  } else {
    responses.push(response);
  }

  await writeResponses(env, responses);
  return jsonResponse(request, { ok: true, responses });
}

async function handleClear(request, env, password) {
  const expectedPassword = env.RESET_PASSWORD || "archie";

  if (password !== expectedPassword) {
    return jsonResponse(request, { error: "Wrong password." }, 403);
  }

  await writeResponses(env, []);
  return jsonResponse(request, { ok: true, responses: [] });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (!env.RSVPS) {
      return jsonResponse(request, { error: "Missing RSVPS KV binding." }, 500);
    }

    if (request.method === "GET") {
      return handleList(request, env);
    }

    if (request.method !== "POST") {
      return jsonResponse(request, { error: "Method not allowed." }, 405);
    }

    const body = await readJsonBody(request);

    if (body.action === "upsert") {
      return handleUpsert(request, env, body.response);
    }

    if (body.action === "clear") {
      return handleClear(request, env, body.password);
    }

    return jsonResponse(request, { error: "Unknown action." }, 400);
  },
};

// Shared CORS configuration for all edge functions
// In production, set ALLOWED_ORIGINS env var to your domain(s)
// Example: "https://yourdomain.com,https://www.yourdomain.com"

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(",").map(o => o.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"];

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(req.headers.get("origin"))
    });
  }
  return null;
}

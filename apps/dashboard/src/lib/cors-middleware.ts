import { env } from "~/env";

export const getCorsHeaders = (origin: string) => {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, trpc-accept, x-trpc-source",
    "Access-Control-Allow-Credentials": "true",
  });
};

export const createHandlerWithCors = (
  handler: (request: Request) => Promise<Response>,
) => {
  return async (request: Request) => {
    const response = await handler(request);
    const origin = request.headers.get("origin");
    if (origin && origin === env.BENEFICIARY_APP_URL) {
      const corsHeaders = getCorsHeaders(origin);
      for (const [key, value] of corsHeaders.entries()) {
        response.headers.set(key, value);
      }
    }
    return response;
  };
};

export const corsOptionsHandler = (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin && origin === env.BENEFICIARY_APP_URL) {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return new Response(null, { status: 204 });
};

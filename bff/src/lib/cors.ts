import { HttpRequest, HttpResponseInit } from '@azure/functions';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN!;

// Fest verdrahtet, nie die Origin des Requests zurueckspiegeln: mit
// Allow-Credentials: true wuerde der Browser sonst credentialed Requests von
// ueberall erlauben und die Pruefung waere still keine mehr. `*` ist zusammen
// mit Credentials ohnehin ungueltig.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
};

export function handlePreflight(request: HttpRequest): HttpResponseInit | null {
  if (request.method !== 'OPTIONS') return null;
  return {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  };
}

/** Busca novos leads na Places API (chamado pelo pg_cron, ex.: uma vez por semana). */
import { buscarLeads } from "../_shared/busca.ts";
import { json, segredoOk } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (!segredoOk(req.headers.get("x-cron-secret"), Deno.env.get("CRON_SECRET"))) {
    return json({ erro: "não autorizado" }, 401);
  }
  try {
    return json(await buscarLeads());
  } catch (e) {
    return json({ erro: (e as Error).message }, 500);
  }
});

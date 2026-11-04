import { buildTextQuery, filterPlaces, PLACES_FIELD_MASK, placeToLead } from "./core.ts";
import { db, env, getConfig } from "./db.ts";

/**
 * Busca segmento × bairro na Places API (New) e grava os leads com menos de N avaliações.
 * Preserva status e conversas de quem já existe; respeita o limite mensal de chamadas.
 */
export async function buscarLeads(): Promise<{ chamadas: number; novos: number; atualizados: number; motivo?: string }> {
  const cfg = await getConfig();
  const mes = new Date().toISOString().slice(0, 7);
  const limiteMensal = Number(cfg.limite_mensal_places ?? 900);
  const maxPaginas = Number(cfg.max_paginas_busca ?? 3);
  const limite = Number(cfg.limite_avaliacoes ?? 50);

  const { data: uso } = await db.from("places_uso").select("chamadas").eq("mes", mes).maybeSingle();
  let chamadasMes = uso?.chamadas ?? 0;

  const { data: bloqueados } = await db.from("leads").select("place_id").eq("status", "nao_contatar");
  const blocked = new Set((bloqueados ?? []).map((r) => r.place_id as string));
  const seen = new Set<string>();
  const leads: ReturnType<typeof placeToLead>[] = [];
  let chamadas = 0;
  let motivo: string | undefined;

  busca: for (const bairro of cfg.bairros ?? []) {
    for (const segmento of cfg.segmentos ?? []) {
      let token: string | undefined;
      let paginas = 0;
      do {
        if (chamadasMes >= limiteMensal) {
          motivo = "limite mensal da Places API";
          break busca;
        }
        const body: Record<string, unknown> = {
          textQuery: buildTextQuery(segmento, bairro, cfg.cidade),
          languageCode: "pt-BR",
          regionCode: "BR",
          pageSize: 20,
        };
        if (token) body.pageToken = token;
        const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": env("PLACES_API_KEY"),
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
          },
          body: JSON.stringify(body),
        });
        const { data: n } = await db.rpc("places_uso_incrementar", { p_mes: mes });
        chamadasMes = Number(n ?? chamadasMes + 1);
        chamadas++;
        paginas++;
        const json = await res.json();
        if (!res.ok) throw new Error(`Places API ${res.status}: ${json?.error?.message ?? ""}`);
        for (const p of filterPlaces(json.places, limite, seen, blocked)) {
          leads.push(placeToLead(p, bairro, segmento));
        }
        token = json.nextPageToken;
      } while (token && paginas < maxPaginas);
    }
  }

  // Separa novos de existentes para não sobrescrever status, bairro_busca e categoria.
  const ids = leads.map((l) => l.place_id);
  const { data: existentes } = ids.length
    ? await db.from("leads").select("place_id").in("place_id", ids)
    : { data: [] };
  const existe = new Set((existentes ?? []).map((r) => r.place_id as string));
  const agora = new Date().toISOString();

  const novos = leads.filter((l) => !existe.has(l.place_id));
  if (novos.length) {
    const { error } = await db.from("leads").insert(novos.map((l) => ({ ...l, atualizado_em: agora })));
    if (error) throw error;
  }
  for (const l of leads.filter((l) => existe.has(l.place_id))) {
    await db.from("leads").update({
      nome: l.nome, endereco: l.endereco, avaliacoes: l.avaliacoes, nota: l.nota,
      telefone: l.telefone, maps_url: l.maps_url, site: l.site, atualizado_em: agora,
    }).eq("place_id", l.place_id);
  }
  return { chamadas, novos: novos.length, atualizados: leads.length - novos.length, motivo };
}

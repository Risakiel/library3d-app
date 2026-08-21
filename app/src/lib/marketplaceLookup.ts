import * as cheerio from "cheerio";

export interface MarketplaceLookupResult {
  url: string;
  title: string;
  tags: string[];
}

const USER_AGENT = "Mozilla/5.0 (compatible; Library3DBot/1.0)";

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  return response.text();
}

interface CGTraderSearchResponse {
  data?: { attributes?: { url?: string; title?: string } }[];
}

async function lookupCGTrader(query: string): Promise<MarketplaceLookupResult | null> {
  // La page de recherche renvoie du JSON brut (pas du HTML) a une requete
  // serveur simple - on parse directement ce JSON plutot que le DOM.
  const searchUrl = `https://www.cgtrader.com/search?keywords=${encodeURIComponent(query)}`;
  const searchBody = await fetchText(searchUrl);

  let searchData: CGTraderSearchResponse;
  try {
    searchData = JSON.parse(searchBody);
  } catch {
    return null;
  }

  const firstResult = searchData.data?.[0]?.attributes;
  const detailUrl = firstResult?.url;
  if (!detailUrl) return null;

  // La fiche produit, elle, est bien du HTML classique.
  const detailHtml = await fetchText(detailUrl);
  const $detail = cheerio.load(detailHtml);

  const title = $detail("h1").first().text().trim() || firstResult.title || "";
  const tags = $detail(".description-area__related-tag-link")
    .map((_, el) => $detail(el).text().trim())
    .get()
    .filter(Boolean);

  return { url: detailUrl, title, tags: Array.from(new Set(tags)) };
}

type LookupFn = (query: string) => Promise<MarketplaceLookupResult | null>;

// Seul CGTrader est verifie pour le moment (structure de page confirmee).
// Les autres marketplaces (Cults3D, MyMiniFactory, Thingiverse, Gambody) et
// les pages Patreon des createurs ne sont pas encore supportees.
const MARKETPLACE_LOOKUPS: Record<string, LookupFn> = {
  CGTrader: lookupCGTrader,
};

export function isMarketplaceSupported(name: string): boolean {
  return name in MARKETPLACE_LOOKUPS;
}

export async function lookupMarketplaceTags(marketplaceName: string, query: string) {
  const lookup = MARKETPLACE_LOOKUPS[marketplaceName];
  if (!lookup) return null;
  return lookup(query);
}

import * as cheerio from "cheerio";

export interface MarketplaceLookupResult {
  url: string;
  title: string;
  tags: string[];
}

const USER_AGENT = "Mozilla/5.0 (compatible; Library3DBot/1.0)";

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  return response.text();
}

async function lookupCGTrader(query: string): Promise<MarketplaceLookupResult | null> {
  const searchUrl = `https://www.cgtrader.com/search?keywords=${encodeURIComponent(query)}`;
  const searchHtml = await fetchHtml(searchUrl);
  const $search = cheerio.load(searchHtml);

  const href = $search("a.cgt-model-card__link").first().attr("href");
  if (!href) return null;

  const detailUrl = href.startsWith("http") ? href : `https://www.cgtrader.com${href}`;
  const detailHtml = await fetchHtml(detailUrl);
  const $detail = cheerio.load(detailHtml);

  const title = $detail("h1").first().text().trim();
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

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

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
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
    .get();

  return { url: detailUrl, title, tags: uniqueTags(tags) };
}

interface MyMiniFactorySearchResponse {
  objectResults?: { absolute_url?: string; name?: string }[];
}

async function lookupMyMiniFactory(query: string): Promise<MarketplaceLookupResult | null> {
  // L'API de recherche renvoie du JSON directement, meme pour un fetch serveur simple.
  const searchUrl = `https://www.myminifactory.com/api/search?object=1&bundle=1&premium=1&query=${encodeURIComponent(query)}&sortBy=relevance&page=1`;
  const searchBody = await fetchText(searchUrl);

  let searchData: MyMiniFactorySearchResponse;
  try {
    searchData = JSON.parse(searchBody);
  } catch {
    return null;
  }

  const firstResult = searchData.objectResults?.[0];
  const detailUrl = firstResult?.absolute_url;
  if (!detailUrl) return null;

  const detailHtml = await fetchText(detailUrl);
  const $detail = cheerio.load(detailHtml);

  const tags = $detail('a[href*="/search?tags"]')
    .map((_, el) => $detail(el).text().trim())
    .get();

  return { url: detailUrl, title: firstResult.name || "", tags: uniqueTags(tags) };
}

async function lookupCults3D(query: string): Promise<MarketplaceLookupResult | null> {
  // La recherche et la fiche produit sont toutes les deux du HTML classique cote serveur.
  const searchUrl = `https://cults3d.com/en/search?q=${encodeURIComponent(query)}`;
  const searchHtml = await fetchText(searchUrl);
  const $search = cheerio.load(searchHtml);

  const href = $search('a[href*="/3d-model/"]').first().attr("href");
  if (!href) return null;

  const detailUrl = href.startsWith("http") ? href : `https://cults3d.com${href}`;
  const detailHtml = await fetchText(detailUrl);
  const $detail = cheerio.load(detailHtml);

  const title = $detail("h1").first().text().trim();
  const tags = $detail('a[href*="/tags/"]')
    .map((_, el) => $detail(el).text().trim())
    .get();

  return { url: detailUrl, title, tags: uniqueTags(tags) };
}

type LookupFn = (query: string) => Promise<MarketplaceLookupResult | null>;

// Marketplaces avec structure de page verifiee. Les pages Patreon des
// createurs individuels ne sont pas des marketplaces publiques et ne sont
// pas supportees.
const MARKETPLACE_LOOKUPS: Record<string, LookupFn> = {
  CGTrader: lookupCGTrader,
  MyMiniFactory: lookupMyMiniFactory,
  Cults3D: lookupCults3D,
};

export function isMarketplaceSupported(name: string): boolean {
  return name in MARKETPLACE_LOOKUPS;
}

export async function lookupMarketplaceTags(marketplaceName: string, query: string) {
  const lookup = MARKETPLACE_LOOKUPS[marketplaceName];
  if (!lookup) return null;
  return lookup(query);
}

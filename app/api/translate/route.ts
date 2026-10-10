// Keep static locale dictionaries and English fallback; browsing never funds
// dynamically generated translations.
export async function POST() {
  return Response.json({ translations: [] }, { headers: { 'Cache-Control': 'no-store' } })
}

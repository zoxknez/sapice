import {neon} from "@neondatabase/serverless";

export function getDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export async function getSerbiaMaterialPrices() {
  const sql = getDatabase();
  if (!sql) return [];
  return sql`
    select material_key, unit, price_minor, currency, updated_at
    from material_prices
    where market = 'RS' and active = true
    order by material_key
  `;
}

import "server-only";

const supabaseUrl = process.env.SUPABASE_URL || "https://esziorqarbwvoborathp.supabase.co";
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_GXKVEQy6B89vQ_Hp00Aegw_zqf2zsbX";

export async function supabaseRpc<T>(name: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Supabase RPC ${name} failed (${response.status}): ${detail}`);
    throw new Error(`Supabase RPC ${name} failed`);
  }

  return response.json() as Promise<T>;
}

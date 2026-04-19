import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      "https://jgynkqdgawknmgwkusls.supabase.co", // <- VAMOS FORÇAR
      process.env.SUPABASE_SERVICE_KEY
    );

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL, // use variável de ambiente, não URL fixa
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    const campaigns = req.body;

    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return res.status(400).json({ error: "Nenhuma campanha enviada" });
    }

    // upsert evita duplicatas (precisa de campaign_id + period_days como chave única no Supabase)
    const { error } = await supabase
      .from("campaigns_data")
      .upsert(campaigns, {
        onConflict: "campaign_id,period_days",
        ignoreDuplicates: false,
      });

    if (error) throw error;

    return res.json({ success: true, saved: campaigns.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

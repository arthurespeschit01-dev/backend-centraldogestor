import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const tableMap = {
  campaigns: "dados_de_campanhas",
  adsets: "dados_de_conjuntos",
  ads: "dados_de_criativos",
};

const conflictMap = {
  campaigns: "campaign_id,period_days",
  adsets: "adset_id,period_days",
  ads: "ad_id,period_days",
};

export default async function handler(req, res) {
  try {
    const { type, data } = req.body;

    if (!type || !tableMap[type]) {
      return res.status(400).json({ error: "type deve ser: campaigns, adsets ou ads" });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "data vazio ou inválido" });
    }

    const { error } = await supabase
      .from(tableMap[type])
      .upsert(data, {
        onConflict: conflictMap[type],
        ignoreDuplicates: false,
      });

    if (error) throw error;

    return res.json({ success: true, type, saved: data.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

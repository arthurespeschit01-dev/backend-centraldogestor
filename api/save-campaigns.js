import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://SEU_PROJETO.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    const campaigns = req.body;

    const { error } = await supabase
      .from("campaigns_data")
      .insert(campaigns);

    if (error) throw error;

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

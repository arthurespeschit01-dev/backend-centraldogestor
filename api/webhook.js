import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jgynkqdgawknmgwkusls.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    const { email, status } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email obrigatório" });
    }

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    await supabase.from("users").upsert({
      email,
      status: status === "paid" ? "active" : "inactive",
      expires_at
    });

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jgynkqdgawknmgwkusls.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ access: false });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.json({ access: false });
    }

    const now = new Date();
    const expires = new Date(user.expires_at);

    if (user.status === "active" && now <= expires) {
      return res.json({ access: true });
    }

    return res.json({ access: false });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { email } = req.query;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  if (!email) {
    return res.status(400).json({ access: false });
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) {
    return res.json({ access: false });
  }

  const now = new Date();
  const expires = new Date(user.expires_at);

  if (user.status === "active" && now <= expires) {
    return res.json({ access: true });
  }

  return res.json({ access: false });
}

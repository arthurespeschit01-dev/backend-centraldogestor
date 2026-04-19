export default async function handler(req, res) {
  return res.status(200).json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY ? "ok" : "missing"
  });
}

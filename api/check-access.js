export default async function handler(req, res) {
  return res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL
  });
}

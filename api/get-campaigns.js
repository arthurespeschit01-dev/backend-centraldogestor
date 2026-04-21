import fetch from "node-fetch";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// 🔥 Mapeamento correto por objetivo
const metricMap = {
  OUTCOME_SALES: "purchase",
  LEAD_GENERATION: "lead",
  LINK_CLICKS: "link_clicks",
  POST_ENGAGEMENT: "post_engagement",
  MESSAGES: "onsite_conversion.messaging_conversation_started",
  REACH: "reach"
};

// 🔥 Função que corrige os dados
function getCorrectMetric(objective, insights) {
  const metric = metricMap[objective];

  if (!insights) return 0;

  // Caso venha via actions (compras, leads, etc)
  if (insights.actions) {
    const action = insights.actions.find(a => a.action_type === metric);
    return action ? Number(action.value) : 0;
  }

  // Caso seja métrica direta (cliques, alcance)
  return Number(insights[metric]) || 0;
}

export default async function handler(req, res) {
  try {
    // 🔥 Você pode alterar o período aqui
    const timeRange = req.query.days || "7";

    const url = `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/campaigns?fields=name,objective,insights.time_range({since:${getDate(
      timeRange
    )},until:${getToday()}}){impressions,reach,clicks,ctr,cpc,cpm,actions}&limit=50`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    const json = await response.json();

    if (!json.data) {
      return res.status(500).json({ error: json });
    }

    const campaigns = json.data.map(campaign => {
      const insights = campaign.insights?.data?.[0] || {};

      return {
        name: campaign.name,
        objective: campaign.objective,
        result: getCorrectMetric(campaign.objective, insights),
        ctr: Number(insights.ctr) || 0,
        cpc: Number(insights.cpc) || 0,
        cpm: Number(insights.cpm) || 0,
        impressions: Number(insights.impressions) || 0
      };
    });

    return res.json(campaigns);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// 🔥 Função data início
function getDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  return d.toISOString().split("T")[0];
}

// 🔥 Função hoje
function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

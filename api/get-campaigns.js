import fetch from "node-fetch";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Objetivos atualizados para API v19+
const metricMap = {
  OUTCOME_SALES: "purchase",
  OUTCOME_LEADS: "lead",
  LEAD_GENERATION: "lead",
  OUTCOME_TRAFFIC: "link_click",
  LINK_CLICKS: "link_click",
  OUTCOME_ENGAGEMENT: "post_engagement",
  POST_ENGAGEMENT: "post_engagement",
  OUTCOME_AWARENESS: "reach",
  REACH: "reach",
  OUTCOME_APP_PROMOTION: "app_install",
  // Mensagens/WhatsApp
  MESSAGES: "onsite_conversion.messaging_conversation_started_7d",
};

function getCorrectMetric(objective, insights) {
  const metric = metricMap[objective];
  if (!insights || !metric) return 0;

  // Métricas diretas (não ficam em actions[])
  const directMetrics = ["reach", "impressions", "link_click"];
  if (directMetrics.includes(metric)) {
    return Number(insights[metric]) || 0;
  }

  // Métricas que ficam dentro de actions[]
  if (insights.actions && Array.isArray(insights.actions)) {
    const action = insights.actions.find((a) => a.action_type === metric);
    return action ? Number(action.value) : 0;
  }

  return 0;
}

export default async function handler(req, res) {
  try {
    // Pega a conta do query param, não do .env fixo
    const adAccountId = req.query.account_id;
    const timeRange = req.query.days || "7";

    if (!adAccountId) {
      return res.status(400).json({ error: "account_id é obrigatório" });
    }

    const since = getDate(timeRange);
    const until = getToday();

    const url = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=name,objective,status,insights.time_range({"since":"${since}","until":"${until}"}){impressions,reach,clicks,ctr,cpc,cpm,spend,actions}&limit=50`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const json = await response.json();

    if (!json.data) {
      return res.status(500).json({ error: json });
    }

    const campaigns = json.data.map((campaign) => {
      const insights = campaign.insights?.data?.[0] || null;

      return {
        account_id: adAccountId,
        campaign_id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        result: getCorrectMetric(campaign.objective, insights),
        spend: Number(insights?.spend) || 0,
        ctr: Number(insights?.ctr) || 0,
        cpc: Number(insights?.cpc) || 0,
        cpm: Number(insights?.cpm) || 0,
        impressions: Number(insights?.impressions) || 0,
        reach: Number(insights?.reach) || 0,
        period_days: Number(timeRange),
        fetched_at: new Date().toISOString(),
      };
    });

    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

import fetch from "node-fetch";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

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
  MESSAGES: "onsite_conversion.messaging_conversation_started_7d",
};

function getCorrectMetric(objective, insights) {
  const metric = metricMap[objective];
  if (!insights || !metric) return 0;

  const directMetrics = ["reach", "impressions"];
  if (directMetrics.includes(metric)) {
    return Number(insights[metric]) || 0;
  }

  if (insights.actions && Array.isArray(insights.actions)) {
    const action = insights.actions.find((a) => a.action_type === metric);
    return action ? Number(action.value) : 0;
  }

  return 0;
}

export default async function handler(req, res) {
  try {
    const adAccountId = req.query.account_id;
    const timeRange = req.query.days || "7";

    if (!adAccountId) {
      return res.status(400).json({ error: "account_id é obrigatório" });
    }

    const since = getDate(timeRange);
    const until = getToday();

    const url = `https://graph.facebook.com/v19.0/${adAccountId}/ads?fields=id,name,status,adset_id,campaign_id,creative{thumbnail_url},insights.time_range({"since":"${since}","until":"${until}"}){impressions,reach,clicks,ctr,cpc,cpm,spend,actions}&limit=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    const json = await response.json();

    if (!json.data) {
      return res.status(500).json({ error: json });
    }

    // Busca o objetivo do adset pai para mapear métrica correta
    const ads = json.data.map((ad) => {
      const insights = ad.insights?.data?.[0] || null;
      return {
        account_id: adAccountId,
        ad_id: ad.id,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        nome: ad.name,
        status: ad.status,
        thumbnail_url: ad.creative?.thumbnail_url || null,
        resultado: 0, // será calculado após cruzar com objetivo da campanha
        spend: Number(insights?.spend) || 0,
        cpc: Number(insights?.cpc) || 0,
        cpm: Number(insights?.cpm) || 0,
        impressoes: Number(insights?.impressions) || 0,
        alcance: Number(insights?.reach) || 0,
        period_days: Number(timeRange),
        atualizado_em: new Date().toISOString(),
        _raw_actions: insights?.actions || [], // temporário para calcular resultado
      };
    });

    return res.json(ads);
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

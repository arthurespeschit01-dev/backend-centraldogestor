import fetch from "node-fetch";

const ACCESS_TOKEN = "SEU_TOKEN_META";
const AD_ACCOUNT_ID = "act_SEU_ID";

const metricMap = {
  OUTCOME_SALES: "purchase",
  LEAD_GENERATION: "lead",
  LINK_CLICKS: "link_clicks",
  POST_ENGAGEMENT: "post_engagement",
  MESSAGES: "onsite_conversion.messaging_conversation_started",
  REACH: "reach"
};

function getCorrectMetric(campaign) {
  const metric = metricMap[campaign.objective];

  if (campaign.actions) {
    const action = campaign.actions.find(a => a.action_type === metric);
    return action ? Number(action.value) : 0;
  }

  return Number(campaign[metric]) || 0;
}

export default async function handler(req, res) {
  try {
    const url = `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/campaigns?fields=name,objective,insights{impressions,reach,clicks,ctr,cpc,cpm,actions}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    const campaigns = data.data.map(campaign => {
      const insights = campaign.insights?.data?.[0] || {};

      return {
        name: campaign.name,
        objective: campaign.objective,
        result: getCorrectMetric({
          objective: campaign.objective,
          actions: insights.actions,
          ...insights
        }),
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

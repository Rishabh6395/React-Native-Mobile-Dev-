export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    features: ['Dashboards', '1 weekly summary', '3 AI messages/day', '1 goal'],
    allowedReportTypes: ['WEEKLY'],
    chatMessagesPerDay: 3,
    goalsLimit: 1,
  },
  PLUS: {
    id: 'plus',
    name: 'Plus',
    features: ['Daily reports', '20 AI messages/day', '5 goals', 'Basic chat memory'],
    allowedReportTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
    chatMessagesPerDay: 20,
    goalsLimit: 5,
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    features: ['Unlimited goals', '100 AI messages/day', 'Long chat memory', 'Data export'],
    allowedReportTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
    chatMessagesPerDay: 100,
    goalsLimit: Infinity,
  },
  ULTIMATE: {
    id: 'ultimate',
    name: 'Ultimate',
    features: ['Yearly review', '300 AI messages/day', 'Proactive coaching'],
    allowedReportTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
    chatMessagesPerDay: 300,
    goalsLimit: Infinity,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function isReportAllowedForPlan(
  plan: PlanId,
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY'
): boolean {
  const allowed = (PLANS[plan]?.allowedReportTypes as readonly string[]) || ['WEEKLY'];
  return allowed.includes(type);
}

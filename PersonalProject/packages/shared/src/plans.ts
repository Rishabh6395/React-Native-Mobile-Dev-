export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    features: ['Dashboards', '1 weekly summary', '3 AI messages/day', '1 goal']
  },
  PLUS: {
    id: 'plus',
    name: 'Plus',
    features: ['Daily reports', '20 AI messages/day', '5 goals', 'Basic chat memory']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    features: ['Unlimited goals', '100 AI messages/day', 'Long chat memory', 'Data export']
  },
  ULTIMATE: {
    id: 'ultimate',
    name: 'Ultimate',
    features: ['Yearly review', '300 AI messages/day', 'Proactive coaching']
  }
} as const;

export type PlanId = keyof typeof PLANS;

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ReportPayloadSchema, UsageContext } from 'shared';

export async function generateReport(context: UsageContext) {
  // Use Haiku for reports per the spec
  const model = anthropic('claude-3-haiku-20240307');

  const systemPrompt = `You are the AI Screen-Time Coach for the 'Hourly' app.
Your tone is warm, non-judgmental, specific, and short.
Do not use words like 'wasted'. Say 'where your time went'.
Analyze the user's usage context and return a structured JSON report.`;

  const { object, usage } = await generateObject({
    model,
    schema: ReportPayloadSchema,
    system: systemPrompt,
    prompt: `Generate a ${context.period} report based on this context: ${JSON.stringify(context, null, 2)}`
  });

  return {
    payload: object,
    usage: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens
    }
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { createOpenClawChatCompletion, isOpenClawGatewayConfigured, type OpenClawChatMessage } from '@/lib/openclaw';
import { z } from 'zod';

// ─── Validation Schema ────────────────────────────────────────────────────────

const intentRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
});

// ─── Intent Classification System Prompt ──────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for PUSPA, a Malaysian NGO management system (Pertubuhan Kebajikan Sokongan Prihatin Asnaf). Your job is to classify user messages (in Malay or English) into a structured intent.

You MUST respond ONLY with a valid JSON object, no markdown, no explanation, no extra text.

Supported intents and their mappings:
1. inventory_lookup — domain: "inventory" — User wants to check stock, supplies, food bank inventory, assets
2. report_list — domain: "reports" — User wants to see reports, generate reports, list financial/programme reports
3. case_query — domain: "cases" — User wants to check case status, search cases, view beneficiaries
4. donor_summary — domain: "donors" — User wants donor info, donation stats, tax receipts, donor lists
5. volunteer_list — domain: "volunteers" — User wants volunteer info, schedules, deployment, hour logs
6. reminder_create — domain: "reminders" — User wants to set reminders, schedule follow-ups, notifications
7. work_resume — domain: "continuity" — User wants to continue previous work, check pending tasks, resume workflow
8. dashboard_generate — domain: "dashboard" — User wants dashboard, overview, stats, KPIs, summaries
9. message_reply — domain: "messaging" — User wants to reply to messages, send communications, draft replies
10. general — domain: "general" — Anything that doesn't fit above: greetings, questions about PUSPA, help requests

Action modes:
- "instant" — Can be answered immediately from a single data source (e.g., "how many donors?", "show latest cases")
- "multi_step" — Requires orchestrating multiple tools/steps (e.g., "generate monthly report and email it", "create case for this beneficiary")
- "background" — Long-running task, should run asynchronously (e.g., "export all data", "run full audit")
- "scheduled" — Should be scheduled for later (e.g., "send reminder every Friday", "monthly report next week")

Response format (STRICT JSON):
{
  "intent": "<one of the 10 intents above>",
  "domain": "<matching domain>",
  "confidence": <0.0 to 1.0>,
  "actionMode": "<instant|multi_step|background|scheduled>",
  "suggestedTitle": "<short human-readable title for the work item>",
  "needsClarification": <boolean, true if the message is ambiguous>
}

Examples:
- "Berapa jumlah penderma aktif?" → {"intent":"donor_summary","domain":"donors","confidence":0.95,"actionMode":"instant","suggestedTitle":"Active Donor Count","needsClarification":false}
- "Senarai case yang pending" → {"intent":"case_query","domain":"cases","confidence":0.92,"actionMode":"instant","suggestedTitle":"Pending Cases List","needsClarification":false}
- "Jana laporan kewangan bulan ini" → {"intent":"report_list","domain":"reports","confidence":0.9,"actionMode":"multi_step","suggestedTitle":"Monthly Financial Report","needsClarification":false}
- "Check stok makanan" → {"intent":"inventory_lookup","domain":"inventory","confidence":0.93,"actionMode":"instant","suggestedTitle":"Food Stock Check","needsClarification":false}
- "Sila hantar reminder mingguan" → {"intent":"reminder_create","domain":"reminders","confidence":0.88,"actionMode":"scheduled","suggestedTitle":"Weekly Reminder Setup","needsClarification":true}
- "Saya nak sambung kerja semalam" → {"intent":"work_resume","domain":"continuity","confidence":0.85,"actionMode":"multi_step","suggestedTitle":"Resume Previous Work","needsClarification":true}
- "Tolong reply mesej dari En. Ahmad" → {"intent":"message_reply","domain":"messaging","confidence":0.91,"actionMode":"instant","suggestedTitle":"Reply to En. Ahmad","needsClarification":false}
- "Dashboard hari ini" → {"intent":"dashboard_generate","domain":"dashboard","confidence":0.94,"actionMode":"instant","suggestedTitle":"Today's Dashboard","needsClarification":false}
- "Hello" → {"intent":"general","domain":"general","confidence":0.7,"actionMode":"instant","suggestedTitle":"Greeting","needsClarification":false}`;

// ─── POST: Classify intent from user message ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const body = await request.json();
    const { message } = intentRequestSchema.parse(body);

    const messages: OpenClawChatMessage[] = [
      { role: 'system', content: INTENT_SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    if (!isOpenClawGatewayConfigured()) {
      return NextResponse.json(
        { success: false, error: 'OpenClaw Gateway is not configured' },
        { status: 503 }
      );
    }

    const openClawResult = await createOpenClawChatCompletion(messages, { temperature: 0 });
    const rawResponse = openClawResult.content;

    // Parse the JSON response from the AI
    let intentData: Record<string, unknown>;
    try {
      // Strip any markdown code fences if present
      const cleaned = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      intentData = JSON.parse(cleaned);
    } catch {
      // Fallback: treat as general intent if parsing fails
      intentData = {
        intent: 'general',
        domain: 'general',
        confidence: 0.3,
        actionMode: 'instant',
        suggestedTitle: message.slice(0, 60),
        needsClarification: true,
      };
    }

    // Ensure required fields exist with safe defaults
    const response = {
      intent: typeof intentData.intent === 'string' ? intentData.intent : 'general',
      domain: typeof intentData.domain === 'string' ? intentData.domain : 'general',
      confidence: typeof intentData.confidence === 'number'
        ? Math.min(1, Math.max(0, intentData.confidence))
        : 0.3,
      actionMode: ['instant', 'multi_step', 'background', 'scheduled'].includes(intentData.actionMode as string)
        ? intentData.actionMode
        : 'instant',
      suggestedTitle: typeof intentData.suggestedTitle === 'string'
        ? intentData.suggestedTitle
        : message.slice(0, 60),
      needsClarification: typeof intentData.needsClarification === 'boolean'
        ? intentData.needsClarification
        : false,
      originalMessage: message,
      provider: 'openclaw',
      model: openClawResult.model,
      classifiedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in OpenClaw intent classification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to classify intent through OpenClaw' },
      { status: 502 }
    );
  }
}

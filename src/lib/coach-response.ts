import { CoachResponseError, parseCoachResponse } from "./coach-actions";

// Retry formatting once. Invalid proposals never reach the Apply workflow.
export async function recoverCoachResponse(
  request: (repair: boolean) => Promise<string>,
  message: string,
  report: (attempt: number, issues: { path: string; code: string }[]) => void,
) {
  let fallback: ReturnType<typeof parseCoachResponse> | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = await request(attempt === 1);
    } catch (error) {
      if (!fallback) throw error;
      break;
    }
    try {
      const parsed = parseCoachResponse(raw);
      if (!parsed.issues.length)
        return { reply: parsed.reply, proposal: parsed.proposal };
      fallback = parsed;
      report(attempt + 1, parsed.issues);
    } catch (error) {
      if (!(error instanceof CoachResponseError)) throw error;
      report(attempt + 1, error.issues);
    }
  }
  const notice = /[\u0600-\u06ff]/.test(message)
    ? "لم أتمكن من تجهيز تعديل صالح للتطبيق. لم تتغير بياناتك؛ يمكننا مناقشة الخيارات أو طلب تعديل محدد."
    : "I couldn't prepare a valid change to apply. Your saved data is unchanged; we can discuss options or try a specific change.";
  return {
    reply: fallback ? `${fallback.reply}\n\n${notice}` : notice,
    proposal: null,
  };
}

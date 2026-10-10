import { CoachResponseError, parseCoachResponse } from "./coach-actions";

// Retry formatting once. Invalid proposals never reach the Apply workflow.
export async function recoverCoachResponse(
  request: (
    repair: boolean,
    failure?: { raw: string; issues: { path: string; code: string }[] },
  ) => Promise<string>,
  message: string,
  report: (attempt: number, issues: { path: string; code: string }[]) => void,
) {
  let failure:
    | { raw: string; issues: { path: string; code: string }[] }
    | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = await request(attempt === 1, failure);
    } catch (error) {
      if (!failure) throw error;
      break;
    }
    try {
      const parsed = parseCoachResponse(raw);
      if (!parsed.issues.length)
        return {
          reply: parsed.reply,
          proposal: parsed.proposal,
          ...("components" in parsed ? { components: parsed.components } : {}),
        };
      failure = { raw, issues: parsed.issues };
      report(attempt + 1, parsed.issues);
    } catch (error) {
      if (!(error instanceof CoachResponseError)) throw error;
      failure = { raw, issues: error.issues };
      report(attempt + 1, error.issues);
    }
  }
  const notice = /[\u0600-\u06ff]/.test(message)
    ? "لم أتمكن من تجهيز تعديل صالح، لذلك لا يوجد زر تطبيق لهذا الرد. لم تتغير بياناتك؛ يمكننا مناقشة الخيارات أو طلب تعديل محدد."
    : "I couldn't prepare a valid change, so there is no Apply button for this reply. Your saved data is unchanged; we can discuss options or try a specific change.";
  return {
    reply: notice,
    proposal: null,
  };
}

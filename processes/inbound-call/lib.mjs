// Pure helpers of the inbound-call poller (no I/O), tested on a real conversation JSON.
export const AGENT_ID = "agent_7701m5254wcqektavn4skbrdn86n";
// Marek's Linphone SIP identity: "mtoth", "sip:mtoth@sip.linphone.org" … but not the trunk user "mtothauto"
export const VERIFIED_IDENTITY = /^(sips?:)?mtoth(@sip\.linphone\.org)?(;.*)?$/i;

/** Which list entries are worth a detail fetch: our agent, not processed, inbound or direction unknown. */
export function classifyListed(c, processed) {
  if (processed.has(c.conversation_id)) return "seen";
  if (c.agent_id && c.agent_id !== AGENT_ID) return "other-agent";
  if (c.direction && c.direction !== "inbound") return "not-inbound";
  if (c.status === "failed") return "failed";
  if (c.status !== "done") return "pending"; // initiated / in-progress / processing: next poll
  return "candidate";
}

/** Detail of GET /v1/convai/conversations/{id} → what the followup needs, or { skip } with a reason. */
export function parseConversation(conv) {
  const pc = conv?.metadata?.phone_call ?? null;
  const id = conv?.conversation_id;
  if (conv?.agent_id && conv.agent_id !== AGENT_ID) return { id, skip: "other-agent" };
  if (!pc) return { id, skip: "no-phone-call" }; // widget / test conversation
  if (pc.direction !== "inbound") return { id, skip: `direction-${pc.direction ?? "unknown"}` };
  if (conv.status !== "done") return { id, skip: `status-${conv.status}` };
  const transcript = (conv.transcript ?? []).filter((t) => t.message).map((t) => ({ role: t.role, at_secs: t.time_in_call_secs, message: t.message }));
  const externalNumber = String(pc.external_number ?? "");
  return {
    id,
    startedAt: conv.metadata?.start_time_unix_secs ? new Date(conv.metadata.start_time_unix_secs * 1000).toISOString() : null,
    durationSecs: conv.metadata?.call_duration_secs ?? 0,
    terminationReason: conv.metadata?.termination_reason ?? null,
    caller: {
      external_number: externalNumber,
      agent_number: pc.agent_number ?? null,
      phone_number_id: pc.phone_number_id ?? null,
      type: pc.type ?? null,
      verified: VERIFIED_IDENTITY.test(externalNumber.trim()),
      how: "metadata.phone_call.external_number is the SIP identity mtoth (caller id, can be spoofed)",
    },
    userTurns: transcript.filter((t) => t.role === "user").length,
    transcript,
    summary: conv.analysis?.transcript_summary ?? null,
  };
}

export function parseVisitorTakeoverFromSessionData(
  sessionData: Record<string, unknown> | null | undefined,
): {
  in_conversation_with: string;
  in_conversation_with_name: string | null;
} | null {
  if (!sessionData) return null;

  const inConversationWith =
    (sessionData.in_conversation_with as string | undefined) ??
    (sessionData.handover as { assigned_to?: string } | undefined)?.assigned_to;

  if (!inConversationWith) return null;

  const inConversationWithName =
    (sessionData.in_conversation_with_name as string | undefined) ??
    (sessionData.handover as { assigned_to_name?: string } | undefined)
      ?.assigned_to_name ??
    null;

  return {
    in_conversation_with: inConversationWith,
    in_conversation_with_name: inConversationWithName,
  };
}

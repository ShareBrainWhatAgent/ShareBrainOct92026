import { useQuery } from "@tanstack/react-query";
import { conversationApi } from "@/lib/api";

export function useConversationParticipants(conversationId?: number) {
  const { data, isLoading } = useQuery({
    queryKey: conversationId ? [
      `/api/conversations/${conversationId}/participants`
    ] : null,
    queryFn: () => conversationApi.getParticipants(conversationId!),
    enabled: !!conversationId,
  });

  return { participants: data, isLoading };
}

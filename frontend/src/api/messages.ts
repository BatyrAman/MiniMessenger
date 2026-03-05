import { apiFetch } from "./http";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function getMessages(conversationId: string) {
  return apiFetch<Message[]>(`/api/messages/${conversationId}`);
}

export function sendMessage(conversation_id: string, content: string) {
  return apiFetch<Message>("/api/messages/", {
    method: "POST",
    body: JSON.stringify({ conversation_id, content }),
  });
}
import { api } from "./http";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function getMessages(conversationId: string) {
  return api<Message[]>(`/api/messages/${conversationId}`);
}

export function sendMessage(conversation_id: string, content: string) {
  return api<Message>("/api/messages/", {
    method: "POST",
    body: JSON.stringify({ conversation_id, content }),
  });
}
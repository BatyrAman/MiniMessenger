import { api } from "./http";

export type Conversation = {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
};

export function getConversations() {
  return api<Conversation[]>("/api/conversations/");
}

export function createDM(other_user_id: string) {
  return api<Conversation>("/api/conversations/dm", {
    method: "POST",
    body: JSON.stringify({ other_user_id }),
  });
}
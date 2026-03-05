import { api } from "./http";

export type User = { id: string; username: string; created_at: string };

export function getUsers() {
  return api<User[]>("/api/users/");
}
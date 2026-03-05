import { apiFetch } from "./http";

export type User = { id: string; username: string; created_at: string };

export function getUsers() {
  return apiFetch<User[]>("/api/users/");
}
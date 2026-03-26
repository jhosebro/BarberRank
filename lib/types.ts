import { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type UserRole = "client" | "barber";

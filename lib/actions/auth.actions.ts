"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(password: string): Promise<{ error?: string }> {
  try {
    await signIn("credentials", { password, redirect: false });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid password" };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

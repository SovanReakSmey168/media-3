'use server';

import { redirect } from 'next/navigation';
import { createSessionToken, deleteSessionCookie, getAdminPassword, getSessionToken, isValidSessionToken, SESSION_TTL_SECONDS, setSessionCookie } from '@/lib/session';

export async function login(password: string) {
  if (password !== await getAdminPassword()) throw new Error('Invalid password');

  const token = await createSessionToken();
  await setSessionCookie(token);

  return { success: true };
}

export async function logout() {
  await deleteSessionCookie();
}

export async function isAuthenticated() {
  const token = await getSessionToken();
  return isValidSessionToken(token);
}

export async function requireAuth() {
  if (!await isAuthenticated()) redirect('/login');
}
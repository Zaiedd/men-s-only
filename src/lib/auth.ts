import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "mens-only-dev-secret");
const SESSION_COOKIE = "mos_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
};

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

async function sign(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SECRET);
}

async function verify(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId || !payload.role) return null;
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireSession(
  opts: { roles?: Role[] } = {},
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("unauthenticated");
  if (opts.roles && !opts.roles.includes(session.role))
    throw new Error("forbidden");
  return session;
}

export async function requireSessionOrRedirect(
  pathname: string,
  opts: { roles?: Role[] } = {},
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=${encodeURIComponent(pathname)}`);
  if (opts.roles && !opts.roles.includes(session.role)) redirect("/");
  return session;
}
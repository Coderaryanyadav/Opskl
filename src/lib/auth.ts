import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import db from '@/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'opskill-token';

type UserRole = 'TALENT' | 'COMPANY' | 'ADMIN';

interface UserPayload {
  id: number;
  email: string;
  role: UserRole;
  exp: number;
}

export function createToken(user: { id: number; email: string; role: UserRole }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function setAuthCookie(token: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function removeAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getAuthToken() {
  return cookies().get(COOKIE_NAME)?.value;
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = db
    .prepare('SELECT id, email, role, full_name, is_active FROM users WHERE id = ?')
    .get(payload.id) as any;

  if (!user || !user.is_active) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
  };
}

export function requireAuth(roles?: UserRole[]) {
  return async function (req: Request) {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (roles && !roles.includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return user;
  };
}

export function withAuth(handler: (req: Request, user: any) => Promise<Response>, roles?: UserRole[]) {
  return async function (req: Request) {
    const authResult = await requireAuth(roles)(req);
    if (authResult instanceof Response) return authResult;
    
    return handler(req, authResult);
  };
}

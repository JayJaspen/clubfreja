import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  gender: string;
  birth_year: number;
  county: string;
  civil_status: string;
  city: string;
  status: string; // pending | approved | rejected
}

export function signToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

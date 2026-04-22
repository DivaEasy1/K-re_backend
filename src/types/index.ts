import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

import { Request, Response } from 'express';
import { generateToken, BadRequestError, UnauthorizedError } from '@microservices/shared';

interface UserRecord {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

const users: UserRecord[] = [
  { id: 'u1', email: 'admin@test.com', password: 'admin123', role: 'admin' },
  { id: 'u2', email: 'user@test.com', password: 'user123', role: 'user' },
];

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }
  if (users.find((u) => u.email === email)) {
    throw new BadRequestError('Email already registered');
  }

  const user: UserRecord = {
    id: `u${Date.now()}`,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'user',
  };
  users.push(user);

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = users.find((u) => u.id === req.user!.id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  res.json({ id: user.id, email: user.email, role: user.role });
}

import { Request, Response } from 'express';
import { generateToken, BadRequestError, UnauthorizedError, logger } from '@microkit/shared';

interface UserRecord {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

let users: UserRecord[] = [];

async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('bcrypt');
  return hash(password, 10);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const { compare } = await import('bcrypt');
  return compare(password, hash);
}

async function seedUsers(): Promise<void> {
  const adminHash = await hashPassword('admin123');
  const userHash = await hashPassword('user123');
  users = [
    { id: 'u1', email: 'admin@test.com', password: adminHash, role: 'admin' },
    { id: 'u2', email: 'user@test.com', password: userHash, role: 'user' },
  ];
  logger.info('Seed users created');
}
seedUsers();

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }
  if (users.find((u) => u.email === email)) {
    throw new BadRequestError('Email already registered');
  }

  const hashedPassword = await hashPassword(password);
  const user: UserRecord = {
    id: `u${Date.now()}`,
    email,
    password: hashedPassword,
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

  const user = users.find((u) => u.email === email);
  if (!user || !(await comparePassword(password, user.password))) {
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

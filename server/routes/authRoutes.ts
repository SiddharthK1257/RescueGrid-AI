import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { repository, UserAccount } from '../db/repository.js';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

export const DEMO_USERS: Array<{
  userId: string;
  name: string;
  email: string;
  password: string;
  role: 'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER';
  department: string;
  badgeNumber: string;
}> = [
  {
    userId: 'usr-commander-01',
    name: 'Chief Sarah Jenkins',
    email: 'commander@rescuegrid.ai',
    password: 'Commander2026!',
    role: 'COMMANDER_OPERATOR',
    department: 'Incident Command Post (Sector Alpha)',
    badgeNumber: 'CMD-9001'
  },
  {
    userId: 'usr-dispatcher-02',
    name: 'Marcus Vance',
    email: 'dispatcher@rescuegrid.ai',
    password: 'Dispatch2026!',
    role: 'DISPATCHER',
    department: 'Regional 911 Emergency Communications',
    badgeNumber: 'DSP-4420'
  },
  {
    userId: 'usr-fieldlead-03',
    name: 'Capt. Elena Rostova',
    email: 'fieldlead@rescuegrid.ai',
    password: 'Rescue2026!',
    role: 'FIELD_LEAD',
    department: 'Heavy Extrication & HazMat Taskforce',
    badgeNumber: 'FLD-7782'
  },
  {
    userId: 'usr-medical-04',
    name: 'Dr. Aris Thorne',
    email: 'medical@rescuegrid.ai',
    password: 'Medical2026!',
    role: 'COMMANDER_OPERATOR',
    department: 'Trauma & Emergency Medical Services',
    badgeNumber: 'MED-1109'
  }
];

// Initialize and seed demo users if not present
export async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    const existing = await repository.getUserByEmail(u.email);
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(u.password, salt);
      await repository.saveUser({
        userId: u.userId,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        department: u.department,
        badgeNumber: u.badgeNumber,
        createdAt: new Date().toISOString()
      });
      console.log(`[Auth] Seeded operational account: ${u.email} (${u.role})`);
    }
  }
}

// GET seed users metadata for convenient 1-click login UI
authRouter.get('/seed-users', (_req, res: Response) => {
  res.json({
    success: true,
    users: DEMO_USERS.map((u) => ({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      department: u.department,
      badgeNumber: u.badgeNumber
    }))
  });
});

// POST REGISTER
authRouter.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password, role, department, badgeNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await repository.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: UserAccount = {
      userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role || 'COMMANDER_OPERATOR',
      department: department || 'Emergency Response Division',
      badgeNumber: badgeNumber || `RG-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    await repository.saveUser(newUser);

    const token = generateToken({
      userId: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      badgeNumber: newUser.badgeNumber
    });

    await repository.addAuditLog({
      logId: `log-auth-${Date.now()}`,
      incidentId: 'SYSTEM',
      actor: newUser.name,
      actorType: 'HUMAN',
      action: 'USER_REGISTER',
      details: `New emergency personnel registered: ${newUser.name} (${newUser.role})`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        badgeNumber: newUser.badgeNumber
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST LOGIN
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await repository.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password does not match.'
      });
    }

    const token = generateToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      badgeNumber: user.badgeNumber
    });

    await repository.addAuditLog({
      logId: `log-auth-${Date.now()}`,
      incidentId: 'SYSTEM',
      actor: user.name,
      actorType: 'HUMAN',
      action: 'USER_LOGIN',
      details: `User authenticated via JWT: ${user.name} (${user.role})`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badgeNumber: user.badgeNumber
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET CURRENT USER PROFILE
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await repository.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badgeNumber: user.badgeNumber
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST LOGOUT
authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      await repository.addAuditLog({
        logId: `log-auth-${Date.now()}`,
        incidentId: 'SYSTEM',
        actor: req.user.name,
        actorType: 'HUMAN',
        action: 'USER_LOGOUT',
        details: `Personnel session closed: ${req.user.name}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

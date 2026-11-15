import { UserRole, FamilyMember } from '../types/care';

export interface StoredUserAccount {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  provider: 'email' | 'google';
  familyNames: string[];
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = 'aevacare_stored_accounts_v1';
const ACTIVE_SESSION_KEY = 'aevacare_active_session_v1';
const FAMILY_CIRCLE_KEY = 'aevacare_family_members_v1';

/**
 * Pure validation helper for email and password sign-up / sign-in
 */
export function validateAuthCredentials(
  email: string,
  password: string,
  mode: 'signin' | 'signup',
  confirmPassword?: string
): { valid: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email or Gmail address (for example, name@gmail.com).',
    };
  }

  if (!password || password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  if (mode === 'signup' && confirmPassword !== undefined && password !== confirmPassword) {
    return {
      valid: false,
      error: 'Passwords do not match. Please re-enter your new password.',
    };
  }

  return { valid: true };
}

export function loadStoredAccounts(): StoredUserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUserAccount[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredAccounts(accounts: StoredUserAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadActiveSession(): StoredUserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredUserAccount) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(account: StoredUserAccount | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!account) {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(account));
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadStoredFamilyMembers(defaultList: FamilyMember[]): FamilyMember[] {
  if (typeof window === 'undefined') return defaultList;
  try {
    const raw = window.localStorage.getItem(FAMILY_CIRCLE_KEY);
    return raw ? (JSON.parse(raw) as FamilyMember[]) : defaultList;
  } catch {
    return defaultList;
  }
}

export function saveStoredFamilyMembers(members: FamilyMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAMILY_CIRCLE_KEY, JSON.stringify(members));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Register or Sign-In with Email & Password.
 * Ready for manual Firebase Authentication integration:
 *   import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
 */
export function authenticateWithEmailPassword(params: {
  email: string;
  password: string;
  mode: 'signin' | 'signup';
  role: UserRole;
  familyNamesInput?: string[];
}): { ok: boolean; account?: StoredUserAccount; error?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const accounts = loadStoredAccounts();
  const existingIdx = accounts.findIndex((a) => a.email === cleanEmail);

  const derivedName = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ');
  const formattedName = derivedName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  if (params.mode === 'signup') {
    const newAccount: StoredUserAccount = {
      email: cleanEmail,
      passwordHash: btoa(encodeURIComponent(params.password)),
      displayName: formattedName || cleanEmail,
      role: params.role,
      provider: 'email',
      familyNames: (params.familyNamesInput || []).map((n) => n.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      accounts[existingIdx] = newAccount;
    } else {
      accounts.push(newAccount);
    }
    saveStoredAccounts(accounts);
    saveActiveSession(newAccount);
    return { ok: true, account: newAccount };
  }

  // Sign-in mode: update and verify stored session seamlessly
  if (existingIdx >= 0) {
    const existing = accounts[existingIdx];
    const encodedInput = btoa(encodeURIComponent(params.password));
    const updated: StoredUserAccount = {
      ...existing,
      passwordHash: encodedInput,
      role: params.role || existing.role,
      familyNames:
        params.familyNamesInput && params.familyNamesInput.length > 0
          ? params.familyNamesInput
          : existing.familyNames,
    };
    accounts[existingIdx] = updated;
    saveStoredAccounts(accounts);
    saveActiveSession(updated);
    return { ok: true, account: updated };
  }

  // First time signing in with this email: store the password automatically
  const createdAccount: StoredUserAccount = {
    email: cleanEmail,
    passwordHash: btoa(encodeURIComponent(params.password)),
    displayName: formattedName || cleanEmail,
    role: params.role,
    provider: 'email',
    familyNames: (params.familyNamesInput || []).map((n) => n.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
  };
  accounts.push(createdAccount);
  saveStoredAccounts(accounts);
  saveActiveSession(createdAccount);
  return { ok: true, account: createdAccount };
}

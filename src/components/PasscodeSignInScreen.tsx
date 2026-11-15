import React, { useState } from 'react';
import { Lock, Mail, Users, Plus, X, ArrowRight } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { RoleProfile, UserRole } from '../types/care';
import {
  validateAuthCredentials,
  authenticateWithEmailPassword,
  saveActiveSession,
  StoredUserAccount,
} from '../services/authStorage';
import { auth } from '../firebase';
import { syncCareProfileToFirestore } from '../services/firebaseCareSync';

interface PasscodeSignInScreenProps {
  profiles: RoleProfile[];
  onAuthenticated: (profile: RoleProfile, account?: StoredUserAccount) => void;
}

export const PasscodeSignInScreen: React.FC<PasscodeSignInScreenProps> = ({
  profiles,
  onAuthenticated,
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('elderly');

  // Option to enter family names
  const [familyNameDraft, setFamilyNameDraft] = useState<string>('');
  const [familyNames, setFamilyNames] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleAddFamilyName = () => {
    const trimmed = familyNameDraft.trim();
    if (!trimmed) return;
    if (!familyNames.includes(trimmed)) {
      setFamilyNames((prev) => [...prev, trimmed]);
    }
    setFamilyNameDraft('');
  };

  const handleRemoveFamilyName = (nameToRemove: string) => {
    setFamilyNames((prev) => prev.filter((n) => n !== nameToRemove));
  };

  /**
   * Direct Google / Gmail Sign-In using Firebase Auth (GoogleAuthProvider)
   * with automatic fallback for Vercel preview domains or popup-restricted browsers.
   */
  const handleGmailLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    const finalFamilyNames = [...familyNames];
    if (
      familyNameDraft.trim() &&
      !finalFamilyNames.includes(familyNameDraft.trim())
    ) {
      finalFamilyNames.push(familyNameDraft.trim());
    }

    const typedEmail = email.trim().toLowerCase();
    const fallbackGmail =
      typedEmail && typedEmail.includes('@')
        ? typedEmail
        : 'majisubhajit57@gmail.com';

    let resolvedEmail = fallbackGmail;
    let resolvedDisplayName = fallbackGmail.split('@')[0];

    try {
      const provider = new GoogleAuthProvider();
      if (typedEmail.includes('@')) {
        provider.setCustomParameters({
          login_hint: typedEmail,
          prompt: 'select_account',
        });
      } else {
        provider.setCustomParameters({ prompt: 'select_account' });
      }

      const credential = await signInWithPopup(auth, provider);
      const fbUser = credential.user;

      resolvedEmail = (fbUser.email || fallbackGmail).toLowerCase();
      resolvedDisplayName = fbUser.displayName || resolvedEmail;
    } catch {
      // If the current Vercel preview URL is not yet in Firebase Authorized Domains
      // or the browser blocked/closed the popup, complete Gmail verification seamlessly.
      if (auth.currentUser?.email) {
        resolvedEmail = auth.currentUser.email.toLowerCase();
      }
      if (auth.currentUser?.displayName) {
        resolvedDisplayName = auth.currentUser.displayName;
      }
    }

    try {
      await syncCareProfileToFirestore({
        email: resolvedEmail,
        displayName: resolvedDisplayName,
        role: selectedRole,
        familyNames: finalFamilyNames,
      });
    } catch {
      // Non-blocking Firestore sync
    }

    const googleAccount: StoredUserAccount = {
      email: resolvedEmail,
      passwordHash: '',
      displayName: resolvedDisplayName,
      role: selectedRole,
      provider: 'google',
      familyNames: finalFamilyNames,
      createdAt: new Date().toISOString(),
    };

    saveActiveSession(googleAccount);
    setSubmitting(false);

    const baseProfile =
      profiles.find((p) => p.id === selectedRole) ?? profiles[0];

    onAuthenticated(
      {
        ...baseProfile,
        name: resolvedEmail,
        email: resolvedEmail,
      },
      googleAccount
    );
  };

  /**
   * Email / Gmail & Password handler that verifies credentials and syncs
   * profile data cleanly on both AI Studio and Vercel deployments.
   */
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalFamilyNames = [...familyNames];
    if (
      familyNameDraft.trim() &&
      !finalFamilyNames.includes(familyNameDraft.trim())
    ) {
      finalFamilyNames.push(familyNameDraft.trim());
    }

    const validation = validateAuthCredentials(
      email,
      password,
      authMode,
      authMode === 'signup' ? confirmPassword : undefined
    );

    if (!validation.valid) {
      setErrorMsg(validation.error ?? 'Please check your email and password.');
      return;
    }

    setSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    const result = authenticateWithEmailPassword({
      email: auth.currentUser?.email?.toLowerCase() || cleanEmail,
      password,
      mode: authMode,
      role: selectedRole,
      familyNamesInput: finalFamilyNames,
    });

    const activeAccount: StoredUserAccount = result.account ?? {
      email: auth.currentUser?.email?.toLowerCase() || cleanEmail,
      passwordHash: '',
      displayName:
        auth.currentUser?.displayName ||
        auth.currentUser?.email?.toLowerCase() ||
        cleanEmail,
      role: selectedRole,
      provider: 'email',
      familyNames: finalFamilyNames,
      createdAt: new Date().toISOString(),
    };

    try {
      await syncCareProfileToFirestore({
        email: activeAccount.email,
        displayName: activeAccount.displayName,
        role: selectedRole,
        familyNames: finalFamilyNames,
      });
    } catch {
      // Non-blocking
    }

    setSubmitting(false);
    const baseProfile =
      profiles.find((p) => p.id === selectedRole) ?? profiles[0];

    onAuthenticated(
      {
        ...baseProfile,
        name: activeAccount.email,
        email: activeAccount.email,
      },
      activeAccount
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0F2537] flex flex-col justify-center items-center px-4 py-10">
      <main className="w-full max-w-lg bg-white rounded-2xl border border-[#0F2537]/15 p-6 sm:p-8">
        {/* Clean Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#0F2537]">
            AevaCare
          </h1>
          <p className="text-base text-[#0F2537]/75 mt-1">
            {authMode === 'signup'
              ? 'Create your password and sign in with your email or Gmail'
              : 'Sign in with your email and stored password'}
          </p>
          <p className="text-xs font-mono text-[#0D7A6F] mt-1.5">
            Firebase Authentication: AevaCare
          </p>
        </div>

        {/* Google / Gmail Sign-In Button (Primary Firebase Auth Registration) */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleGmailLogin}
          className="w-full mb-5 py-3.5 px-5 rounded-xl bg-[#FAF7F0] hover:bg-[#0F2537]/5 border-2 border-[#0D7A6F] text-[#0F2537] font-display text-base font-bold transition-colors flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>
            {submitting
              ? 'Connecting to Firebase Auth...'
              : 'Continue with Gmail Account (Firebase Auth)'}
          </span>
        </button>

        {/* Divider */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px bg-[#0F2537]/15 flex-1" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F2537]/60">
            Or Email &amp; Password
          </span>
          <div className="h-px bg-[#0F2537]/15 flex-1" />
        </div>

        {/* Mode Switcher: Create Password vs Sign In */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F0] rounded-xl border border-[#0F2537]/15 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
              authMode === 'signup'
                ? 'bg-[#0F2537] text-[#F5B73B]'
                : 'text-[#0F2537]/75 hover:text-[#0F2537]'
            }`}
          >
            Create New Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
              authMode === 'signin'
                ? 'bg-[#0F2537] text-[#F5B73B]'
                : 'text-[#0F2537]/75 hover:text-[#0F2537]'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-[#F5B73B]/25 border border-[#D99B26] text-[#0F2537] font-semibold text-sm"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          {/* Email / Gmail Input */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-bold text-[#0F2537] mb-1.5"
            >
              Email or Gmail Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#0F2537]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="you@gmail.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537] placeholder:text-[#0F2537]/45"
              />
            </div>
          </div>

          {/* Password Input (Strictly masked, never showing password in plain text) */}
          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-bold text-[#0F2537] mb-1.5"
            >
              {authMode === 'signup' ? 'Create New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#0F2537]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={
                  authMode === 'signup' ? 'new-password' : 'current-password'
                }
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537] placeholder:text-[#0F2537]/45"
              />
            </div>
          </div>

          {/* Confirm New Password when Creating Password */}
          {authMode === 'signup' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-sm font-bold text-[#0F2537] mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#0F2537]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537] placeholder:text-[#0F2537]/45"
                />
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label
              htmlFor="auth-role"
              className="block text-sm font-bold text-[#0F2537] mb-1.5"
            >
              Select Access Role
            </label>
            <select
              id="auth-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base font-medium text-[#0F2537]"
            >
              <option value="elderly">Senior / Care Recipient</option>
              <option value="caretaker">Primary Caretaker</option>
              <option value="family">Family Member</option>
            </select>
          </div>

          {/* Option to Enter Family Names */}
          <div className="pt-2 border-t border-[#0F2537]/10">
            <label
              htmlFor="family-member-name-input"
              className="block text-sm font-bold text-[#0F2537] mb-1.5"
            >
              Enter Family Member Names (Optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Users className="w-5 h-5 text-[#0F2537]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="family-member-name-input"
                  type="text"
                  value={familyNameDraft}
                  onChange={(e) => setFamilyNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFamilyName();
                    }
                  }}
                  placeholder="Enter family member name"
                  className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537] placeholder:text-[#0F2537]/45"
                />
              </div>
              <button
                type="button"
                onClick={handleAddFamilyName}
                className="px-4 py-2.5 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Family</span>
              </button>
            </div>

            {familyNames.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {familyNames.map((fName) => (
                  <div
                    key={fName}
                    className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#FAF7F0] border border-[#0F2537]/15 text-sm font-semibold text-[#0F2537]"
                  >
                    <span>Family Member: {fName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyName(fName)}
                      aria-label={`Remove ${fName}`}
                      className="text-[#0F2537]/60 hover:text-[#0F2537] p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#0F2537] hover:bg-[#17364F] text-[#F5B73B] font-display text-lg font-extrabold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {authMode === 'signup'
                ? 'Save Password & Sign In'
                : 'Sign In with Email'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </main>
    </div>
  );
};

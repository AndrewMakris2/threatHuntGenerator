import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  multiFactor,
  TotpMultiFactorGenerator,
  getMultiFactorSession,
  getMultiFactorResolver,
} from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../lib/firebase';

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null); // kept for API compat
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setSession(firebaseUser ? { user: firebaseUser } : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred;
  }

  async function signUp(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred;
  }

  async function signInWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred;
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  // ── MFA (TOTP) ──────────────────────────────────────────────────────────────

  /** Returns list of enrolled MFA factors for the current user */
  function getMFAEnrolledFactors() {
    if (!auth.currentUser) return [];
    return multiFactor(auth.currentUser).enrolledFactors;
  }

  /**
   * Step 1 of enrollment — generates a TOTP secret and returns
   * { secret, qrUrl } so the UI can render a QR code for the authenticator app.
   */
  async function startMFAEnrollment() {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to enable MFA');
    const session = await getMultiFactorSession(user);
    const secret  = await TotpMultiFactorGenerator.generateSecret(session);
    const qrUrl   = secret.generateQrCodeUrl(user.email, 'Phantom Hunter');
    return { secret, qrUrl };
  }

  /**
   * Step 2 of enrollment — verifies the 6-digit OTP and completes enrollment.
   * @param {Object} totpSecret  — the secret returned by startMFAEnrollment
   * @param {string} otp         — 6-digit code from the authenticator app
   */
  async function finishMFAEnrollment(totpSecret, otp) {
    const user      = auth.currentUser;
    if (!user) throw new Error('Must be signed in to enable MFA');
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, otp);
    await multiFactor(user).enroll(assertion, 'Authenticator App');
  }

  /** Remove MFA from the account — unenrolls all TOTP factors */
  async function removeMFA() {
    const user    = auth.currentUser;
    if (!user) throw new Error('Must be signed in');
    const mfaUser = multiFactor(user);
    for (const factor of mfaUser.enrolledFactors) {
      await mfaUser.unenroll(factor);
    }
  }

  /**
   * During sign-in, if Firebase throws auth/multi-factor-auth-required,
   * call this to get the resolver, then call completeMFASignIn with the OTP.
   */
  function getMFAResolver(error) {
    return getMultiFactorResolver(auth, error);
  }

  /**
   * Complete sign-in when MFA is required.
   * @param {MultiFactorResolver} resolver — from getMFAResolver
   * @param {string} otp                   — 6-digit code from authenticator app
   */
  async function completeMFASignIn(resolver, otp) {
    const hint      = resolver.hints[0];
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, otp);
    return await resolver.resolveSignIn(assertion);
  }

  // Kept for API compat — Firebase stores profile in the user object itself
  async function updateProfile() {}

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      // MFA
      getMFAEnrolledFactors,
      startMFAEnrollment,
      finishMFAEnrollment,
      removeMFA,
      getMFAResolver,
      completeMFASignIn,
      isSupabaseEnabled: isFirebaseEnabled, // legacy alias used throughout app
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

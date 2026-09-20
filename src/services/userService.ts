import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { removeUndefinedFields } from '../utils/firestore';
import type { UserProfile } from '../types';

export async function syncUserDocument(authUser: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', authUser.uid);
  const path = `users/${authUser.uid}`;

  try {
    const snapshot = await getDoc(userRef);
    const nowIso = new Date().toISOString();

    if (!snapshot.exists()) {
      // First-time sign-in: create user profile document
      const newProfile: UserProfile = {
        uid: authUser.uid,
        displayName: authUser.displayName || 'Traveler',
        email: authUser.email || '',
        photoURL: authUser.photoURL || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Clean undefined fields for Firestore
      const firestoreData: Record<string, any> = {
        uid: newProfile.uid,
        displayName: newProfile.displayName,
        email: newProfile.email,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt,
      };
      if (newProfile.photoURL) {
        firestoreData.photoURL = newProfile.photoURL;
      }

      await setDoc(userRef, removeUndefinedFields(firestoreData));
      return newProfile;
    } else {
      // Returning user: refresh updatedAt
      const existingData = snapshot.data() as UserProfile;
      const updatePayload: Record<string, any> = {
        updatedAt: nowIso,
      };
      if (authUser.displayName && authUser.displayName !== existingData.displayName) {
        updatePayload.displayName = authUser.displayName;
      }
      if (authUser.photoURL && authUser.photoURL !== existingData.photoURL) {
        updatePayload.photoURL = authUser.photoURL;
      }

      await updateDoc(userRef, removeUndefinedFields(updatePayload));
      return {
        ...existingData,
        ...updatePayload,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    // Fallback if error is logged
    return {
      uid: authUser.uid,
      displayName: authUser.displayName || 'Traveler',
      email: authUser.email || '',
      photoURL: authUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

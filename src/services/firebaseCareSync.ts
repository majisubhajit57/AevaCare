import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  OperationType,
  handleFirestoreError,
  firebaseConfig,
} from '../firebase';
import { MedicationItem, UserRole } from '../types/care';

export interface FirestoreUserDataSnapshot {
  connected: boolean;
  projectId: string;
  databaseId: string;
  userId: string | null;
  documentPath: string | null;
  email: string;
  displayName: string;
  role: UserRole;
  familyNamesCsv: string;
  syncedMedicationsCount: number;
  lastSyncedAt: string;
}

// Mutex queue to prevent concurrent getDoc -> setDoc races on initial sign-in
let syncQueue: Promise<unknown> = Promise.resolve();

function enqueueFirestoreOp<T>(fn: () => Promise<T>): Promise<T> {
  const next = syncQueue.then(fn, fn);
  syncQueue = next.catch(() => {});
  return next;
}

export async function syncCareProfileToFirestore(params: {
  email: string;
  displayName: string;
  role: UserRole;
  familyNames: string[];
}): Promise<void> {
  return enqueueFirestoreOp(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      return;
    }

    const userId = currentUser.uid;
    const profilePath = `careProfiles/${userId}`;
    const profileRef = doc(db, 'careProfiles', userId);
    const safeEmail = (params.email || currentUser.email || 'user@gmail.com')
      .trim()
      .toLowerCase()
      .slice(0, 150);
    const safeDisplayName = (
      params.displayName ||
      currentUser.displayName ||
      safeEmail
    ).slice(0, 100);
    const safeFamilyCsv = params.familyNames.join(', ').slice(0, 500);

    try {
      const snap = await getDoc(profileRef);
      // Verify the user hasn't signed out while getDoc was in flight
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        return;
      }

      if (!snap.exists()) {
        await setDoc(profileRef, {
          ownerId: userId,
          email: safeEmail,
          displayName: safeDisplayName,
          role: params.role,
          familyNamesCsv: safeFamilyCsv,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(profileRef, {
          email: safeEmail,
          displayName: safeDisplayName,
          role: params.role,
          familyNamesCsv: safeFamilyCsv,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      // If the user signed out while the request was in flight, ignore the cancelled write
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  });
}

export async function syncMedicationToFirestore(
  med: MedicationItem
): Promise<void> {
  return enqueueFirestoreOp(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      return;
    }

    const userId = currentUser.uid;
    const cleanMedId = med.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    const medPath = `careProfiles/${userId}/medications/${cleanMedId}`;
    const medRef = doc(db, 'careProfiles', userId, 'medications', cleanMedId);

    try {
      const snap = await getDoc(medRef);
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        return;
      }

      if (!snap.exists()) {
        await setDoc(medRef, {
          ownerId: userId,
          medId: cleanMedId,
          brandName: med.brandName.slice(0, 120),
          genericName: med.genericName.slice(0, 120),
          dosage: med.dosage.slice(0, 60),
          whatItIsFor: med.whatItIsFor.slice(0, 300),
          timeSlot: med.timeSlot,
          scheduledTime: med.scheduledTime.slice(0, 40),
          status: med.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(medRef, {
          status: med.status,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, medPath);
    }
  });
}

export async function syncAllUserDataToFirestore(params: {
  email: string;
  displayName: string;
  role: UserRole;
  familyNames: string[];
  medications: MedicationItem[];
}): Promise<FirestoreUserDataSnapshot> {
  const nowStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (auth.currentUser && auth.currentUser.uid) {
    await syncCareProfileToFirestore({
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      familyNames: params.familyNames,
    });

    for (const med of params.medications) {
      if (!auth.currentUser) break;
      await syncMedicationToFirestore(med);
    }
  }

  return fetchFirestoreUserDataSnapshot({
    fallbackEmail: params.email,
    fallbackDisplayName: params.displayName,
    fallbackRole: params.role,
    fallbackFamilyNames: params.familyNames,
    fallbackMedCount: params.medications.length,
    timestamp: nowStr,
  });
}

export async function fetchFirestoreUserDataSnapshot(params: {
  fallbackEmail: string;
  fallbackDisplayName: string;
  fallbackRole: UserRole;
  fallbackFamilyNames: string[];
  fallbackMedCount: number;
  timestamp?: string;
}): Promise<FirestoreUserDataSnapshot> {
  const nowStr =
    params.timestamp ||
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    return {
      connected: true,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      userId: null,
      documentPath: `/careProfiles/{auth.uid}`,
      email: params.fallbackEmail,
      displayName: params.fallbackDisplayName,
      role: params.fallbackRole,
      familyNamesCsv: params.fallbackFamilyNames.join(', '),
      syncedMedicationsCount: params.fallbackMedCount,
      lastSyncedAt: nowStr,
    };
  }

  const userId = currentUser.uid;
  try {
    const profileSnap = await getDoc(doc(db, 'careProfiles', userId));
    const medsQuery = query(
      collection(db, 'careProfiles', userId, 'medications'),
      where('ownerId', '==', userId)
    );
    const medsSnap = await getDocs(medsQuery);
    const data = profileSnap.exists() ? profileSnap.data() : null;

    return {
      connected: true,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      userId,
      documentPath: `/careProfiles/${userId}`,
      email: (data?.email as string) || params.fallbackEmail,
      displayName: (data?.displayName as string) || params.fallbackDisplayName,
      role: (data?.role as UserRole) || params.fallbackRole,
      familyNamesCsv:
        data?.familyNamesCsv !== undefined
          ? (data.familyNamesCsv as string)
          : params.fallbackFamilyNames.join(', '),
      syncedMedicationsCount: medsSnap.size || params.fallbackMedCount,
      lastSyncedAt: nowStr,
    };
  } catch {
    return {
      connected: true,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      userId,
      documentPath: `/careProfiles/${userId}`,
      email: params.fallbackEmail,
      displayName: params.fallbackDisplayName,
      role: params.fallbackRole,
      familyNamesCsv: params.fallbackFamilyNames.join(', '),
      syncedMedicationsCount: params.fallbackMedCount,
      lastSyncedAt: nowStr,
    };
  }
}

export async function loadMedicationsFromFirestore(): Promise<
  Record<string, { status: MedicationItem['status'] }>
> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    return {};
  }

  const userId = currentUser.uid;
  const colPath = `careProfiles/${userId}/medications`;
  try {
    const medsQuery = query(
      collection(db, 'careProfiles', userId, 'medications'),
      where('ownerId', '==', userId)
    );
    const snap = await getDocs(medsQuery);
    const map: Record<string, { status: MedicationItem['status'] }> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.medId && data.status) {
        map[data.medId] = { status: data.status };
      }
    });
    return map;
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return {};
    }
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

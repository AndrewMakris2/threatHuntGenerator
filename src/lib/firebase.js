import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDjGXv88H8DOb92mJvNDBj40jYBd0XZTRg',
  authDomain:        'phantomhunter-84af3.firebaseapp.com',
  projectId:         'phantomhunter-84af3',
  storageBucket:     'phantomhunter-84af3.firebasestorage.app',
  messagingSenderId: '859706943580',
  appId:             '1:859706943580:web:9baff3b84eb4d91901de99',
  measurementId:     'G-JMPND9NHN5',
};

export const isFirebaseEnabled = true;

let app, auth, db;

if (isFirebaseEnabled) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
}

export { auth, db };

// Legacy alias so AppContext doesn't need changing yet
export const isSupabaseEnabled = isFirebaseEnabled;

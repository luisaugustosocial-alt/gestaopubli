import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCW2zeoW4IN0h_oT5ijAnD8w2YGcbu6lFw',
  authDomain: 'gestaopubli.firebaseapp.com',
  projectId: 'gestaopubli',
  storageBucket: 'gestaopubli.firebasestorage.app',
  messagingSenderId: '170011491650',
  appId: '1:170011491650:web:04f62e5406b4a25de19cdb'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

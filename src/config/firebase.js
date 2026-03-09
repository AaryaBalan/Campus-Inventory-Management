import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBubNN5CYilPD5KX40v6nXlYJVzwkXcvaY",
    authDomain: "campus-inventory-project.firebaseapp.com",
    projectId: "campus-inventory-project",
    storageBucket: "campus-inventory-project.firebasestorage.app",
    messagingSenderId: "132866656899",
    appId: "1:132866656899:web:568d1dbbfa2035b602a9b6",
    measurementId: "G-0EEERY9LFL",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

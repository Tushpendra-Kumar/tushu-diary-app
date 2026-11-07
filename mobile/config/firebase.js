import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider 
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDjMBHvC34awsu-nTBVFQIxAcnTlSxyluw",
  authDomain: "tushuledger.firebaseapp.com",
  projectId: "tushuledger",
  storageBucket: "tushuledger.firebasestorage.app",
  messagingSenderId: "1091399514212",
  appId: "1:1091399514212:web:8ed409608721e03d94c771",
  measurementId: "G-HFNW59D71K"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Provider instances
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export default app;

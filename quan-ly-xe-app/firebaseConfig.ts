import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// Nạp thêm vũ khí Authentication
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyDUV-OucTtirwNEHWyFt7fRmsr0JPseYTk",
  authDomain: "quan-ly-xe-87bae.firebaseapp.com",
  databaseURL: "https://quan-ly-xe-87bae-default-rtdb.firebaseio.com",
  projectId: "quan-ly-xe-87bae",
  storageBucket: "quan-ly-xe-87bae.firebasestorage.app",
  messagingSenderId: "289110059734",
  appId: "1:289110059734:web:dd9bee3875a636fc673777",
  measurementId: "G-227PSGRV0L"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
// Xuất Auth ra để dùng
export const auth = getAuth(app);
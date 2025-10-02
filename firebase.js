// src/firebase.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  RecaptchaVerifier
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// ====== Cấu hình Firebase ======
const firebaseConfig = {
  apiKey: "AIzaSyCF79ICxHwPTmcBcIlWpa9tMWKA1qhJTKs",
  authDomain: "quan-ly-trai-dui-ecee6.firebaseapp.com",
  projectId: "quan-ly-trai-dui-ecee6",
  storageBucket: "quan-ly-trai-dui-ecee6.appspot.com",
  messagingSenderId: "616229547905",
  appId: "1:616229547905:android:cec3ae1a43c713605b0280", // Android App ID
};

// ====== Khởi tạo Firebase ======
const app = initializeApp(firebaseConfig);

// ====== Firebase services ======
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// ====== Recaptcha (chỉ chạy trên web) ======
export const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (Platform.OS !== "web") return null;

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      { size: "invisible" },
      auth
    );
  }
  return window.recaptchaVerifier;
};

// ====== Lưu user vào Firestore ======
export const saveUser = async (user, role = "pending") => {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      displayName: user.displayName || "Người dùng mới",
      approved: false,
      role: role,
      blocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

// ====== Debug ======
console.log("✅ Firebase initialized:", app.name);
console.log("✅ Firestore instance:", db);

export default app;

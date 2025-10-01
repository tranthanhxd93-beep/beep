// src/auth.js
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup,
    signOut
} from "firebase/auth";
import {
    auth,
    googleProvider, saveUser, setupRecaptcha
} from "./firebase";
  
  // ====== Email/Password Signup ======
  export const emailSignup = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Cập nhật displayName nếu cần
      if (displayName) {
        user.displayName = displayName;
      }
      await saveUser(user, "user");
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  // ====== Email/Password Login ======
  export const emailLogin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await saveUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  // ====== Google Login ======
  export const googleLogin = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await saveUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  // ====== Phone Login (OTP) ======
  export const phoneLogin = async (phoneNumber, containerId = "recaptcha-container") => {
    try {
      const recaptchaVerifier = setupRecaptcha(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      // confirmationResult sẽ dùng để verify OTP sau
      return { success: true, confirmationResult };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  // ====== Verify OTP ======
  export const verifyOTP = async (confirmationResult, otp) => {
    try {
      const { user } = await confirmationResult.confirm(otp);
      await saveUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  // ====== Logout ======
  export const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };
  
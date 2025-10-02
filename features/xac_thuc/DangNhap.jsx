// src/features/xac_thuc/DangNhap.jsx
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebase";

WebBrowser.maybeCompleteAuthSession();

const superAdminUID = "qBq9vNp2OOe7j6JI9iLnR5TC4wC3";

// --- Lấy user từ Firestore
const getUserData = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// --- Lưu user mới
const saveUserData = async (user, role = "pending") => {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role,
    blocked: false,
    createdAt: serverTimestamp(),
  });
};

// --- Component Thông Báo
function ThongBaoDangNhap({ message, onOk, fadeAnim }) {
  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Image source={require("../../assets/logo.png")} style={styles.logoBig} />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onOk}>
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DangNhap({ navigation }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showThongBao, setShowThongBao] = useState(false);
  const [thongBaoMsg, setThongBaoMsg] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  // --- Cấu hình Google Sign-In
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "616229547905-k5f0o6i8md447slbpd5mobppco3258ro.apps.googleusercontent.com", // Web
    androidClientId: "616229547905-5knhuolmi5otrfjjejqpd1fqrdo0b2vh.apps.googleusercontent.com", // Android
    iosClientId: "616229547905-8j9uebdpclrv1iniq6ghjpjhp8mu0rrf.apps.googleusercontent.com", // iOS
    expoClientId: "616229547905-k5f0o6i8md447slbpd5mobppco3258ro.apps.googleusercontent.com", // Expo Go
  });

  // --- Fade-in animation khi overlay xuất hiện
  useEffect(() => {
    if (showThongBao) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showThongBao]);

  // --- Google Sign-In xử lý response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success" && response.params.id_token) {
        try {
          const credential = GoogleAuthProvider.credential(response.params.id_token);
          const userCred = await signInWithCredential(auth, credential);
          let userData = await getUserData(userCred.user.uid);

          if (!userData) {
            const role = userCred.user.uid === superAdminUID ? "Super Admin" : "pending";
            await saveUserData(userCred.user, role);
            setThongBaoMsg("Tài khoản đang chờ admin duyệt!");
            setShowThongBao(true);
            await signOut(auth);
            return;
          }

          if (userData.role === "pending") {
            setThongBaoMsg("Tài khoản đang chờ admin duyệt!");
            setShowThongBao(true);
            await signOut(auth);
            return;
          }

          if (userData.blocked) {
            setThongBaoMsg("Tài khoản bị chặn. Liên hệ admin!");
            setShowThongBao(true);
            await signOut(auth);
            return;
          }

          navigation.replace("BoCucChinh", { user: userData });
        } catch (err) {
          console.error(err);
          setThongBaoMsg("Không thể đăng nhập bằng Google!");
          setShowThongBao(true);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  // --- Email / Password Auth
  const handleEmailAuth = async () => {
    try {
      if (!email.includes("@")) {
        setThongBaoMsg("Email không hợp lệ!");
        setShowThongBao(true);
        return;
      }
      if (!password) {
        setThongBaoMsg("Mật khẩu không được để trống!");
        setShowThongBao(true);
        return;
      }

      if (isRegister) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          setThongBaoMsg("Email đã được đăng ký. Hãy đăng nhập hoặc chờ admin duyệt.");
          setShowThongBao(true);
          return;
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCred.user, "pending");
        setThongBaoMsg("Tài khoản đã tạo, chờ admin duyệt!");
        setShowThongBao(true);
        await signOut(auth);
        setEmail(""); setPassword(""); setIsRegister(false);
        return;
      }

      // --- Đăng nhập
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(userCred.user.uid);

      if (!userData) {
        setThongBaoMsg("Tài khoản chưa đăng ký!");
        setShowThongBao(true);
        await signOut(auth);
        return;
      }

      if (userData.role === "pending") {
        setThongBaoMsg("Tài khoản đang chờ admin duyệt!");
        setShowThongBao(true);
        await signOut(auth);
        return;
      }

      if (userData.blocked) {
        setThongBaoMsg("Tài khoản bị chặn. Liên hệ admin!");
        setShowThongBao(true);
        await signOut(auth);
        return;
      }

      navigation.replace("BoCucChinh", { user: userData });

    } catch (err) {
      console.error(err);
      setThongBaoMsg(err.message);
      setShowThongBao(true);
    }
  };

  // --- Google Sign-In bấm nút
  const handleGooglePress = () => {
    const useProxy = Constants.appOwnership === "expo";
    promptAsync({ useProxy });
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />

      <View style={styles.card}>
        <Text style={styles.title}>{isRegister ? "Đăng ký" : "Đăng nhập"}</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>{showPassword ? "Ẩn" : "Hiện"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, styles.btnBlue]} onPress={handleEmailAuth}>
          <Text style={styles.buttonText}>{isRegister ? "Đăng ký bằng Email" : "Đăng nhập bằng Email"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.btnRed, !request && { opacity: 0.6 }]}
          onPress={handleGooglePress}
          disabled={!request}
        >
          <Text style={styles.buttonText}>{isRegister ? "Đăng ký bằng Google" : "Đăng nhập bằng Google"}</Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <Text style={styles.linkText} onPress={() => setIsRegister(!isRegister)}>
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </Text>
        </Text>
      </View>

      {showThongBao && (
        <ThongBaoDangNhap
          message={thongBaoMsg}
          fadeAnim={fadeAnim}
          onOk={() => setShowThongBao(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" },
  logo: { width: 120, height: 120, marginBottom: 12 },
  logoBig: { width: 150, height: 150, marginBottom: 20 },
  card: { backgroundColor: "white", padding: 20, borderRadius: 12, width: 320, elevation: 4 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10, borderColor: "#ddd" },
  passwordRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  toggleBtn: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 6 },
  toggleText: { color: "#3b82f6", fontWeight: "bold" },
  button: { padding: 12, borderRadius: 8, marginBottom: 10 },
  btnBlue: { backgroundColor: "#3b82f6" },
  btnRed: { backgroundColor: "#ef4444" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  switchText: { textAlign: "center", marginTop: 12, color: "#444" },
  linkText: { color: "#3b82f6", fontWeight: "bold" },
  overlay: { position: "absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(243,244,246,0.95)", justifyContent:"center", alignItems:"center", padding:20 },
  message: { fontSize: 18, textAlign:"center", marginBottom:20, color:"#444" },
});

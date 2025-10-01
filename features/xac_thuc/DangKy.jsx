// src/features/xac_thuc/DangKy.jsx
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithCredential,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebase";

WebBrowser.maybeCompleteAuthSession();

const superAdminUID = "qBq9vNp2OOe7j6JI9iLnR5TC4wC3";

// --- Lấy user Firestore
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
function ThongBaoDangKy({ message, onOk, fadeAnim }) {
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

export default function DangKy({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showThongBao, setShowThongBao] = useState(false);
  const [thongBaoMsg, setThongBaoMsg] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "616229547905-n9nc5ino1va6sgevm0rlf5sgdh1dpuc7.apps.googleusercontent.com",
  });

  // --- Fade-in animation overlay
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

  // --- Google Sign-Up
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
          setThongBaoMsg("Không thể đăng ký bằng Google!");
          setShowThongBao(true);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  // --- Email Sign-Up
  const handleDangKy = async () => {
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

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setThongBaoMsg("Email đã được đăng ký. Hãy đăng nhập hoặc chờ admin duyệt.");
        setShowThongBao(true);
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserData(userCred.user, "pending");

      setThongBaoMsg("Đăng ký thành công! Tài khoản đang chờ admin duyệt.");
      setShowThongBao(true);
      await signOut(auth);
      setEmail(""); setPassword("");

    } catch (err) {
      console.error(err);
      setThongBaoMsg(err.message);
      setShowThongBao(true);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />

      <View style={styles.card}>
        <Text style={styles.title}>Đăng ký</Text>

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

        <TouchableOpacity style={[styles.button, styles.btnBlue]} onPress={handleDangKy}>
          <Text style={styles.buttonText}>Đăng ký bằng Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.btnRed, !request && { opacity: 0.6 }]}
          onPress={() => promptAsync({ useProxy: true })}
          disabled={!request}
        >
          <Text style={styles.buttonText}>Đăng ký bằng Google</Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          Đã có tài khoản?{" "}
          <Text style={styles.linkText} onPress={() => navigation.replace("DangNhap")}>
            Đăng nhập
          </Text>
        </Text>
      </View>

      {showThongBao && (
        <ThongBaoDangKy
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

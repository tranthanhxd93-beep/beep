import { useNavigation } from "@react-navigation/native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { db } from "../../firebase";

const showAlert = (title, message) =>
  new Promise((resolve) => {
    Alert.alert(title, message, [{ text: "OK", onPress: resolve }], { cancelable: false });
  });

export default function BaoVeDangNhap({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        navigation.reset({ index: 0, routes: [{ name: "DangNhap" }] });
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const userData = snap.exists() ? snap.data() : null;

        if (!userData) {
          await showAlert("Chưa đăng ký", "Tài khoản chưa được đăng ký. Liên hệ admin.");
          await auth.signOut();
          setUser(null);
          navigation.reset({ index: 0, routes: [{ name: "DangNhap" }] });
          return;
        }

        if (userData.role === "pending") {
          await showAlert("Chờ duyệt", "Tài khoản đang chờ admin duyệt.");
          await auth.signOut();
          setUser(null);
          navigation.reset({ index: 0, routes: [{ name: "DangNhap" }] });
          return;
        }

        if (userData.blocked) {
          await showAlert("Bị chặn", "Tài khoản bị chặn. Liên hệ admin.");
          await auth.signOut();
          setUser(null);
          navigation.reset({ index: 0, routes: [{ name: "DangNhap" }] });
          return;
        }

        setUser({ uid: u.uid, ...userData });
      } catch (err) {
        console.error(err);
        await auth.signOut();
        setUser(null);
        navigation.reset({ index: 0, routes: [{ name: "DangNhap" }] });
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  return user ? children : null;
}

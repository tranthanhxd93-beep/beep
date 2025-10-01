// features/splash/SplashScreen.jsx
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // 👈 thêm dòng này
import { db } from "../../firebase.js"; // ✅ đường dẫn đúng

export default function ManHinhChao({ onFinish }) {
  useEffect(() => {
    const loadData = async () => {
      let cageData = [];
      try {
        const snapshot = await getDocs(collection(db, "cages"));
        cageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Số lượng chuồng:", snapshot.size);
      } catch (err) {
        console.error("Lỗi load dữ liệu Splash:", err);
      } finally {
        setTimeout(() => {
          if (onFinish) onFinish(cageData); // truyền dữ liệu xuống App.js
        }, 1500);
      }
    };
    loadData();
  }, [onFinish]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.text}>🐹 Quản lý trại Dúi</Text>
      <ActivityIndicator size="large" color="#3b82f6" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1f2937", justifyContent: "center", alignItems: "center" },
  text: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 16 },
});

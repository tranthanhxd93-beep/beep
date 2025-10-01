// features/tai_lieu/TaiLieu.jsx
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase";
import NenLogo from "./NenLogo"; // ✅ thêm nền logo mờ

export default function TaiLieu({ user }) {
  const [taiLieuList, setTaiLieuList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "taiLieu"));
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTaiLieuList(docs);
      } catch (error) {
        console.error("Lỗi khi tải tài liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Đang tải tài liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Logo nền */}
      <NenLogo />

      {taiLieuList.length === 0 ? (
        <View style={styles.center}>
          <Text>Chưa có tài liệu nào.</Text>
        </View>
      ) : (
        <FlatList
          data={taiLieuList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item}>
              <Text style={styles.title}>{item.ten || "Không có tiêu đề"}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.noiDung || "Không có nội dung"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  desc: { fontSize: 14, color: "#555" },
});

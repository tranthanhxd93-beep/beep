// features/man_hinh_chinh/ManHinhChinh.jsx
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ManHinhChinh({ user }) {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🐹 Ứng dụng Quản lý Trại Dúi</Text>
      <Text style={styles.sub}>Xin chào: {user?.email}</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("ManHinhThietKe")}
      >
        <Text style={styles.menuText}>📐 Quản lý thiết kế chuồng</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("TroChuyen")}
      >
        <Text style={styles.menuText}>💬 Trò chuyện</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("TaiLieu")}
      >
        <Text style={styles.menuText}>📚 Tài liệu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("QuanLyNguoiDung")}
      >
        <Text style={styles.menuText}>👥 Quản lý người dùng</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  sub: { fontSize: 14, marginBottom: 16, textAlign: "center", color: "#444" },
  menuItem: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  menuText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
});

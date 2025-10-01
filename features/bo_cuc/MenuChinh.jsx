// features/bo_cuc/MenuChinh.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MenuChinh({ title, onPressMenu }) {
  return (
    <View style={styles.header}>
      {/* Nút menu */}
      <TouchableOpacity style={styles.menuButton} onPress={onPressMenu}>
        <Ionicons name="menu" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Tiêu đề chính */}
      <Text style={styles.title}>{title}</Text>

      {/* Khoảng trống thay cho tên + logout */}
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 90,                 // tăng chiều cao header để hạ nút + chữ xuống
    backgroundColor: "#00796b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 10,             // tạo khoảng cách từ trên xuống
  },
  menuButton: {
    padding: 10,                // diện tích bấm lớn
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
});

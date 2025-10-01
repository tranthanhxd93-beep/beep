import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Platform, SafeAreaView, StatusBar, StyleSheet, Text,
    TouchableOpacity, View
} from "react-native";

export default function MenuDau({ onPressMenu }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Nút menu */}
        <TouchableOpacity onPress={onPressMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Tiêu đề ở giữa */}
        <Text style={styles.title}>Quản Lý Trại Dúi</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#4CAF50",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // ✅ đẩy xuống tránh status bar
  },
  header: {
    height: 56,
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  menuButton: {
    position: "absolute",
    left: 12,
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

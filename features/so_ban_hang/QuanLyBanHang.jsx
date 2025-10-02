import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QuanLyHoaDon from "./QuanLyHoaDon";
import QuanLyKhachHang from "./QuanLyKhachHang";

export default function QuanLyBanHang({ user }) {
  const [activeTab, setActiveTab] = useState("HoaDon"); // "HoaDon" | "KhachHang"

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Buttons */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "HoaDon" && styles.activeTab]}
          onPress={() => setActiveTab("HoaDon")}
        >
          <Text style={[styles.tabText, activeTab === "HoaDon" && styles.activeTabText]}>
            Hóa Đơn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "KhachHang" && styles.activeTab]}
          onPress={() => setActiveTab("KhachHang")}
        >
          <Text style={[styles.tabText, activeTab === "KhachHang" && styles.activeTabText]}>
            Khách Hàng
          </Text>
        </TouchableOpacity>
      </View>

      {/* Container cho tab, mỗi tab tự cuộn nếu cần */}
      <View style={{ flex: 1 }}>
        {activeTab === "HoaDon" ? (
          <QuanLyHoaDon user={user} />
        ) : (
          <QuanLyKhachHang user={user} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", marginBottom: 12 },
  tabButton: { flex: 1, padding: 10, backgroundColor: "#eee", alignItems: "center" },
  activeTab: { backgroundColor: "#007bff" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#333" },
  activeTabText: { color: "#fff" },
});

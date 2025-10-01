import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TaiLieuCu() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Tài liệu</Text>
      <Text>Đây là trang Documents. Bạn có thể thêm nội dung sau.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
});

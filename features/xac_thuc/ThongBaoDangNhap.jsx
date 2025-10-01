import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ThongBaoDangNhap({ visible, message, onOk }) {
  if (!visible) return null; // không render nếu không hiển thị

  return (
    <View style={styles.overlay}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Thông báo</Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed, // hiệu ứng khi bấm
        ]}
        onPress={onOk}
      >
        <Text style={styles.buttonText}>OK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: { width: 150, height: 150, marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 28,
    textAlign: "center",
  },
});

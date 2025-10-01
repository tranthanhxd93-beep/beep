import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function NenLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer} pointerEvents="none">
        <Image
          source={require("../../assets/logo.png")} // 🔹 thay bằng logo của bạn
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // phủ toàn màn hình
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    opacity: 0.30, // 🔹 làm logo sáng hơn (0.15 thay vì 0.08)
    position: "absolute",
  },
  logo: {
    width: 350,
    height: 350,
  },
});

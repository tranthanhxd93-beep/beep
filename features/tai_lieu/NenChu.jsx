import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width: RONG, height: CAO } = Dimensions.get("window");

export default function NenChu({
  children,
  noiDung = "BAN QUYEN - TRAI DUI", // chu watermark
  lapNgang = 3,   // so chu lap theo chieu ngang
  lapDoc = 6,     // so chu lap theo chieu doc
  doMo = 10.5,    // do mo chu
  gocXoay = -25,  // xoay chu
}) {
  const danhSach = [];
  for (let y = 0; y < lapDoc; y++) {
    for (let x = 0; x < lapNgang; x++) {
      danhSach.push({ x, y, key: `${x}-${y}` });
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Noi dung tai lieu */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Nen chu mo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {danhSach.map(({ x, y, key }) => (
          <Text
            key={key}
            style={[
              kieu.chu,
              {
                top: (y / lapDoc) * CAO + 40,
                left: (x / lapNgang) * RONG + 20,
                opacity: doMo,
                transform: [{ rotate: `${gocXoay}deg` }],
              },
            ]}
          >
            {xinchao}
          </Text>
        ))}
      </View>
    </View>
  );
}

const kieu = StyleSheet.create({
  chu: {
    position: "absolute",
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    width: 300,
    textAlign: "center",
  },
});

import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../../firebase"; // Đường dẫn tới file firebase.js

export default function FormThemChuong({ onAdd }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("Thông báo", "Vui lòng nhập tên chuồng!");

    const cageData = {
      name,
      capacity: parseInt(capacity) || 0,
      note,
      createdAt: new Date()
    };

    try {
      setLoading(true);
      // Thêm vào Firestore
      const docRef = await addDoc(collection(db, "cages"), cageData);
      Alert.alert("Thành công", "Chuồng đã được thêm!");
      // Cập nhật local state ở component cha nếu có onAdd
      if (onAdd) onAdd({ ...cageData, id: docRef.id });

      // Reset form
      setName("");
      setCapacity("");
      setNote("");
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể thêm chuồng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>➕ Thêm chuồng mới</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Tên chuồng"
        style={styles.input}
      />

      <TextInput
        value={capacity}
        onChangeText={setCapacity}
        placeholder="Sức chứa (số con)"
        style={styles.input}
        keyboardType="numeric"
      />

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ghi chú"
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Đang lưu..." : "Lưu"}
          onPress={handleSubmit}
          color="#3b82f6"
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 8,
  },
});

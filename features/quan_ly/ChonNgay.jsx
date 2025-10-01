// features/management/DateInput.js
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChonNgay({ label, value, onChange, editable = true }) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const handlePress = () => {
    if (!editable) return;
    setShow(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShow(Platform.OS === "ios"); // iOS picker stays open
    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate.toLocaleDateString());
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity onPress={handlePress} disabled={!editable}>
        <TextInput
          value={value}
          editable={false}
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 6,
            padding: 10,
            backgroundColor: editable ? "#fff" : "#e5e7eb",
          }}
        />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

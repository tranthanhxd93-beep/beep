import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebase"; // auth để lấy uid
import ModalThemChuong from "./ModalThemChuong_P1";
import QuanLyNongTrai_P2 from "./QuanLyNongTrai_P2";

export default function QuanLyNongTrai_P1({ parentId = null }) {
  const [cages, setCages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCage, setEditingCage] = useState(null);
  const [search, setSearch] = useState("");

  const userId = auth.currentUser.uid; // mỗi user có uid riêng

  const COLUMNS = [
    { key: "male", label: "Đực", types: ["Đực"] },
    { key: "female", label: "Cái", types: ["Cái"] },
    { key: "subMale", label: "Hậu bị đực", types: ["Hậu bị đực"] },
    { key: "subFemale", label: "Hậu bị cái", types: ["Hậu bị cái"] },
    { key: "babyMale", label: "Dúi con đực", types: ["Con đực"] },
    { key: "babyFemale", label: "Dúi con cái", types: ["Con cái"] },
    { key: "meat", label: "Thịt", types: ["Thịt"] },
  ];

  useEffect(() => {
    // Mỗi user có collection riêng: "users/{uid}/cages"
    const baseRef = collection(db, "users", userId, "cages");
    const queryRef = parentId
      ? collection(db, "users", userId, "cages", parentId, "subCages")
      : baseRef;

    const unsub = onSnapshot(queryRef, snapshot => {
      setCages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [parentId, userId]);

  const handleEdit = cage => { 
    setEditingCage(cage); 
    setIsModalOpen(true); 
  };

  const handleDelete = id => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa chuồng này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
        try {
          const ref = parentId
            ? doc(db, "users", userId, "cages", parentId, "subCages", id)
            : doc(db, "users", userId, "cages", id);
          await deleteDoc(ref);
        } catch {
          Alert.alert("Lỗi", "Không thể xóa chuồng!");
        }
      }}
    ]);
  };

  if (loading) 
    return <Text style={{ padding: 16, textAlign: "center" }}>⏳ Đang tải dữ liệu...</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="🔍 Tìm chuồng..."
        placeholderTextColor="#000" // <-- chữ tìm chuồng màu đen
        value={search}
        onChangeText={setSearch}
        style={{ borderWidth:1, borderColor:"#000", borderRadius:6, padding:8, marginBottom:12 }}
      />

      <TouchableOpacity 
        onPress={() => { setEditingCage(null); setIsModalOpen(true); }} 
        style={{ backgroundColor:"#3b82f6", padding:10, borderRadius:6, marginBottom:12 }}
      >
        <Text style={{ color:"#fff", textAlign:"center", fontSize:14 }}>Thêm chuồng mới</Text>
      </TouchableOpacity>

      <QuanLyNongTrai_P2
        cages={cages}
        columns={COLUMNS}
        search={search}
        handleEdit={handleEdit}
      />

      <ModalThemChuong
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCage={editingCage}
        cages={cages}
        parentId={parentId}
        userId={userId} // truyền userId vào modal để lưu dữ liệu
      />
    </View>
  );
}

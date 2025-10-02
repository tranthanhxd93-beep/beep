import {
    collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where, writeBatch
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase";
  
function normalizeText(s = "") {
  return s.toString().trim().toLowerCase().replace(/\s+/g, " ");
}

// format tiền với dấu chấm
function formatVND(num) {
  if (!num) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function QuanLyKhachHang({ user }) {
  const [khachHangMap, setKhachHangMap] = useState({});
  const [hoaDonList, setHoaDonList] = useState([]);
  const [editingData, setEditingData] = useState({});
  const [expandedGroupIds, setExpandedGroupIds] = useState({});
  const [loadingMerge, setLoadingMerge] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, "soBanHang", user.uid, "khachHang");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const obj = {};
      data.forEach(kh => obj[kh.id] = kh);
      setKhachHangMap(obj);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, "hoaDon", user.uid, "orders");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHoaDonList(data);
    });
    return () => unsub();
  }, [user]);

  const groupedCustomers = useMemo(() => {
    const groups = {};
    Object.values(khachHangMap).forEach(kh => {
      const key = `${normalizeText(kh.ten)}||${normalizeText(kh.soDienThoai)}`;
      if (!groups[key]) groups[key] = { key, ids: [], customers: [] };
      groups[key].ids.push(kh.id);
      groups[key].customers.push(kh);
    });

    Object.values(groups).forEach(g => {
      const invoices = hoaDonList.filter(hd => hd.khachHangId && g.ids.includes(hd.khachHangId));
      const soLanMua = invoices.length;
      const tongTien = invoices.reduce((s, hd) => s + (Number(hd.total || 0) || 0), 0);
      const rep = g.customers[0] || {};
      g.displayName = rep.ten || "";
      g.displayPhone = rep.soDienThoai || "";
      g.displayAddr = rep.diaChi || "";
      g.invoices = invoices;
      g.soLanMua = soLanMua;
      g.tongTien = tongTien;
    });

    return Object.values(groups).sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  }, [khachHangMap, hoaDonList]);

  const toggleExpand = (groupKey) => {
    setExpandedGroupIds(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const cancelEditCustomer = (khId) => {
    setEditingData(prev => ({ ...prev, [khId]: null }));
  };

  const handleUpdateCustomer = async (khId) => {
    const editInputs = editingData[khId];
    if (!editInputs?.ten || !editInputs?.soDienThoai) {
      return Alert.alert("Lỗi", "Vui lòng nhập tên và số điện thoại");
    }
    try {
      await updateDoc(doc(db, "soBanHang", user.uid, "khachHang", khId), editInputs);

      const qAll = query(collection(db, "hoaDon", user.uid, "orders"), where("khachHangId", "==", khId));
      const snap = await getDocs(qAll);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.update(doc(db, "hoaDon", user.uid, "orders", d.id), { khachHangInfo: editInputs });
      });
      await batch.commit();

      Alert.alert("✅ Thành công", "Đã cập nhật khách hàng và đồng bộ hóa đơn");
      setEditingData(prev => ({ ...prev, [khId]: null }));
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể cập nhật khách hàng");
    }
  };

  const handleMergeGroup = async (group) => {
    if (!group.ids || group.ids.length <= 1) return;

    // Lấy danh sách địa chỉ khác nhau
    const addresses = Array.from(new Set(group.customers.map(kh => kh.diaChi || "-")));

    // Hiển thị lựa chọn địa chỉ trước khi gộp
    Alert.alert(
      "Chọn địa chỉ để lưu",
      "Chọn địa chỉ sẽ lưu cho khách hàng gộp:",
      addresses.map(addr => ({
        text: addr,
        onPress: async () => {
          const selectedAddr = addr === "-" ? "" : addr;
          try {
            setLoadingMerge(true);
            const repId = group.ids[0];
            const repData = { ...khachHangMap[repId], diaChi: selectedAddr };

            const batch = writeBatch(db);

            const otherIds = group.ids;
            for (const khId of otherIds) {
              const qInvoices = query(collection(db, "hoaDon", user.uid, "orders"), where("khachHangId", "==", khId));
              const invSnap = await getDocs(qInvoices);
              invSnap.docs.forEach(d => {
                batch.update(doc(db, "hoaDon", user.uid, "orders", d.id), {
                  khachHangId: repId,
                  khachHangInfo: repData
                });
              });

              if (khId !== repId) {
                batch.delete(doc(db, "soBanHang", user.uid, "khachHang", khId));
              }
            }

            // Cập nhật bản ghi đại diện
            batch.update(doc(db, "soBanHang", user.uid, "khachHang", repId), repData);

            await batch.commit();
            Alert.alert("✅ Đã gộp", "Đã gộp các bản ghi và cập nhật hóa đơn.");
          } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Gộp thất bại. Kiểm tra console.");
          } finally {
            setLoadingMerge(false);
          }
        }
      }))
    );
  };

  const renderGroupItem = ({ item: group }) => {
    const isExpanded = !!expandedGroupIds[group.key];

    return (
      <View style={styles.card}>
        {/* Chỉ hiển thị tên + SĐT luôn */}
        <TouchableOpacity onPress={() => toggleExpand(group.key)}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>{group.displayName} | {group.displayPhone}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={{ marginTop: 8 }}>
            <Text>{group.displayAddr || "-"}</Text>
            <Text style={{ marginTop: 6 }}>{`Số lần mua: ${group.soLanMua} | Tổng tiền: ${formatVND(group.tongTien)} VND`}</Text>

            <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {group.customers.map(kh => {
                const isEditing = !!editingData[kh.id];
                return (
                  <View key={kh.id} style={{ marginLeft: 6, marginTop: 6 }}>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => {
                        if (isEditing) handleUpdateCustomer(kh.id);
                        else setEditingData(prev => ({ ...prev, [kh.id]: { ...kh } }));
                      }}
                    >
                      <Text style={styles.smallBtnText}>{isEditing ? "✅" : "✏️"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: isEditing ? "#888" : "#ff3b30", marginTop: 6 }]}
                      onPress={() => {
                        if (isEditing) cancelEditCustomer(kh.id);
                        else {
                          Alert.alert(
                            "Xác nhận",
                            "Xóa khách hàng này? (Hóa đơn giữ nguyên thông tin)",
                            [
                              { text: "Hủy", style: "cancel" },
                              {
                                text: "Xóa",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await deleteDoc(doc(db, "soBanHang", user.uid, "khachHang", kh.id));
                                    Alert.alert("✅ Đã xóa");
                                  } catch (err) {
                                    console.error(err);
                                    Alert.alert("Lỗi", "Không thể xóa khách hàng");
                                  }
                                }
                              }
                            ]
                          );
                        }
                      }}
                    >
                      <Text style={styles.smallBtnText}>{isEditing ? "✖️" : "❌"}</Text>
                    </TouchableOpacity>

                    {isEditing && (
                      <View style={{ marginTop: 6 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Tên khách"
                          value={editingData[kh.id]?.ten}
                          onChangeText={t => setEditingData(prev => ({ ...prev, [kh.id]: { ...prev[kh.id], ten: t } }))}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Số điện thoại"
                          value={editingData[kh.id]?.soDienThoai}
                          onChangeText={t => setEditingData(prev => ({ ...prev, [kh.id]: { ...prev[kh.id], soDienThoai: t } }))}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Địa chỉ"
                          value={editingData[kh.id]?.diaChi}
                          onChangeText={t => setEditingData(prev => ({ ...prev, [kh.id]: { ...prev[kh.id], diaChi: t } }))}
                        />
                      </View>
                    )}
                  </View>
                );
              })}

              {group.ids.length > 1 && (
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "#0a84ff", marginLeft: 6, marginTop: 6 }]}
                  onPress={() => handleMergeGroup(group)}
                  disabled={loadingMerge}
                >
                  <Text style={styles.smallBtnText}>{loadingMerge ? "Đang..." : "Gộp"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {Object.keys(khachHangMap).length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Chưa có khách hàng</Text>
      )}
      <FlatList
        data={groupedCustomers}
        keyExtractor={g => g.key}
        renderItem={renderGroupItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderWidth: 1, borderColor: "#999", borderRadius: 8, marginBottom: 12, backgroundColor: "#f9f9f9" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    marginVertical: 4,
    backgroundColor: "#fff",
    color: "#000",
  },
  smallBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center"
  },
  smallBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 }
});

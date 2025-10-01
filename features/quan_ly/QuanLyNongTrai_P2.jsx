import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const COLUMNS = [
  { key: "male", label: "Đực", types: ["Đực"] },
  { key: "female", label: "Cái", types: ["Cái"] },
  { key: "subMale", label: "Hậu bị đực", types: ["Hậu bị đực"] },
  { key: "subFemale", label: "Hậu bị cái", types: ["Hậu bị cái"] },
  { key: "babyMale", label: "Dúi con đực", types: ["Con đực"] },
  { key: "babyFemale", label: "Dúi con cái", types: ["Con cái"] },
  { key: "meat", label: "Thịt", types: ["Thịt"] },
];

// --- Hàm normalize để search ---
function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

// --- helper date ---
const parseDateSafe = (d) => {
  if (!d) return null;
  if (typeof d === "string") {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  if (d.toDate) return d.toDate(); // firebase Timestamp
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};
const formatDateSafe = (d) => {
  const date = parseDateSafe(d);
  return date ? date.toLocaleDateString() : "-";
};

// --- helper màu nền theo loại ---
const getBackgroundColor = (type) => {
  switch(type) {
    case "Cái": return "#ffe4e6";       // hồng nhạt
    case "Đực": return "#d0f0fd";       // xanh nhạt
    case "Hậu bị cái": return "#e9d5ff"; // tím nhạt
    case "Hậu bị đực": return "#fffacd"; // vàng nhạt
    case "Con cái":
    case "Con đực": return "#ffedd5";   // cam nhạt
    case "Thịt": return "#e5e7eb";      // xám nhạt
    default: return "#f9fafb";
  }
};

// --- helper màu chữ theo loại ---
const getTextColor = (type) => {
  switch(type) {
    case "Cái": return "#9b1c31";       
    case "Đực": return "#036666";       
    case "Hậu bị cái": return "#6b21a8"; 
    case "Hậu bị đực": return "#a16207"; 
    case "Con cái":
    case "Con đực": return "#b45309";   
    case "Thịt": return "#374151";      
    default: return "#111827";
  }
};

export default function QuanLyNongTrai_P2({ cages = [], search = "", handleEdit }) {
  const [expandedIds, setExpandedIds] = React.useState([]);
  const searchNorm = normalize(search.trim());

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const renderCageItem = (cage) => {
    const isExpanded = expandedIds.includes(cage.id);
    const matingDate = formatDateSafe(cage.matingDate);
    const separateDate = formatDateSafe(cage.separateDate);
    const birthDate = formatDateSafe(cage.birthDate);
    const weaningDate = formatDateSafe(cage.weaningDate);
    const note = cage.note || "-";
    const weight = cage.weight || "-";
    const childrenWeights = cage.childrenWeights || [];
    const numChild = cage.numChild || 0;
    const numAlive = cage.numAlive || 0;

    const isFemaleCage = cage.type === "Cái";
    const isSubFemaleCage = cage.type === "Hậu bị cái";

    return (
      <TouchableOpacity
        key={cage.id}
        onPress={() => toggleExpand(cage.id)}
        style={{
          padding: 14,
          backgroundColor: getBackgroundColor(cage.type),
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#d1d5db",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 6,
        }}
      >
        {/* Thẻ cơ bản: tên + cân nặng */}
        <Text style={{ fontWeight: "bold", fontSize: 17, color: getTextColor(cage.type) }}>
          {cage.name || "-"}
        </Text>
        <Text style={{ fontSize: 15, color: "#111827", marginBottom: 4 }}>
          Cân nặng: {weight}
        </Text>

        {/* Nếu mở rộng, hiển thị chi tiết */}
        {isExpanded && (
          <View style={{ marginTop: 6 }}>
            {cage.matingDate && <Text>Ngày phối: {matingDate}</Text>}
            {cage.separateDate && <Text>Ngày tách phối: {separateDate}</Text>}
            {isFemaleCage && cage.birthDate && <Text>Ngày sinh: {birthDate}</Text>}
            {cage.weaningDate && <Text>Ngày tách con: {weaningDate}</Text>}
            {childrenWeights.length > 0 && <Text>Cân nặng từng con: {childrenWeights.join(", ")}</Text>}

            {/* Chỉ chuồng cái mới hiển thị số lượng con và sống */}
            {isFemaleCage && (
              <>
                <Text>Số lượng con: {numChild}</Text>
                <Text>Số lượng sống: {numAlive}</Text>
              </>
            )}

            <Text>Ghi chú: {note}</Text>

            <TouchableOpacity
              onPress={() => handleEdit(cage)}
              style={{ backgroundColor: "#3b82f6", padding: 6, borderRadius: 6, marginTop: 8 }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>Sửa</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const columnsToRender = COLUMNS.map(col => ({
    ...col,
    data: cages
      .filter(c => col.types.includes(c.type) && (!search || normalize(c.name || "").includes(searchNorm)))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "vi"))
  }));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {columnsToRender.map(col => (
          <View key={col.key} style={{ width: 180, marginRight: 14 }}>
            <Text style={{ fontWeight:"bold", textAlign:"center", marginBottom:10, fontSize:16 }}>
              {col.label}
            </Text>
            {col.data.map(cage => renderCageItem(cage))}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

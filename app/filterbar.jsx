// src/components/Dashboard/FilterBar.jsx
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  onlyUnderweight,
  setOnlyUnderweight,
  selectedCage,
  setShowFilter,
  setFilterType,
}) {
  const handleUpdateWeight = async () => {
    if (!selectedCage) {
      alert("Vui lòng chọn chuồng trước khi cập nhật cân nặng!");
      return;
    }
    const newWeight = prompt(
      `Nhập cân nặng mới cho chuồng ${selectedCage.code} (kg):`,
      selectedCage.weight || ""
    );
    if (!newWeight) return;

    const cageRef = doc(db, "cages", selectedCage.__docId);
    await updateDoc(cageRef, { weight: parseFloat(newWeight) });

    alert("Đã cập nhật cân nặng!");
  };

  return (
    <div className="mb-3 p-3 bg-white border rounded">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Tìm mã chuồng / ghi chú..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      <div className="mt-2 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyUnderweight}
            onChange={(e) => setOnlyUnderweight(e.target.checked)}
          />
          <span>Chỉ chuồng dưới 1.3kg</span>
        </label>
        <button
          onClick={handleUpdateWeight}
          className="px-2 py-1 bg-yellow-500 text-white rounded"
        >
          Cập nhật cân nặng
        </button>
        <button
          onClick={() => {
            setSearchTerm("");
            setFilterType("");
            setOnlyUnderweight(false);
            setShowFilter(false);
          }}
          className="px-2 py-1 border rounded"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}

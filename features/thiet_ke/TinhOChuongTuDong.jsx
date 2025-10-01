// features/thiet_ke/TinhOChuongTuDong.js

/**
 * Tạo ra danh sách ô chuồng cho 1 khu (chuồng cái, chuồng đực, lối đi...).
 * Giữ nguyên logic cũ, thêm các trường để đồng bộ với BanVe2DScreenFull và thiet_ke
 */
 export function tinhOChuongTuDong({
  totalLength,   // tổng chiều dài khu
  length,        // chiều dài 1 ô (m)
  width,         // chiều rộng 1 ô (m)
  cols,          // số cột
  lane = 0.5,    // khoảng cách giữa các ô (m)
  type = "cai",  // loại khu: cai, duc, loi_di, tuong, tapthe
  rowType = "đơn", // đơn hoặc đôi
  offsetX = 0,   // dịch sang ngang
  offsetY = 0,   // dịch xuống
  model = "chung" // model hiện tại
}) {
  if (!totalLength || !length || !width || !cols) {
    throw new Error("Bạn phải cung cấp totalLength, length, width, cols");
  }

  const rows = Math.floor((totalLength + lane) / (length + lane));
  const cells = [];
  const cellArea = length * width; // diện tích m²

  for (let r = 0; r < rows; r++) {
    const y = offsetY + r * (length + lane);
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (width + lane);

      cells.push({
        id: `${type}-${rowType}-${r}-${c}`,
        key: `${type}-${rowType}-${r}-${c}`,
        x,
        y,
        width,
        height: length,
        type,
        rowType,
        row: r,
        col: c,
        label: `${width}x${length}`,
        area: cellArea,
        model,
        fillColor:
          type === "cai"
            ? "#f4b400" // vàng
            : type === "duc"
            ? "#0f9d58" // xanh
            : type === "tập thể"
            ? "#03a9f4"
            : type === "loi_di"
            ? "#ffffff"
            : "#cccccc",
      });
    }
  }

  const totalCells = rows * cols;
  const totalArea = totalCells * cellArea;

  return {
    rows,
    cols,
    totalCells,
    totalArea,
    type,
    rowType,
    cells,
    length,
    width,
    lane,
    model,
  };
}

/**
 * Tính toàn bộ sơ đồ chuồng theo mô hình và loại chuồng chi tiết
 * selectedTypes: mảng loại chuồng từ BanVe2DScreenFull
 */
export function tinhSoDoChuong({ 
  model = "chung", 
  totalLength = 5, 
  selectedTypes = [] 
}) {
  let offsetX = 0;
  const blocks = [];

  // Lặp qua selectedTypes, tạo từng block theo thứ tự
  selectedTypes.forEach((t) => {
    const cols = Math.floor(5 / t.width) || 1; // ví dụ: chia tổngWidth mặc định 5m / width của loại
    const block = tinhOChuongTuDong({
      totalLength,
      length: t.length,
      width: t.width,
      cols,
      lane: 0.5,
      type: t.type,
      rowType: t.rowType,
      offsetX,
      model,
    });
    blocks.push(block);
    offsetX += t.width * cols + 0.5; // cộng lối đi
  });

  // Nếu selectedTypes rỗng, fallback mô hình mặc định
  if (blocks.length === 0) {
    if (model === "chung") {
      // Chuồng cái trái
      blocks.push(
        tinhOChuongTuDong({ totalLength, length: 0.35, width: 0.6, cols: 1, type: "cai", offsetX, rowType: "đơn", model })
      );
      offsetX += 0.6 + 0.5;
      // Chuồng đực giữa
      blocks.push(
        tinhOChuongTuDong({ totalLength, length: 0.5, width: 0.6, cols: 2, type: "đực", offsetX, rowType: "đơn", model })
      );
    } else if (model === "tiet_kiem") {
      // Chuồng cái trái
      blocks.push(
        tinhOChuongTuDong({ totalLength, length: 0.35, width: 0.3, cols: 2, type: "cai", offsetX, rowType: "đơn", model })
      );
    }
  }

  // Gộp tất cả cells
  const allCells = blocks.flatMap((b) => b.cells);
  const tongO = blocks.reduce((sum, b) => sum + b.totalCells, 0);
  const tongDienTich = blocks.reduce((sum, b) => sum + b.totalArea, 0);

  return {
    model,
    tongO,
    tongDienTich,
    blocks,
    cells: allCells,
  };
}

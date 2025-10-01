// features/thiet_ke/TinhToanThietKe.js

export function tinhToanThietKe(design) {
  try {
    const {
      totalLength,
      totalWidth,
      length,
      width,
      lane,
      type,
    } = design;

    if (
      totalLength === undefined ||
      totalWidth === undefined ||
      length === undefined ||
      width === undefined ||
      lane === undefined
    ) {
      throw new Error("Bạn phải cung cấp totalLength, totalWidth, length, width, lane");
    }

    // 🔹 Số chuồng theo chiều dài
    const soOTheoChieuDai = Math.floor(totalLength / (parseFloat(length) + parseFloat(lane)));

    // 🔹 Số chuồng theo chiều ngang
    const soOTheoChieuNgang = Math.floor(totalWidth / (parseFloat(width) + parseFloat(lane)));

    // 🔹 Tổng số ô chuồng
    const tongSoO = soOTheoChieuDai * soOTheoChieuNgang;

    // 🔹 Diện tích tổng khu vực
    const dienTich = totalLength * totalWidth;

    return {
      ...design,
      soOTheoChieuDai,
      soOTheoChieuNgang,
      tongSoO,
      dienTich,
    };
  } catch (error) {
    console.error("Lỗi tính toán thiết kế:", error);
    throw error;
  }
}

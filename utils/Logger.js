// utils/Logger.js

/**
 * Ghi log an toàn, tránh crash khi console không tồn tại
 * @param {("log"|"info"|"warn"|"error")} level - Loại log (mặc định: "log")
 * @param  {...any} args - Nội dung cần log
 */
 export const safeLog = (level = "log", ...args) => {
  try {
    if (typeof console !== "undefined") {
      if (typeof console[level] === "function") {
        console[level](...args);
      } else if (typeof console.log === "function") {
        console.log(...args);
      }
    }
  } catch (e) {
    // Nếu log bị lỗi, fallback ra error để dễ debug
    try {
      console.error("safeLog error:", e);
    } catch {
      // Không làm gì thêm để tránh crash vòng lặp
    }
  }
};

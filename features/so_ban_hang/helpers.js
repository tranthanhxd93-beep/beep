export function formatVNDShort(num) {
    if (!num) return "0";
    if (num >= 1_000_000) {
      const trieu = Math.floor(num / 1_000_000);
      const ngan = Math.floor((num % 1_000_000) / 1000);
      return ngan > 0 ? `${trieu}tr${ngan}` : `${trieu}tr`;
    }
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}k`;
    }
    return num.toString();
  }
  
  export function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
  
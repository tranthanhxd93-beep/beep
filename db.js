// src/firebase/db.js
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Lay danh sach document cua mot collection
 * @param {string} tenCollection - ten collection trong Firestore
 * @returns {Array} danh sach document
 */
export const layDanhSach = async (tenCollection) => {
  try {
    const querySnapshot = await getDocs(collection(db, tenCollection));
    const temp = [];
    querySnapshot.forEach((doc) => temp.push({ id: doc.id, ...doc.data() }));
    return temp;
  } catch (error) {
    console.log("Loi lay danh sach:", error);
    return [];
  }
};

/**
 * Them document moi vao collection
 * @param {string} tenCollection - ten collection trong Firestore
 * @param {object} duLieu - du lieu document
 * @returns {string} id cua document moi
 */
export const themDocument = async (tenCollection, duLieu) => {
  try {
    const docRef = await addDoc(collection(db, tenCollection), duLieu);
    return docRef.id;
  } catch (error) {
    console.log("Loi them document:", error);
    return null;
  }
};

/**
 * Cap nhat document trong collection
 * @param {string} tenCollection - ten collection
 * @param {string} id - id cua document
 * @param {object} duLieu - du lieu cap nhat
 */
export const capNhatDocument = async (tenCollection, id, duLieu) => {
  try {
    await updateDoc(doc(db, tenCollection, id), duLieu);
  } catch (error) {
    console.log("Loi cap nhat document:", error);
  }
};

/**
 * Xoa document trong collection
 * @param {string} tenCollection - ten collection
 * @param {string} id - id cua document can xoa
 */
export const xoaDocument = async (tenCollection, id) => {
  try {
    await deleteDoc(doc(db, tenCollection, id));
  } catch (error) {
    console.log("Loi xoa document:", error);
  }
};

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Modal, Portal } from "react-native-paper";
import { auth, db } from "../../firebase";

const TYPE_MAP = { "Cái":"C","Đực":"Đ","Hậu bị cái":"HC","Hậu bị đực":"HD","Con cái":"CC","Con đực":"CD","Thịt":"T" };
const TYPES = ["Cái","Đực","Hậu bị cái","Hậu bị đực","Con cái","Con đực","Thịt"];

export default function ModalThemChuong({ isOpen, onClose, cages=[], editingCage=null, parentId=null }) {
  const userId = auth.currentUser.uid;

  // Tách state riêng cho các ô nhập để tránh mất focus
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [matingDate, setMatingDate] = useState("");
  const [separateDate, setSeparateDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weaningDate, setWeaningDate] = useState("");
  const [numChild, setNumChild] = useState("");
  const [numAlive, setNumAlive] = useState("");
  const [childrenWeights, setChildrenWeights] = useState([]);
  const [numChildField, setNumChildField] = useState("");

  const [showPicker,setShowPicker] = useState(false);
  const [pickerField,setPickerField] = useState("");

  // Reset state khi mở modal
  useEffect(() => {
    if(!isOpen){
      setType(""); setName(""); setWeight(""); setNote("");
      setMatingDate(""); setSeparateDate(""); setBirthDate(""); setWeaningDate("");
      setNumChild(""); setNumAlive(""); setChildrenWeights([]); setNumChildField("");
      return;
    }
    if(editingCage){
      setType(editingCage.type || "");
      setName(editingCage.name || "");
      setWeight(editingCage.weight || "");
      setNote(editingCage.note || "");
      setMatingDate(editingCage.matingDate || "");
      setSeparateDate(editingCage.separateDate || "");
      setBirthDate(editingCage.birthDate || "");
      setWeaningDate(editingCage.weaningDate || "");
      setNumChild(editingCage.numChild?.toString()||"");
      setNumAlive(editingCage.numAlive?.toString()||"");
      setChildrenWeights(editingCage.childrenWeights||[]);
      setNumChildField(editingCage.numChild?.toString()||"");
    }
  }, [isOpen, editingCage]);

  // Tự động đặt tên chuồng dựa vào type
  useEffect(() => {
    if(!type) return;
    const usedNumbers = cages.filter(c=>c.type===type && c.id!==editingCage?.id)
      .map(c=>parseInt(c.name?.match(/\d+$/)?.[0]||0)).sort((a,b)=>a-b);
    let nextNum=1; for(const n of usedNumbers){ if(n===nextNum) nextNum++; else break; }
    setName(`${TYPE_MAP[type]||"X"}${nextNum}`);
  }, [type, cages, editingCage]);

  // Tự động tính ngày sinh và tách con dựa vào separateDate nếu là Cái
  useEffect(() => {
    if(type==="Cái" && separateDate){
      const addDays = (d,n) => { let x = new Date(d); x.setDate(x.getDate()+n); return x; };
      const bStart = addDays(separateDate,40);
      const bEnd = addDays(separateDate,45);
      setBirthDate(`${bStart.toLocaleDateString()} - ${bEnd.toLocaleDateString()}`);
      const wStart = addDays(bStart,35);
      const wEnd = addDays(bEnd,45);
      setWeaningDate(`${wStart.toLocaleDateString()} - ${wEnd.toLocaleDateString()}`);
    }
  }, [type, separateDate]);

  const handleSave = async () => {
    if(!type) return Alert.alert("Thông báo","Chọn loại dúi!");
    const data = {
      type, name, weight, note,
      childrenWeights,
      numChild: parseInt(numChild)||0,
      numAlive: parseInt(numAlive)||0,
      matingDate: matingDate ? new Date(matingDate).toISOString() : null,
      separateDate: separateDate ? new Date(separateDate).toISOString() : null,
      birthDate: birthDate ? birthDate : null, // giữ định dạng chuỗi dự báo
      weaningDate: weaningDate ? weaningDate : null,
      createdAt: editingCage?.createdAt||new Date()
    };
    try{
      if(editingCage?.id){
        const ref = parentId 
          ? doc(db,"users",userId,"cages",parentId,"subCages",editingCage.id)
          : doc(db,"users",userId,"cages",editingCage.id);
        await updateDoc(ref,data);
      } else {
        const coll = parentId 
          ? collection(db,"users",userId,"cages",parentId,"subCages")
          : collection(db,"users",userId,"cages");
        await addDoc(coll,data);
      }
      onClose();
    } catch(e){ console.error(e); Alert.alert("Lỗi","Không thể lưu chuồng!"); }
  };

  const openPicker = (field)=>{ setPickerField(field); setShowPicker(true); };
  const handleConfirm = date=>{
    const iso = date.toISOString();
    if(pickerField==="mating") setMatingDate(iso);
    if(pickerField==="separate") setSeparateDate(iso);
    if(pickerField==="birth") setBirthDate(iso);
    if(pickerField==="weaning") setWeaningDate(iso);
    setShowPicker(false);
  };

  const InputField = ({label,value,onChange,editable=true,extraStyle={},multiline=false,keyboardType}) => (
    <>
      <Text style={{fontWeight:"600",marginBottom:4}}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} editable={editable} multiline={multiline} keyboardType={keyboardType}
        style={{borderWidth:1,borderColor:"#d1d5db",borderRadius:6,padding:10,marginBottom:12,...extraStyle}}/>
    </>
  );

  if(!isOpen) return null;
  return (
    <Portal>
      <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={{backgroundColor:"white",borderRadius:8,padding:16,marginHorizontal:20,maxHeight:"90%"}}>
        <ScrollView contentContainerStyle={{paddingBottom:20}}>
          <TouchableOpacity onPress={onClose} style={{alignSelf:"flex-end",marginBottom:8}}>
            <Text style={{fontSize:20}}>✕</Text>
          </TouchableOpacity>
          <Text style={{fontSize:18,fontWeight:"bold",textAlign:"center",marginBottom:12}}>
            {editingCage?"Sửa chuồng":"Thêm Chuồng"}
          </Text>

          <Text style={{fontWeight:"600",marginBottom:4}}>Loại dúi</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:12}}>
            {TYPES.map(t=>(
              <TouchableOpacity key={t} onPress={()=>setType(t)}
                style={{padding:6,borderWidth:1,borderColor:"#d1d5db",borderRadius:6,marginRight:6,marginBottom:6,backgroundColor:type===t?"#3b82f6":"white"}}>
                <Text>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField label="Tên chuồng" value={name} editable={false} extraStyle={{backgroundColor:"#e5e7eb"}}/>
          <InputField label="Cân nặng (kg)" value={weight} onChange={setWeight} keyboardType="numeric"/>
          <InputField label="Ghi chú" value={note} onChange={setNote} multiline/>

          {(type==="Cái"||type==="Đực") && ["mating","separate"].map(f=>{
            const label = f==="mating" ? "Ngày phối" : "Ngày tách phối";
            const value = f==="mating" ? matingDate : separateDate;
            return (
              <TouchableOpacity key={f} onPress={()=>openPicker(f)} activeOpacity={0.8}>
                <InputField label={label} value={value ? new Date(value).toLocaleDateString() : ""} editable={false} extraStyle={{backgroundColor:"#e5e7eb"}}/>
              </TouchableOpacity>
            )
          })}

          {type==="Cái" && <>
            <InputField label="Ngày sinh (dự báo)" value={birthDate} editable={false} extraStyle={{backgroundColor:"#e5e7eb"}}/>
            <InputField label="Ngày tách con (dự báo)" value={weaningDate} editable={false} extraStyle={{backgroundColor:"#e5e7eb"}}/>
            <InputField label="Số lượng con" value={numChild} onChange={setNumChild} keyboardType="numeric"/>
            <InputField label="Số lượng sống" value={numAlive} onChange={setNumAlive} keyboardType="numeric"/>
          </>}

          {["Hậu bị đực","Hậu bị cái","Con đực","Con cái","Thịt"].includes(type) && <>
            <InputField label="Số lượng" value={numChildField} onChange={v=>{
              setNumChildField(v);
              const n = parseInt(v)||0;
              if(childrenWeights.length < n) setChildrenWeights([...childrenWeights,...Array(n-childrenWeights.length).fill("")]);
              else if(childrenWeights.length > n) setChildrenWeights(childrenWeights.slice(0,n));
            }} keyboardType="numeric"/>
            <Text style={{fontWeight:"600",marginBottom:4}}>Cân nặng từng con (kg)</Text>
            {childrenWeights.map((w,i)=>(
              <TextInput
                key={i}
                value={w}
                onChangeText={val=>{ const arr=[...childrenWeights]; arr[i]=val; setChildrenWeights(arr); }}
                keyboardType="numeric"
                placeholder={`Con ${i+1}`}
                style={{borderWidth:1,borderColor:"#d1d5db",borderRadius:6,padding:10,marginBottom:8}}
              />
            ))}
          </>}

          <View style={{marginVertical:8}}>
            <Button title={editingCage?"Cập nhật":"Lưu"} onPress={handleSave} color="#3b82f6"/>
          </View>

          <DateTimePickerModal isVisible={showPicker} mode="date" onConfirm={handleConfirm} onCancel={()=>setShowPicker(false)}/>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  Image,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import {
  Car,
  CircleDollarSign,
  Search,
  Menu,
  Square,
  MoreVertical,
  History,
  Wrench,
  X,
  TrendingUp,
  Tag,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Settings,
  LogOut,
  Play,
  Plus,
  Trash2,
  QrCode,
  Activity,
  FileText,
  Check,
} from "lucide-react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ref,
  onValue,
  update,
  push,
  set,
  remove,
  query,
  orderByChild,
} from "firebase/database";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";

const CAR_TYPES = ["Xe F", "Xe máy mini", "Xe phát sáng", "Minion"];

export default function AppScreen() {
  // Fix lỗi Hydration (Error 418) trên Web
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [activeTab, setActiveTab] = useState("cars");
  const [currentTime, setCurrentTime] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [cars, setCars] = useState<any[]>([]);
  const [now, setNow] = useState(new Date().getTime());

  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  const [revenueFilter, setRevenueFilter] = useState("Tuần này");
  const [isRevenueFilterOpen, setIsRevenueFilterOpen] = useState(false);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [newCarId, setNewCarId] = useState("");
  const [newCarType, setNewCarType] = useState(CAR_TYPES[0]);

  const [isRentCarOpen, setIsRentCarOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [rentDuration, setRentDuration] = useState("30");

  const [isCarOptionsOpen, setIsCarOptionsOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isSwitchCarModalOpen, setIsSwitchCarModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isPostpaidPayment, setIsPostpaidPayment] = useState(false);

  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);

  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isAutoLockOn, setIsAutoLockOn] = useState(false);
  const [isBatterySaver, setIsBatterySaver] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [switchCarSearchQuery, setSwitchCarSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setNow(date.getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("flick_email");
        const savedPass = await AsyncStorage.getItem("flick_pass");
        if (savedEmail && savedPass) {
          setEmail(savedEmail);
          setPassword(savedPass);
          setRememberMe(true);
        }
      } catch {}
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const carsRef = ref(db, "cars");
    const unsubscribeCars = onValue(carsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawCars = Object.keys(data)
          .map((key) => ({ dbKey: key, ...data[key] }))
          .filter((car) => car.id !== undefined);
        const statusPriority: any = {
          timeout: 1,
          idle: 2,
          running: 3,
          maintenance: 4,
        };
        setCars(
          rawCars.sort((a: any, b: any) => {
            const priorityA = statusPriority[a.status] || 5;
            const priorityB = statusPriority[b.status] || 5;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return a.id.localeCompare(b.id);
          }),
        );
      } else setCars([]);
    });

    const transQuery = query(
      ref(db, "transactions"),
      orderByChild("timestamp"),
    );
    const unsubscribeTrans = onValue(transQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawTrans = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setHistory(rawTrans.sort((a, b) => b.timestamp - a.timestamp));
      } else setHistory([]);
    });

    return () => {
      unsubscribeCars();
      unsubscribeTrans();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
    const currentDate = new Date();

    let todayTotal = 0;
    history.forEach((t) => {
      if (t.timestamp >= todayDateObj.getTime()) todayTotal += t.amount;
    });
    setDailyRevenue(todayTotal);

    let cLabels: string[] = [];
    let cData: number[] = [];

    if (revenueFilter === "Tuần này") {
      cLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      cData = [0, 0, 0, 0, 0, 0, 0];
      const startOfWeek = new Date(todayDateObj);
      const dayOfWeek = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);

      history.forEach((t) => {
        if (t.timestamp >= startOfWeek.getTime()) {
          const tDate = new Date(t.timestamp);
          const tDay = tDate.getDay() || 7;
          cData[tDay - 1] += t.amount;
        }
      });
    } else if (revenueFilter === "Tháng này") {
      cLabels = ["W1", "W2", "W3", "W4", "W5"];
      cData = [0, 0, 0, 0, 0];
      history.forEach((t) => {
        const tDate = new Date(t.timestamp);
        if (
          tDate.getMonth() === currentDate.getMonth() &&
          tDate.getFullYear() === currentDate.getFullYear()
        ) {
          const weekIndex = Math.floor((tDate.getDate() - 1) / 7);
          if (weekIndex < 5) cData[weekIndex] += t.amount;
        }
      });
    } else if (revenueFilter === "Năm nay") {
      cLabels = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];
      cData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      history.forEach((t) => {
        const tDate = new Date(t.timestamp);
        if (tDate.getFullYear() === currentDate.getFullYear()) {
          cData[tDate.getMonth()] += t.amount;
        }
      });
    }

    setChartLabels(cLabels);
    setChartData(cData);
  }, [history, revenueFilter]);

  useEffect(() => {
    cars.forEach((car) => {
      if (car.status === "running") {
        const endTime = car.startTime + car.duration * 60000;
        if (now >= endTime)
          update(ref(db, `cars/${car.dbKey}`), { status: "timeout" });
      }
    });
  }, [now, cars]);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin!");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoggedIn(true);

      // Nếu tích chọn lưu thì cất vào két, không thì xóa đi
      if (rememberMe) {
        await AsyncStorage.setItem("flick_email", email);
        await AsyncStorage.setItem("flick_pass", password);
      } else {
        await AsyncStorage.removeItem("flick_email");
        await AsyncStorage.removeItem("flick_pass");
      }
    } catch {
      Alert.alert("Lỗi", "Sai tài khoản hoặc mật khẩu!");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setIsMenuOpen(false);
    });
  };
  const openRentModal = (car: any) => {
    setSelectedCar(car);
    setCustomerName("");
    setRentDuration("30");
    setIsRentCarOpen(true);
  };

  const handleContinueToPayment = () => {
    if (!customerName.trim() || !rentDuration.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin!");
    const durationNum = parseInt(rentDuration);
    if (isNaN(durationNum) || durationNum <= 0)
      return Alert.alert("Lỗi", "Thời gian thuê phải lớn hơn 0!");
    const amount = Math.round((durationNum / 30) * 50000);
    setCurrentAmount(amount);
    setIsPostpaidPayment(false); // Đánh dấu là Trả Trước
    setIsRentCarOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePayLater = () => {
    if (!customerName.trim() || !rentDuration.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin!");
    const durationNum = parseInt(rentDuration);
    if (isNaN(durationNum) || durationNum <= 0)
      return Alert.alert("Lỗi", "Thời gian thuê phải lớn hơn 0!");

    update(ref(db, `cars/${selectedCar.dbKey}`), {
      status: "running",
      customer: customerName,
      startTime: new Date().getTime(),
      duration: durationNum,
      isPaid: false, // 🔴 Đánh dấu là chưa trả tiền
    });
    setIsRentCarOpen(false);
    Alert.alert("Thành công", `Đã giao xe cho khách (Trả sau).`);
  };

  const handleConfirmPayment = () => {
    if (!selectedCar) return;

    if (isPostpaidPayment) {
      // 🟢 TRẢ SAU: Lúc thu xe mới chốt giao dịch & cất xe
      push(ref(db, "transactions"), {
        carId: selectedCar.id,
        carType: selectedCar.type || "Xe",
        customer: selectedCar.customer,
        amount: currentAmount,
        duration: selectedCar.duration,
        timestamp: new Date().getTime(),
      });
      update(ref(db, `cars/${selectedCar.dbKey}`), {
        status: "idle",
        customer: "",
        startTime: 0,
        duration: 0,
        isPaid: true,
      });
      Alert.alert("Thành công", `Đã thu ${currentAmount.toLocaleString("vi-VN")}đ và cất xe.`);
    } else {
      // 🟢 TRẢ TRƯỚC: Thanh toán xong giao xe luôn
      const durationNum = parseInt(rentDuration);
      update(ref(db, `cars/${selectedCar.dbKey}`), {
        status: "running",
        customer: customerName,
        startTime: new Date().getTime(),
        duration: durationNum,
        isPaid: true, // Đã thanh toán
      });
      push(ref(db, "transactions"), {
        carId: selectedCar.id,
        carType: selectedCar.type || "Xe",
        customer: customerName,
        amount: currentAmount,
        duration: durationNum,
        timestamp: new Date().getTime(),
      });
      Alert.alert("Thành công", `Khách đã thanh toán trước ${currentAmount.toLocaleString("vi-VN")}đ.`);
    }
    setIsPaymentModalOpen(false);
    setIsPostpaidPayment(false);
  };

  const handleKetThuc = (car: any) => {
    if (car.isPaid === false) {
      // Bấm thu xe mà chưa trả tiền -> Bật bảng mã QR thu tiền
      setSelectedCar(car);
      setCurrentAmount(Math.round((car.duration / 30) * 50000));
      setIsPostpaidPayment(true);
      setIsPaymentModalOpen(true);
    } else {
      // Trả trước rồi -> Bấm phát cất xe luôn
      update(ref(db, `cars/${car.dbKey}`), {
        status: "idle",
        customer: "",
        startTime: 0,
        duration: 0,
        isPaid: true,
      });
      Alert.alert("Đã thu xe", `Đã cất xe ${car.id} gọn gàng!`);
    }
  };

  const handleThemGio = (car: any) => {
    update(ref(db, `cars/${car.dbKey}`), { duration: car.duration + 30 });
    
    if (car.isPaid) {
      Alert.alert(
        "Thêm giờ thành công", 
        `Đã cộng 30 phút cho xe ${car.id}.\n\n⚠️ LƯU Ý: Xe này là khách TRẢ TRƯỚC. Hệ thống đã chốt đơn 50k ban đầu, sếp nhớ THU TIỀN MẶT thêm của khách nhé!`
      );
    } else {
      Alert.alert("Thêm giờ thành công", `Đã cộng 30 phút cho xe ${car.id}. Tiền sẽ tự cộng dồn lúc sếp bấm Thu xe.`);
    }
  };

  const handleAddCar = () => {
    if (!newCarId.trim()) return Alert.alert("Lỗi", "Vui lòng nhập biển số!");
    const uniqueKey = `${newCarType.replace(/\s+/g, "")}_${newCarId}`;
    const isExist = cars.find(
      (c) => c.dbKey.toLowerCase() === uniqueKey.toLowerCase(),
    );
    if (isExist) return Alert.alert("Lỗi", `Đã có xe này trong bãi!`);
    set(ref(db, `cars/${uniqueKey}`), {
      id: newCarId,
      type: newCarType,
      status: "idle",
      customer: "",
      startTime: 0,
      duration: 0,
    });
    setIsAddCarOpen(false);
    setNewCarId("");
  };

  const handleConfirmSwitchCar = (targetCar: any) => {
    if (!selectedCar || !targetCar) return;

    // 1. Chuyển ngay thông tin sang xe mới
    update(ref(db, `cars/${targetCar.dbKey}`), {
      status: selectedCar.status,
      customer: selectedCar.customer,
      startTime: selectedCar.startTime,
      duration: selectedCar.duration,
      isPaid: selectedCar.isPaid,
    });

    // 2. Dọn sạch xe cũ
    update(ref(db, `cars/${selectedCar.dbKey}`), {
      status: "idle",
      customer: "",
      startTime: 0,
      duration: 0,
      isPaid: true,
    });

    // 3. Đóng bảng lại luôn
    setIsSwitchCarModalOpen(false);
    setSwitchCarSearchQuery("");
  };

  const handleBaoTri = (dbKey: string) => {
    if (dbKey) {
      update(ref(db, `cars/${dbKey}`), {
        status: "maintenance",
        customer: "Đang sửa chữa",
        startTime: 0,
        duration: 0,
      });
      setIsCarOptionsOpen(false);
    }
  };
  const handleSuaXong = (dbKey: string) => {
    if (dbKey) {
      update(ref(db, `cars/${dbKey}`), {
        status: "idle",
        customer: "",
        startTime: 0,
        duration: 0,
      });
      setIsCarOptionsOpen(false);
    }
  };
  const handleXoaXe = (dbKey: string) => {
    if (dbKey) {
      Alert.alert("Cảnh báo", `Xóa vĩnh viễn xe này?`, [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            remove(ref(db, `cars/${dbKey}`));
            setIsCarOptionsOpen(false);
          },
        },
      ]);
    }
  };

  const maintenanceCars = cars.filter((c) => c.status === "maintenance");

  const displayCars = cars.map((car) => {
    if (car.status === "running" || car.status === "timeout") {
      const endTime = car.startTime + car.duration * 60000;
      const timeDiff = endTime - now;
      if (timeDiff <= 0) {
        const overTime = Math.abs(timeDiff);
        const m = Math.floor((overTime % 3600000) / 60000);
        const s = Math.floor((overTime % 60000) / 1000);
        return {
          ...car,
          displayTime: `-${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
          currentProgress: 100,
        };
      } else {
        const m = Math.floor((timeDiff % 3600000) / 60000);
        const s = Math.floor((timeDiff % 60000) / 1000);
        const progress = 100 - (timeDiff / (car.duration * 60000)) * 100;
        return {
          ...car,
          displayTime: `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
          currentProgress: progress,
        };
      }
    }
    return car;
  });

  const filteredCars = displayCars.filter((car) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      car.id.toLowerCase().includes(lowerQuery) ||
      (car.customer && car.customer.toLowerCase().includes(lowerQuery)) ||
      (car.type && car.type.toLowerCase().includes(lowerQuery))
    );
  });

  const filteredHistory = history.filter((item) => {
    if (!historySearchQuery) return true;
    const lowerQuery = historySearchQuery.toLowerCase();
    const d = new Date(item.timestamp);
    const timeStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    return (
      (item.carId && item.carId.toLowerCase().includes(lowerQuery)) ||
      (item.customer && item.customer.toLowerCase().includes(lowerQuery)) ||
      (item.carType && item.carType.toLowerCase().includes(lowerQuery)) ||
      timeStr.includes(lowerQuery)
    );
  });

  const todayDateObj = new Date();
  todayDateObj.setHours(0, 0, 0, 0);
  const todayTrans = history.filter(
    (t) => t.timestamp >= todayDateObj.getTime(),
  );
  const todayTrips = todayTrans.length;
  const avgDuration =
    todayTrips > 0
      ? Math.round(
          todayTrans.reduce((acc, t) => acc + t.duration, 0) / todayTrips,
        )
      : 0;
  const runningCount = cars.filter(
    (c) => c.status === "running" || c.status === "timeout",
  ).length;
  const idleCount = cars.filter((c) => c.status === "idle").length;
  const activePercent =
    cars.length > 0 ? Math.round((runningCount / cars.length) * 100) : 0;
  const maxChartValue = Math.max(...chartData, 1);

  const formatMoneyShort = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(".0", "") + "Tr";
    if (v >= 1000) return (v / 1000).toFixed(0) + "k";
    return v;
  };

  // 🔴 Màn hình chờ để tránh lỗi lệch nhịp Server - Client
  if (!isMounted) {
    return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
  }

  // 🔴 Ép chiều cao 100vh cho Web để không bị lỏ đáy
  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center px-6">
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100">
          <View className="items-center mb-8">
            <Text className="text-4xl font-black text-[#ff6b00] tracking-wider">
              FLICK
            </Text>
            <Text className="text-sm font-medium text-slate-400 mt-2">
              Hệ thống quản lý xe điện mini
            </Text>
          </View>
          <View className="space-y-4">
            <View>
              <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Tài khoản Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium text-base"
              />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Mật khẩu
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium text-base"
              />
            </View>

            {/* Nút Checkbox Lưu Mật Khẩu */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center gap-2 mt-1 ml-1"
            >
              <View
                className={`w-5 h-5 rounded-md border items-center justify-center ${rememberMe ? "bg-[#ff6b00] border-[#ff6b00]" : "border-slate-300 bg-white"}`}
              >
                {rememberMe && <Check size={14} color="white" />}
              </View>
              <Text className="text-sm font-bold text-slate-500">
                Lưu tài khoản & mật khẩu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              className="bg-[#ff6b00] py-4 rounded-2xl items-center mt-2 shadow-sm"
            >
              <Text className="text-white text-base font-black tracking-wide">
                ĐĂNG NHẬP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={Platform.OS === 'web' ? "flex-1 bg-slate-50 pt-0" : "flex-1 bg-slate-50 pt-12"}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View className="bg-white/95 px-5 py-3 flex-row justify-between items-center z-50">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-full border ${isMenuOpen ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100"}`}
          >
            {isMenuOpen ? (
              <X size={20} color="#ff6b00" />
            ) : (
              <Menu size={20} color="#334155" />
            )}
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black text-slate-900 leading-tight tracking-wide">
              HỆ THỐNG QUẢN LÝ XE
            </Text>
            <Text className="text-[10px] font-black text-[#10b981] uppercase tracking-widest mt-0.5">
              Trực tuyến
            </Text>
          </View>
        </View>
        <View className="bg-slate-100 px-3.5 py-1.5 rounded-full">
          <Text className="text-sm font-black text-slate-700">
            {currentTime || "00:00"}
          </Text>
        </View>
      </View>

      {/* Menu & Modals Giữ Nguyên */}
      {isMenuOpen && (
        <View className="absolute top-0 left-0 right-0 bottom-0 z-40 mt-[88px]">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-transparent"
          />
          <View className="absolute top-2 left-5 w-[250px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-3 px-2 z-50">
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                setIsHistoryOpen(true);
              }}
              className="flex-row items-center gap-3.5 py-3.5 px-4 border-b border-slate-50"
            >
              <History size={18} color="#475569" />
              <Text className="font-bold text-slate-700 text-[15px]">
                Lịch sử giao dịch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                setIsPricingOpen(true);
              }}
              className="flex-row items-center gap-3.5 py-3.5 px-4 border-b border-slate-50"
            >
              <Tag size={18} color="#475569" />
              <Text className="font-bold text-slate-700 text-[15px]">
                Quản lý Bảng giá
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                setIsMaintenanceOpen(true);
              }}
              className="flex-row items-center gap-3.5 py-3.5 px-4 border-b border-slate-50"
            >
              <Wrench size={18} color="#475569" />
              <Text className="font-bold text-slate-700 text-[15px]">
                Báo hỏng / Bảo trì
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              className="flex-row items-center gap-3.5 py-3.5 px-4 border-b border-slate-50"
            >
              <Settings size={18} color="#475569" />
              <Text className="font-bold text-slate-700 text-[15px]">
                Cài đặt hệ thống
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center gap-3.5 py-3.5 px-4 mt-1"
            >
              <LogOut size={18} color="#ef4444" />
              <Text className="font-bold text-red-500 text-[15px]">
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={isRevenueFilterOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsRevenueFilterOpen(false)}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-3xl p-6 shadow-2xl"
          >
            <Text className="text-xl font-black text-slate-800 mb-6 text-center">
              Tùy chọn Thống kê
            </Text>
            {["Tuần này", "Tháng này", "Năm nay"].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  setRevenueFilter(filter);
                  setIsRevenueFilterOpen(false);
                }}
                className={`py-4 border-b border-slate-50 items-center ${revenueFilter === filter ? "bg-indigo-50 rounded-2xl border-0" : ""}`}
              >
                <Text
                  className={`text-base font-bold ${revenueFilter === filter ? "text-indigo-600" : "text-slate-600"}`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setIsRevenueFilterOpen(false)}
              className="mt-4 bg-slate-100 py-3.5 rounded-xl items-center"
            >
              <Text className="font-bold text-slate-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={isHistoryOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-end">
          {/* Tấm nền đen tách riêng ra */}
          <Pressable
            onPress={() => setIsHistoryOpen(false)}
            className="absolute top-0 bottom-0 left-0 right-0 bg-black/40"
          />

          {/* Khung trắng bọc nội dung nổi lên trên */}
          <View className="bg-white rounded-t-[2.5rem] h-[85%] px-6 pt-3 pb-8 shadow-2xl z-10">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row items-center gap-2 mb-4">
              <History size={24} color="#ff6b00" />
              <Text className="text-xl font-black text-slate-800">
                Lịch sử giao dịch
              </Text>
            </View>
            <View className="flex-row items-center gap-3 mb-6 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <View style={{ flexShrink: 0 }}>
                <Search size={18} color="#94a3b8" />
              </View>
              <TextInput
                value={historySearchQuery}
                onChangeText={setHistorySearchQuery}
                placeholder="Tìm tên khách, biển số, ngày..."
                className="flex-1 font-medium text-slate-800 text-sm"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredHistory.length === 0 ? (
                <View className="items-center py-10 opacity-50">
                  <FileText size={40} color="#94a3b8" />
                  <Text className="text-center font-bold text-slate-400 mt-4">
                    Không có giao dịch nào
                  </Text>
                </View>
              ) : (
                filteredHistory.map((item) => {
                  const d = new Date(item.timestamp);
                  const timeStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} - ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedTransaction(item);
                        setIsTransactionDetailOpen(true);
                      }}
                      className="flex-row justify-between items-center py-4 border-b border-slate-50 bg-white"
                    >
                      <View className="flex-row items-center gap-4">
                        <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
                          <Text className="text-lg font-black text-slate-700">
                            {item.carId}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className="font-black text-slate-800 text-base"
                            numberOfLines={1}
                          >
                            {item.customer || "Khách hàng"}
                          </Text>
                          <Text className="text-xs text-slate-400 mt-0.5 font-medium">
                            {timeStr}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-black text-[#10b981] text-base">
                          +{item.amount.toLocaleString("vi-VN")}đ
                        </Text>
                        <Text className="text-xs text-slate-400 mt-0.5 font-medium">
                          {item.duration} phút
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsHistoryOpen(false)}
              className="mt-4 bg-slate-100 py-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-slate-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isTransactionDetailOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsTransactionDetailOpen(false)}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-3xl p-6 shadow-2xl"
          >
            <View className="w-14 h-14 bg-indigo-50 rounded-full items-center justify-center mb-4 self-center">
              <FileText size={24} color="#6366f1" />
            </View>
            <Text className="text-xl font-black text-slate-800 mb-6 text-center">
              Chi Tiết Giao Dịch
            </Text>
            <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
              <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
                <Text className="text-sm font-bold text-slate-400">
                  Khách hàng
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {selectedTransaction?.customer || "Không có tên"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
                <Text className="text-sm font-bold text-slate-400">
                  Loại xe
                </Text>
                <Text className="text-sm font-black text-indigo-600 uppercase">
                  {selectedTransaction?.carType || "Xe"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
                <Text className="text-sm font-bold text-slate-400">
                  Biển số / ID
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {selectedTransaction?.carId}
                </Text>
              </View>
              <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
                <Text className="text-sm font-bold text-slate-400">
                  Thời gian thuê
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {selectedTransaction?.duration} phút
                </Text>
              </View>
              <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
                <Text className="text-sm font-bold text-slate-400">
                  Ngày giờ
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {selectedTransaction &&
                    new Date(selectedTransaction.timestamp).toLocaleString(
                      "vi-VN",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pt-1">
                <Text className="text-sm font-bold text-slate-400 uppercase">
                  Tổng tiền
                </Text>
                <Text className="text-2xl font-black text-[#10b981]">
                  {selectedTransaction?.amount?.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsTransactionDetailOpen(false)}
              className="mt-6 bg-slate-100 py-3.5 rounded-xl items-center"
            >
              <Text className="font-bold text-slate-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={isPricingOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsPricingOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-t-[2.5rem] h-[60%] px-6 pt-3 pb-8 shadow-2xl"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row items-center gap-2 mb-6">
              <Tag size={24} color="#ff6b00" />
              <Text className="text-xl font-black text-slate-800">
                Quản lý Bảng giá
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-4">
                <Text className="font-bold text-slate-800 text-base mb-1">
                  Gói 30 Phút
                </Text>
                <Text className="font-black text-[#10b981] text-xl">
                  50.000đ
                </Text>
              </View>
              <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <Text className="font-bold text-slate-800 text-base mb-1">
                  Gói 60 Phút
                </Text>
                <Text className="font-black text-[#10b981] text-xl">
                  100.000đ
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsPricingOpen(false)}
              className="mt-4 bg-slate-100 py-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-slate-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={isMaintenanceOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsMaintenanceOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-t-[2.5rem] h-[60%] px-6 pt-3 pb-8 shadow-2xl"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row items-center gap-2 mb-6">
              <Wrench size={24} color="#ff6b00" />
              <Text className="text-xl font-black text-slate-800">
                Báo hỏng / Bảo trì
              </Text>
            </View>
            {maintenanceCars.length === 0 ? (
              <View className="flex-1 justify-center items-center opacity-50">
                <Wrench size={48} color="#94a3b8" />
                <Text className="font-bold text-slate-400 mt-4">
                  Chưa có xe nào đang báo hỏng
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {maintenanceCars.map((car) => (
                  <View
                    key={car.dbKey}
                    className="flex-row justify-between items-center py-4 border-b border-slate-50"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="w-12 h-12 bg-slate-100 rounded-2xl items-center justify-center border border-slate-200">
                        <Text className="text-lg font-black text-slate-700">
                          {car.id}
                        </Text>
                      </View>
                      <View>
                        <Text className="font-black text-slate-800 text-base">
                          Lỗi: {car.customer}
                        </Text>
                        <Text className="text-xs text-orange-400 mt-0.5 font-medium">
                          {car.type || "Xe"} đang chờ sửa
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleSuaXong(car.dbKey)}
                      className="bg-[#10b981] px-4 py-2.5 rounded-xl shadow-sm"
                    >
                      <Text className="font-bold text-white text-xs">
                        Sửa xong
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setIsMaintenanceOpen(false)}
              className="mt-4 bg-slate-100 py-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-slate-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={isSettingsOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsSettingsOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-t-[2.5rem] h-[65%] px-6 pt-3 pb-8 shadow-2xl"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row items-center gap-2 mb-6">
              <Settings size={24} color="#ff6b00" />
              <Text className="text-xl font-black text-slate-800">
                Cài đặt hệ thống
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsSoundOn(!isSoundOn)}
                className="flex-row justify-between items-center py-4 border-b border-slate-50"
              >
                <Text className="font-bold text-slate-700 text-base">
                  Thông báo âm thanh
                </Text>
                <View
                  className={`w-12 h-6 rounded-full justify-center px-1 ${isSoundOn ? "bg-[#10b981]" : "bg-slate-300"}`}
                >
                  <View
                    className={`w-4 h-4 bg-white rounded-full ${isSoundOn ? "self-end" : "self-start"}`}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsAutoLockOn(!isAutoLockOn)}
                className="flex-row justify-between items-center py-4 border-b border-slate-50"
              >
                <Text className="font-bold text-slate-700 text-base">
                  Tự động khóa màn hình
                </Text>
                <View
                  className={`w-12 h-6 rounded-full justify-center px-1 ${isAutoLockOn ? "bg-[#10b981]" : "bg-slate-300"}`}
                >
                  <View
                    className={`w-4 h-4 bg-white rounded-full ${isAutoLockOn ? "self-end" : "self-start"}`}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsBatterySaver(!isBatterySaver)}
                className="flex-row justify-between items-center py-4 border-b border-slate-50"
              >
                <Text className="font-bold text-slate-700 text-base">
                  Chế độ tiết kiệm pin
                </Text>
                <View
                  className={`w-12 h-6 rounded-full justify-center px-1 ${isBatterySaver ? "bg-[#ff6b00]" : "bg-slate-300"}`}
                >
                  <View
                    className={`w-4 h-4 bg-white rounded-full ${isBatterySaver ? "self-end" : "self-start"}`}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert("Hoàn tất", "Đã dọn dẹp bộ nhớ đệm!")
                }
                className="flex-row justify-between items-center py-4 border-b border-slate-50 mt-2"
              >
                <Text className="font-bold text-red-500 text-base">
                  Dọn dẹp bộ nhớ đệm
                </Text>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsSettingsOpen(false)}
              className="mt-4 bg-slate-100 py-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-slate-600">Lưu & Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      {/* 🔴 BẢN VÁ LỖI IPHONE: MÀN HÌNH THÊM XE */}
      <Modal
        visible={isAddCarOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-center px-6">
          {/* Tấm nền đen tách riêng */}
          <Pressable
            onPress={() => setIsAddCarOpen(false)}
            className="absolute top-0 bottom-0 left-0 right-0 bg-black/50"
          />

          {/* Khung nội dung trắng nổi lên trên */}
          <View className="bg-white rounded-3xl p-6 shadow-2xl z-10">
            <Text className="text-xl font-black text-slate-800 mb-6 text-center">
              Thêm Xe Mới
            </Text>
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Chọn loại xe
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CAR_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewCarType(type)}
                  className={`px-4 py-2.5 rounded-xl border ${newCarType === type ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100"}`}
                >
                  <Text
                    className={`font-bold text-sm ${newCarType === type ? "text-indigo-600" : "text-slate-500"}`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Mã xe / Biển số
            </Text>
            <TextInput
              value={newCarId}
              onChangeText={setNewCarId}
              placeholder="VD: 05, 06..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold text-base mb-6"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsAddCarOpen(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="font-bold text-slate-600">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCar}
                className="flex-1 bg-[#10b981] py-3.5 rounded-xl items-center shadow-sm"
              >
                <Text className="font-black text-white">Thêm Xe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔴 BẢN VÁ LỖI IPHONE: MÀN HÌNH GIAO XE */}
      <Modal
        visible={isRentCarOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-center px-6">
          {/* Tấm nền đen tách riêng */}
          <Pressable
            onPress={() => setIsRentCarOpen(false)}
            className="absolute top-0 bottom-0 left-0 right-0 bg-black/50"
          />

          {/* Khung nội dung trắng nổi lên trên */}
          <View className="bg-white rounded-3xl p-6 shadow-2xl z-10">
            <Text className="text-xl font-black text-[#ff6b00] mb-2 text-center">
              Giao {selectedCar?.type || "Xe"} {selectedCar?.id}
            </Text>
            <Text className="text-sm text-slate-500 mb-6 text-center">
              Vui lòng nhập thông tin khách hàng
            </Text>
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Họ tên khách hàng
            </Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Nhập tên..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold text-base mb-4"
            />
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Thời gian thuê (Phút)
            </Text>
            <TextInput
              value={rentDuration}
              onChangeText={setRentDuration}
              keyboardType="numeric"
              placeholder="30"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold text-base mb-6"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsRentCarOpen(false)}
                className="flex-[0.8] bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="font-bold text-slate-600">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayLater}
                className="flex-[1.2] bg-amber-500 py-3.5 rounded-xl items-center shadow-sm"
              >
                <Text className="font-black text-white">TRẢ SAU</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleContinueToPayment}
                className="flex-[1.2] bg-[#0f172a] py-3.5 rounded-xl items-center shadow-sm"
              >
                <Text className="font-black text-white">TRẢ TRƯỚC</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isPaymentModalOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsPaymentModalOpen(false)}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-3xl p-6 shadow-2xl items-center"
          >
            <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mb-4">
              <QrCode size={28} color="#10b981" />
            </View>
            <Text className="text-xl font-black text-slate-800 text-center mb-1">
              Thanh toán trả trước
            </Text>
            <Text className="text-sm text-slate-500 text-center mb-4">
              Quý khách vui lòng quét mã để bắt đầu chạy xe.
            </Text>
            <View className="bg-slate-50 w-full rounded-2xl p-4 items-center border border-slate-100 mb-6">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1">
                SỐ TIỀN CẦN THANH TOÁN
              </Text>
              <Text className="text-3xl font-black text-[#10b981]">
                {currentAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <View className="bg-white p-2 rounded-2xl border-2 border-slate-100 mb-6 shadow-sm">
              <Image
                source={{
                  uri: `https://img.vietqr.io/image/mbbank-0685212121981-compact2.png?amount=${currentAmount}&addInfo=FLICK THUE ${selectedCar?.type ? selectedCar.type.replace(/\s+/g, "").toUpperCase() : "XE"} ${selectedCar?.id}&accountName=NGUYEN QUYNH NGOC`,
                }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            </View>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => {
                  setIsPaymentModalOpen(false);
                  setIsPostpaidPayment(false);
                }}
                className="flex-1 bg-slate-100 py-4 rounded-2xl items-center"
              >
                <Text className="font-bold text-slate-600">Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmPayment}
                className="flex-[2] bg-[#10b981] py-4 rounded-2xl items-center shadow-sm flex-row justify-center gap-2"
              >
                <Square size={16} color="white" fill="white" />
                <Text className="text-black text-base font-black">
                  ĐÃ NHẬN TIỀN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={isCarOptionsOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <Pressable
          onPress={() => setIsCarOptionsOpen(false)}
          className="flex-1 justify-end bg-black/50"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-t-3xl p-6 shadow-2xl pb-10"
          >
            <Text className="text-xl font-black text-slate-800 mb-6 text-center">
              Tùy chọn {selectedCar?.type || "Xe"} {selectedCar?.id}
            </Text>
            {selectedCar?.status === "running" && (
              <TouchableOpacity
                onPress={() => {
                  setIsCarOptionsOpen(false);
                  handleThemGio(selectedCar);
                }}
                className="bg-orange-50 py-4 rounded-2xl items-center border border-orange-100 mb-3"
              >
                <Text className="font-black text-[#ff6b00] text-base">
                  ⏳ Thêm 30 phút
                </Text>
              </TouchableOpacity>
            )}
            {selectedCar?.status === "maintenance" ? (
              <TouchableOpacity
                onPress={() => handleSuaXong(selectedCar?.dbKey)}
                className="bg-[#10b981] py-4 rounded-2xl items-center mb-3"
              >
                <Text className="font-black text-white text-base">
                  🔧 Đã sửa xong (Đưa về bãi)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleBaoTri(selectedCar?.dbKey)}
                className="bg-orange-500 py-4 rounded-2xl items-center mb-3"
              >
                <Text className="font-black text-white text-base">
                  ⚠️ Báo hỏng / Cần bảo trì
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleXoaXe(selectedCar?.dbKey)}
              className="bg-red-50 py-4 rounded-2xl items-center border border-red-100 mb-3"
            >
              <Text className="font-bold text-red-500 text-base">
                Xóa vĩnh viễn xe này
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsCarOptionsOpen(false)}
              className="bg-slate-100 py-4 rounded-2xl items-center mt-2"
            >
              <Text className="font-bold text-slate-600 text-base">
                Hủy / Đóng
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* 🔴 MÀN HÌNH CHỌN XE ĐỂ ĐỔI (ĐÃ FIX TRỊ DỨT ĐIỂM LỖI BẤM) */}
      <Modal
        visible={isSwitchCarModalOpen}
        animationType="slide"
        statusBarTranslucent={true}
        transparent={true}
      >
        <Pressable
          onPress={() => {
            setIsSwitchCarModalOpen(false);
            setSwitchCarSearchQuery("");
          }}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-t-[2.5rem] h-[85%] px-6 pt-3 pb-8 shadow-2xl"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <Text className="text-xl font-black text-slate-800 mb-2">
              Đổi sang xe nào sếp?
            </Text>
            <Text className="text-sm font-bold text-slate-500 mb-5">
              Xe {selectedCar?.id} sẽ được dọn bãi, xe mới dưới đây sẽ chạy tiếp số thời gian còn lại.
            </Text>

            {/* THANH TÌM KIẾM XE TRỐNG */}
            <View className="flex-row items-center gap-3 mb-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
              <Search color="#94a3b8" size={18} />
              <TextInput
                className="flex-1 font-bold text-slate-800 text-sm"
                onChangeText={setSwitchCarSearchQuery}
                placeholder="Tìm biển số xe rảnh (VD: 05)..."
                placeholderTextColor="#94a3b8"
                value={switchCarSearchQuery}
              />
            </View>

            {/* DANH SÁCH XE */}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {displayCars.filter(c => c.status === "idle" && c.id.toLowerCase().includes(switchCarSearchQuery.toLowerCase())).length === 0 ? (
                <View className="items-center justify-center py-10 opacity-50">
                  <Text className="text-center font-bold text-slate-400 mt-4 text-base">
                    Không tìm thấy xe trống nào phù hợp!
                  </Text>
                </View>
              ) : (
                displayCars.filter(c => c.status === "idle" && c.id.toLowerCase().includes(switchCarSearchQuery.toLowerCase())).map(car => (
                  <TouchableOpacity
                    key={car.dbKey}
                    onPress={() => handleConfirmSwitchCar(car)}
                    activeOpacity={0.6}
                    className="flex-row items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center font-black text-slate-700">
                        <Text className="text-xl font-black">{car.id}</Text>
                      </View>
                      <View>
                        <Text className="font-black text-slate-800 text-base uppercase">{car.type}</Text>
                        <Text className="text-xs font-bold text-[#10b981] mt-0.5">Sẵn sàng phục vụ</Text>
                      </View>
                    </View>
                    <View className="bg-[#10b981] px-5 py-3 rounded-xl">
                      <Text className="font-black text-white text-xs">CHỌN XE</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setIsSwitchCarModalOpen(false);
                setSwitchCarSearchQuery("");
              }}
              className="mt-4 bg-slate-100 py-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-slate-600">Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Màn Bãi Xe */}
      {activeTab === "cars" ? (
        <FlatList
          data={filteredCars}
          keyExtractor={(item) => item.dbKey}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 130,
          }}
          ListHeaderComponent={
            <View className="mb-6">
              <View className="flex-row justify-between gap-3 mb-6">
                <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                  <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Đang chạy
                  </Text>
                  <Text className="text-2xl font-black text-[#ff6b00]">
                    {
                      displayCars.filter(
                        (c) => c.status === "running" || c.status === "timeout",
                      ).length
                    }
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                  <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Xe trống
                  </Text>
                  <Text className="text-2xl font-black text-[#10b981]">
                    {displayCars.filter((c) => c.status === "idle").length}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                  <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Bảo trì
                  </Text>
                  <Text className="text-2xl font-black text-slate-700">
                    {
                      displayCars.filter((c) => c.status === "maintenance")
                        .length
                    }
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 h-12">
                <View className="flex-1 bg-white rounded-2xl px-4 h-full flex-row items-center gap-3 border border-slate-100 shadow-sm">
                  <View style={{ flexShrink: 0 }}>
                    <Search size={20} color="#94a3b8" />
                  </View>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm xe, biển số, khách..."
                    className="flex-1 text-base font-medium text-slate-800"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setIsAddCarOpen(true)}
                  className="bg-[#10b981] h-full px-5 rounded-2xl justify-center items-center shadow-sm"
                >
                  <Plus size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item: car }) => {
            if (car.status === "idle") {
              return (
                <View className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 bg-slate-100 rounded-3xl items-center justify-center">
                        <Text className="text-2xl font-black text-slate-500">
                          {car.id}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xl font-black text-[#0f172a]">
                          {car.type || "Xe Thường"}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Activity size={14} color="#10b981" />
                          <Text className="text-sm font-bold text-slate-400">Đang vận hành</Text>
                          {car.isPaid === false && (
                            <Text className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-bold ml-1">TRẢ SAU</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCar(car);
                        setIsCarOptionsOpen(true);
                      }}
                      className="p-2 -mt-1 -mr-2"
                    >
                      <MoreVertical size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => openRentModal(car)}
                    activeOpacity={0.8}
                    className="w-full flex-row items-center justify-center gap-2 bg-[#0f172a] py-4 rounded-2xl mt-2"
                  >
                    <Play size={18} color="white" fill="white" />
                    <Text className="text-white text-base font-black">
                      GIAO XE NGAY
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
            if (car.status === "maintenance") {
              return (
                <View className="bg-slate-50 rounded-[2rem] p-5 border border-slate-200 shadow-sm mb-6 opacity-80">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 bg-slate-200 rounded-3xl items-center justify-center">
                        <Text className="text-2xl font-black text-slate-500">
                          {car.id}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xl font-black text-slate-600">
                          {car.type || "Xe"} - ĐANG BẢO TRÌ
                        </Text>
                        <Text className="text-sm font-bold text-slate-400 mt-0.5">
                          Lỗi: {car.customer}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCar(car);
                        setIsCarOptionsOpen(true);
                      }}
                      className="p-2 -mt-1 -mr-2"
                    >
                      <MoreVertical size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            if (car.status === "running") {
              return (
                <View className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 bg-orange-100 rounded-3xl items-center justify-center">
                        <Text className="text-2xl font-black text-[#ff6b00]">
                          {car.id}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-indigo-500 uppercase">
                          {car.type || "Xe"}
                        </Text>
                        <Text className="text-xl font-black text-[#0f172a]">
                          {car.customer}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Activity size={14} color="#10b981" />
                          <Text className="text-sm font-bold text-slate-400">
                            Đang vận hành
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCar(car);
                        setIsCarOptionsOpen(true);
                      }}
                      className="p-2 -mt-1 -mr-2"
                    >
                      <MoreVertical size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                  <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Clock size={16} color="#ff6b00" />
                      <Text className="font-black text-base text-[#ff6b00]">
                        {car.displayTime}
                      </Text>
                    </View>
                    <View className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full bg-[#ff6b00]"
                        style={{ width: `${car.currentProgress}%` }}
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-4">
                    <TouchableOpacity
                      onPress={() => handleKetThuc(car)}
                      activeOpacity={0.7}
                      className="flex-1 bg-slate-50 items-center justify-center py-4 rounded-2xl border border-slate-100"
                    >
                      <Text className="text-[#0f172a] text-base font-bold">
                        Thu xe dọn bãi
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCar(car);
                        setIsSwitchCarModalOpen(true);
                      }}
                      activeOpacity={0.7}
                      className="flex-1 bg-indigo-50 border border-indigo-100 items-center justify-center py-4 rounded-2xl"
                    >
                      <Text className="text-indigo-600 text-base font-black">
                        🔄 Đổi xe
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            if (car.status === "timeout") {
              return (
                <View className="bg-white rounded-[2rem] p-5 border-2 border-[#ef4444] shadow-sm mb-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 bg-red-400 rounded-3xl items-center justify-center">
                        <Text className="text-2xl font-black text-white">
                          {car.id}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-red-500 uppercase">
                          {car.type || "Xe"}
                        </Text>
                        <Text className="text-xl font-black text-[#0f172a]">
                          {car.customer}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Activity size={14} color="#ef4444" />
                          <Text className="text-sm font-bold text-slate-400">Cần thu xe</Text>
                          {car.isPaid === false && (
                            <Text className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-bold ml-1">TRẢ SAU</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCar(car);
                        setIsCarOptionsOpen(true);
                      }}
                      className="p-2 -mt-1 -mr-2"
                    >
                      <MoreVertical size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                  <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3 bg-red-50 self-start px-2 py-1 rounded-md">
                      <AlertTriangle size={14} color="#ef4444" />
                      <Text className="font-black text-sm text-[#ef4444]">
                        {car.displayTime}
                      </Text>
                    </View>
                    <View className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full bg-[#ef4444]"
                        style={{ width: "100%" }}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleKetThuc(car)}
                    activeOpacity={0.8}
                    className="w-full flex-row items-center justify-center gap-2 bg-[#ef4444] py-4 rounded-2xl"
                  >
                    <Square size={18} color="white" fill="white" />
                    <Text className="text-white text-base font-black">
                      THU XE DỌN BÃI
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-10 opacity-50">
              <Search size={40} color="#94a3b8" />
              <Text className="mt-4 text-base font-bold text-slate-400">
                Không tìm thấy xe hoặc khách này
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 130,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-[#0f172a] p-6 rounded-[2rem] shadow-xl mb-6">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-slate-400 text-[11px] font-bold uppercase mb-2">
                  TỔNG DOANH THU HÔM NAY
                </Text>
                <View className="flex-row items-baseline gap-1 mt-1">
                  <Text className="text-4xl font-black text-white">
                    {dailyRevenue.toLocaleString("vi-VN")}
                  </Text>
                  <Text className="text-[#10b981] font-bold text-2xl">đ</Text>
                </View>
              </View>
              <View className="p-2 bg-white/10 rounded-xl">
                <Calendar size={20} color="white" />
              </View>
            </View>
            <View className="mt-6 flex-row items-center gap-2 bg-[#10b981]/20 self-start px-3 py-1.5 rounded-lg border border-[#10b981]/30">
              <TrendingUp size={16} color="#10b981" />
              <Text className="text-[#10b981] text-xs font-bold">
                Cập nhật lúc {currentTime}
              </Text>
            </View>
          </View>
          <View className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-64 justify-between mb-6">
            <View className="flex-row justify-between items-center">
              <Text className="font-black text-slate-800 text-lg">
                Thống kê
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsRevenueFilterOpen(true)}
                className="flex-row items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"
              >
                <Text className="text-xs font-bold text-slate-500">
                  {revenueFilter}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between items-end h-32 w-full">
              {chartLabels.map((label, index) => {
                const val = chartData[index] || 0;
                const heightPercent =
                  maxChartValue === 1 ? 0 : (val / maxChartValue) * 100;
                let isActive = false;
                if (
                  revenueFilter === "Tuần này" &&
                  index === (new Date().getDay() || 7) - 1
                )
                  isActive = true;
                if (
                  revenueFilter === "Tháng này" &&
                  index === Math.floor((new Date().getDate() - 1) / 7)
                )
                  isActive = true;
                if (
                  revenueFilter === "Năm nay" &&
                  index === new Date().getMonth()
                )
                  isActive = true;
                const barWidth = chartLabels.length > 7 ? "w-3" : "w-6";

                return (
                  <View key={label} className="items-center flex-1">
                    <View className="w-full h-32 justify-end mb-2 items-center">
                      {val > 0 && (
                        <Text
                          className="text-[8px] font-black text-slate-500 mb-1 text-center w-12"
                          numberOfLines={1}
                        >
                          {formatMoneyShort(val)}
                        </Text>
                      )}
                      <View
                        className={`${barWidth} rounded-md ${isActive ? "bg-[#ff6b00]" : "bg-slate-200"}`}
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: val > 0 ? 4 : 0,
                        }}
                      />
                    </View>
                    <Text
                      className={`text-[10px] font-bold ${isActive ? "text-[#ff6b00]" : "text-slate-400"}`}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Text className="font-black text-slate-800 text-lg mb-4 ml-2">
            Chỉ số kinh doanh
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-rose-50 p-4 rounded-3xl mb-4 border border-rose-100">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-3 shadow-sm shadow-rose-200">
                <TrendingUp size={18} color="#f43f5e" />
              </View>
              <Text className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">
                Lượt thuê nay
              </Text>
              <Text className="text-2xl font-black text-rose-600">
                {todayTrips}{" "}
                <Text className="text-sm font-bold text-rose-400">chuyến</Text>
              </Text>
            </View>
            <View className="w-[48%] bg-sky-50 p-4 rounded-3xl mb-4 border border-sky-100">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-3 shadow-sm shadow-sky-200">
                <Clock size={18} color="#0ea5e9" />
              </View>
              <Text className="text-[10px] font-black text-sky-400 uppercase tracking-wider mb-1">
                Thời gian TB
              </Text>
              <Text className="text-2xl font-black text-sky-600">
                {avgDuration}{" "}
                <Text className="text-sm font-bold text-sky-400">phút</Text>
              </Text>
            </View>
            <View className="w-[48%] bg-amber-50 p-4 rounded-3xl mb-4 border border-amber-100">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-3 shadow-sm shadow-amber-200">
                <Activity size={18} color="#f59e0b" />
              </View>
              <Text className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
                Hiệu suất bãi
              </Text>
              <Text className="text-2xl font-black text-amber-600">
                {activePercent}
                <Text className="text-lg font-black text-amber-500">%</Text>
              </Text>
            </View>
            <View className="w-[48%] bg-indigo-50 p-4 rounded-3xl mb-4 border border-indigo-100">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-3 shadow-sm shadow-indigo-200">
                <Car size={18} color="#6366f1" />
              </View>
              <Text className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">
                Xe đang rảnh
              </Text>
              <Text className="text-2xl font-black text-indigo-600">
                {idleCount}{" "}
                <Text className="text-sm font-bold text-indigo-400">xe</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <View className="absolute bottom-6 left-5 right-5 items-center">
        <View className="bg-white flex-row rounded-[1.8rem] shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 w-full overflow-hidden p-1.5">
          <TouchableOpacity
            onPress={() => setActiveTab("cars")}
            activeOpacity={0.9}
            className={`flex-1 items-center justify-center py-4 rounded-3xl ${activeTab === "cars" ? "bg-[#0f172a]" : "bg-transparent"}`}
          >
            <Car size={22} color={activeTab === "cars" ? "white" : "#94a3b8"} />
            <Text
              className={`text-[10px] font-black uppercase mt-1.5 ${activeTab === "cars" ? "text-white" : "text-slate-400"}`}
            >
              Bãi Xe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("revenue")}
            activeOpacity={0.9}
            className={`flex-1 items-center justify-center py-4 rounded-3xl ${activeTab === "revenue" ? "bg-[#10b981]" : "bg-transparent"}`}
          >
            <CircleDollarSign
              size={22}
              color={activeTab === "revenue" ? "white" : "#94a3b8"}
            />
            <Text
              className={`text-[10px] font-black uppercase mt-1.5 ${activeTab === "revenue" ? "text-white" : "text-slate-400"}`}
            >
              Doanh thu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

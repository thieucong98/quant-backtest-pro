import * as fs from 'fs';
import * as path from 'path';

// 1. authStore.ts
const authPath = path.join(process.cwd(), 'src/store/authStore.ts');
let authCode = fs.readFileSync(authPath, 'utf-8');

authCode = authCode.replace(
  "error: 'Vui lòng nhập đầy đủ Email và Mật khẩu'",
  "error: 'Please enter both Email and Password'"
);
authCode = authCode.replace(
  "error: 'Định dạng Email không hợp lệ (VD: trader@quantbacktest.pro)'",
  "error: 'Invalid email address format (e.g. trader@quantbacktest.pro)'"
);
authCode = authCode.replace(
  "error: err.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!'",
  "error: err.message || 'Invalid email or password. Please try again!'"
);
authCode = authCode.replace(
  "error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu'",
  "error: 'Please enter Full Name, Email and Password'"
);
authCode = authCode.replace(
  "error: 'Định dạng Email không hợp lệ (VD: trader@quantbacktest.pro)'",
  "error: 'Invalid email address format (e.g. trader@quantbacktest.pro)'"
);
authCode = authCode.replace(
  "error: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự'",
  "error: 'Password must be at least 6 characters long'"
);
authCode = authCode.replace(
  "error: err.message || 'Đăng ký không thành công. Email này có thể đã được sử dụng!'",
  "error: err.message || 'Registration failed. This email may already be in use!'"
);

fs.writeFileSync(authPath, authCode, 'utf-8');

// 2. backtestStore.ts
const backtestPath = path.join(process.cwd(), 'src/store/backtestStore.ts');
let backtestCode = fs.readFileSync(backtestPath, 'utf-8');

backtestCode = backtestCode.replace(
  "message: 'Hệ thống Quant Backtest Pro khởi tạo thành công.'",
  "message: 'Quant Backtest Pro initialized successfully.'"
);
backtestCode = backtestCode.replace(
  "get().addStrategyLog('ERROR', '🔒 Bạn đã đạt giới hạn 3 lệnh dùng thử cho Khách. Vui lòng Đăng nhập để mở khóa giao dịch không giới hạn!');",
  "get().addStrategyLog('ERROR', '🔒 Free Guest limit reached (3 trades). Please sign in to unlock unlimited trading!');"
);
backtestCode = backtestCode.replace(
  "get().addStrategyLog('ERROR', '🔒 Bạn đã đạt giới hạn 3 lệnh dùng thử cho Khách. Vui lòng Đăng nhập để mở khóa giao dịch không giới hạn!');",
  "get().addStrategyLog('ERROR', '🔒 Free Guest limit reached (3 trades). Please sign in to unlock unlimited trading!');"
);
backtestCode = backtestCode.replace(
  "get().addStrategyLog('INFO', 'Server offline — chế độ cục bộ, dữ liệu không được lưu tự động');",
  "get().addStrategyLog('INFO', 'Server offline — running in local mode');"
);
backtestCode = backtestCode.replace(
  "get().addStrategyLog('INFO', 'Đã xóa toàn bộ tất cả các phiên giao dịch');",
  "get().addStrategyLog('INFO', 'Cleared all backtest sessions from database');"
);

fs.writeFileSync(backtestPath, backtestCode, 'utf-8');
console.log('✅ Successfully refactored stores!');

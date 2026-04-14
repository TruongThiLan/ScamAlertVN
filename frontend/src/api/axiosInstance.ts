import axios from 'axios';

// 1. Khởi tạo instance với cấu hình cơ bản
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Địa chỉ Backend của Nguyệt
  timeout: 10000, // Chờ tối đa 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. "Trạm thu phí" Request (Interceptors)
// Trước khi gửi yêu cầu đi, nó sẽ tự động lấy Token từ máy người dùng dán vào Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // Trang sẽ lưu token vào đây sau khi login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. "Trạm kiểm soát" Response
// Nếu Backend báo lỗi (ví dụ Token hết hạn), bạn xử lý tập trung ở đây
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Token hết hạn hoặc không hợp lệ, Nguyệt nên cho user login lại!");
      // localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export default api;
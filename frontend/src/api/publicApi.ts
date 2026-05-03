import axios from 'axios';

// NOTE VAN DAP:
// publicApi dung cho API public/guest, khong gui Authorization token.
// Vi du: ScamChecker goi /api/public/posts/check_scam/ ngay ca khi chua dang nhap.

// Axios rieng cho API public/guest: khong gan Authorization token.
const publicApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default publicApi;

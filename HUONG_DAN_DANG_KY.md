# 📋 HƯỚNG DẪN HOÀN THIỆN CHỨC NĂNG ĐĂNG KÝ TÀI KHOẢN

**Dự án:** ScamAlertVN  
**Ngày:** 16 tháng 4 năm 2026  
**Phiên bản:** 1.0

---

## 📌 I. DANH SÁCH CÁC PHẦN ĐÃ CHỈNH SỬA

### **Backend (Django REST Framework)**

#### 1️⃣ **File: `backend/api/serializers.py`**

**Thay đổi:** Thêm `RegisterSerializer` mới

```python
# Dòng 1-10: Thêm import
from django.contrib.auth import get_user_model

# Dòng 30-47: Thêm đoạn mã mới
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
```

**Giải thích:**
- Nhận 3 trường: `username`, `email`, `password`
- `password` là `write_only` (chỉ nhập, không trả ra)
- Sử dụng `create_user()` để hash mật khẩu bảo mật (không để password plain text)
- Tuân thủ quy tắc `snake_case` của Backend

---

#### 2️⃣ **File: `backend/api/views.py`**

**Thay đổi 1:** Thêm import `RegisterSerializer`

```python
from .serializers import (
    ...
    RegisterSerializer,  # ← Thêm dòng này
)
```

**Thay đổi 2:** Thêm class `RegisterViewSet` mới

```python
class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**Giải thích:**
- `permission_classes = [permissions.AllowAny]` → Ai cũng được đăng ký (không cần token)
- `create()` method handling POST request
- Nếu dữ liệu hợp lệ → Trả 201 Created
- Nếu dữ liệu không hợp lệ → Trả 400 Bad Request với error message

---

#### 3️⃣ **File: `backend/api/urls.py`**

**Thay đổi:** Thêm `RegisterViewSet` vào Router

```python
from .views import (
    ...
    RegisterViewSet,  # ← Thêm dòng này
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', ScamCategoryViewSet)
router.register(r'reports', ContentReportViewSet)
router.register(r'register', RegisterViewSet, basename='register')  # ← Thêm dòng này
```

**Giải thích:**
- Tạo endpoint `/api/register/` tự động từ DefaultRouter
- `basename='register'` giúp Django tạo URL names

---

#### 4️⃣ **File: `backend/core/settings.py`**

**Trạng thái:** ✅ Đã có sẵn, không cần sửa

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
```

**Giải thích:**
- Cho phép Frontend (Vite server ở 5173) gọi API mà không bị CORS error
- `corsheaders` middleware đã được thêm vào MIDDLEWARE

---

### **Frontend (React - TypeScript)**

#### 5️⃣ **File: `frontend/src/app/pages/Register.tsx`**

**Thay đổi 1:** Thay đổi imports

❌ **Trước:**
```typescript
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
```

✅ **Sau:**
```typescript
import { ShieldAlert, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import axios from 'axios';
```

**Giải thích:**
- Xóa `useAuth` vì sẽ call API trực tiếp
- Xóa icon `Phone` vì không dùng trường số điện thoại
- Thêm `axios` để gọi API

---

**Thay đổi 2:** Đổi state từ `name` thành `username`, loại bỏ `phone`

❌ **Trước:**
```typescript
const [name, setName] = useState('');
const [phone, setPhone] = useState('');
const [nameError, setNameError] = useState('');
const [phoneError, setPhoneError] = useState('');
const { register } = useAuth();
```

✅ **Sau:**
```typescript
const [username, setUsername] = useState('');
const [usernameError, setUsernameError] = useState('');
// phone state bị xóa hết
```

**Giải thích:**
- Backend dùng field `username` (không phải `name`)
- Xóa hoàn toàn trường số điện thoại theo yêu cầu

---

**Thay đổi 3:** Cập nhật hàm validate cho `username`

❌ **Trước:**
```typescript
const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setName(val);
  // ... logic
};
```

✅ **Sau:**
```typescript
const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.trim();  // ← Trim khoảng trắng
  setUsername(val);
  if (val.length > 0 && (val.length < 6 || val.length > 20)) {
    setUsernameError('Tên đăng nhập phải có độ dài từ 6-20 ký tự và duy nhất trong hệ thống');
  } else {
    setUsernameError('');
  }
};
```

**Giải thích:**
- `.trim()` được thêm để xóa khoảng trắng ở đầu/cuối
- Validate độ dài 6-20 ký tự

---

**Thay đổi 4:** Cập nhật `handleEmailChange` thêm `.trim()`

✅ **Sau:**
```typescript
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.trim();  // ← Trim khoảng trắng
  setEmail(val);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // ... logic
};
```

---

**Thay đổi 5:** Xóa hàm `handlePhoneChange` hoàn toàn

❌ **Trước:** Có hàm này

✅ **Sau:** Xóa hết

---

**Thay đổi 6:** Cập nhật hàm `handleSubmit` - call API trực tiếp

❌ **Trước:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (nameError || emailError || phoneError || passwordError || confirmPasswordError 
      || !name || !email || !phone || !password || !confirmPassword) {
    toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
    return;
  }
  setLoading(true);
  try {
    const success = await register(email, password, name);
    if (success) {
      toast.success('Đăng ký thành công!');
      navigate('/');
    } else {
      toast.error('Email đã được sử dụng');
    }
  } catch (error) {
    toast.error('Đã có lỗi xảy ra');
  } finally {
    setLoading(false);
  }
};
```

✅ **Sau:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (usernameError || emailError || passwordError || confirmPasswordError 
      || !username || !email || !password || !confirmPassword) {
    toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
    return;
  }
  setLoading(true);
  try {
    const response = await axios.post('http://localhost:8000/api/register/', {
      username: username.trim(),
      email: email.trim(),
      password,
    });
    toast.success('Đăng ký thành công!');
    navigate('/');
  } catch (error: any) {
    const errorMessage = error.response?.data?.username?.[0] 
      || error.response?.data?.email?.[0] 
      || 'Đã có lỗi xảy ra';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Giải thích:**
- Gọi trực tiếp `axios.post()` thay vì `useAuth().register()`
- URL: `http://localhost:8000/api/register/`
- Payload: `{ username, email, password }`
- Trim lại username và email lần nữa để chắc chắn
- Catch error từ Backend: nếu Backend trả `username` hoặc `email` error → hiển thị

---

**Thay đổi 7:** Cập nhật form HTML - xóa field `phone`

❌ **Trước:**
```jsx
<div>
  <label>Tên đăng nhập</label>
  <Input id="name" value={name} onChange={handleNameChange} />
  {nameError && <p>{nameError}</p>}
</div>

<div>
  <label>Email</label>
  <Input id="email" value={email} onChange={handleEmailChange} />
  {emailError && <p>{emailError}</p>}
</div>

<div>
  <label>Số điện thoại</label>
  <Input id="phone" value={phone} onChange={handlePhoneChange} />
  {phoneError && <p>{phoneError}</p>}
</div>

<div>
  <label>Mật khẩu</label>
  ...
</div>
```

✅ **Sau:**
```jsx
<div>
  <label>Tên đăng nhập</label>
  <Input id="username" value={username} onChange={handleUsernameChange} />
  {usernameError && <p>{usernameError}</p>}
</div>

<div>
  <label>Email</label>
  <Input id="email" value={email} onChange={handleEmailChange} />
  {emailError && <p>{emailError}</p>}
</div>

<div>
  <label>Mật khẩu</label>
  ...
</div>
<!-- Field số điện thoại bị xóa -->
```

---

**Thay đổi 8:** Cải thiện UI nút bấm - căn giữa, Đăng ký trên, Hủy dưới

❌ **Trước:**
```jsx
<div className="flex gap-4 pt-2">
  <Button type="button" variant="outline" onClick={() => navigate('/login')}>
    Hủy
  </Button>
  <Button type="submit" className="flex-1 ...">
    Đăng ký
  </Button>
</div>
```

✅ **Sau:**
```jsx
<div className="flex flex-col gap-4 pt-2">
  <Button type="submit" className="w-full bg-[#E01515] ...">
    Đăng ký
  </Button>
  <Button type="button" variant="outline" onClick={() => navigate('/')}>
    Hủy
  </Button>
</div>
```

**Giải thích:**
- `flex flex-col` → Nút xếp dọc thay vì ngang
- `w-full` → Nút chiếm hết chiều rộng
- Nút Đăng ký màu đỏ to nổi bật ở trên
- Nút Hủy nhẹ nhàng ở dưới
- `navigate('/')` thay vì `navigate('/login')` để quay về trang chủ

---

## 🚀 II. CÁCH CHẠY DỰ ÁN

### **Bước 1: Khởi động Backend (Django)**

```bash
cd backend
python manage.py runserver
```

**Kết quả mong đợi:**
```
Django version 4.2.8, using settings 'core.settings'
Starting development server at http://127.0.0.1:8000/
```

✅ Backend chạy tại: `http://127.0.0.1:8000`

---

### **Bước 2: Khởi động Frontend (React + Vite)**

Mở terminal khác:

```bash
cd frontend
npm install    # Chỉ chạy lần đầu hoặc khi có package.json thay đổi
npm run dev
```

**Kết quả mong đợi:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

✅ Frontend chạy tại: `http://localhost:5173`

---

### **Bước 3: Test Chức Năng Đăng Ký**

Truy cập: http://localhost:5173/register

**Nhập thông tin:**
- Tên đăng nhập: `testuser`
- Email: `test@example.com`
- Mật khẩu: `Pass@123`
- Xác nhận mật khẩu: `Pass@123`

**Nhấn nút "Đăng ký"**

✅ Nếu thành công → Chuyển về trang chủ, hiển thị thông báo "Đăng ký thành công!"

---

### **Bước 4: Verify Dữ Liệu Trong Database**

```bash
cd backend
python manage.py shell
```

Trong shell Python:

```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='testuser')
print(f"Username: {user.username}")
print(f"Email: {user.email}")
print(f"Password: {user.password[:20]}...")  # Đã được hash
```

✅ Dữ liệu được lưu trong SQLite database

---

## 🧪 III. TEST API VỚI POSTMAN/CURL

### **3.1 Test Đăng Ký Thành Công**

**URL:** `POST http://127.0.0.1:8000/api/register/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass@123"
}
```

**Response (201 Created):**
```json
{
  "username": "newuser",
  "email": "newuser@example.com"
}
```

---

### **3.2 Test Email Trùng Lặp**

**Body:**
```json
{
  "username": "anotheruser",
  "email": "newuser@example.com",
  "password": "SecurePass@123"
}
```

**Response (400 Bad Request):**
```json
{
  "email": ["user with this email already exists."]
}
```

---

### **3.3 Test Username Trùng Lặp**

**Body:**
```json
{
  "username": "newuser",
  "email": "different@example.com",
  "password": "SecurePass@123"
}
```

**Response (400 Bad Request):**
```json
{
  "username": ["A user with that username already exists."]
}
```

---

### **3.4 Test Dữ Liệu Không Hợp Lệ**

**Body (thiếu email):**
```json
{
  "username": "someuser",
  "password": "SecurePass@123"
}
```

**Response (400 Bad Request):**
```json
{
  "email": ["This field is required."]
}
```

---

## 🔒 IV. SECURITY & BEST PRACTICES

| Yếu tố | Chi tiết |
|--------|----------|
| **Password Hash** | ✅ Sử dụng Django `create_user()` - hash bằng PBKDF2 |
| **CORS** | ✅ Cấu hình đầy đủ frontend/backend origin |
| **Permission** | ✅ Chỉ AllowAny cho endpoint đăng ký (không cần token) |
| **Validation** | ✅ Frontend trim + validate, Backend double-check |
| **Error Handling** | ✅ Hiển thị error message cụ thể từ Backend |
| **Database** | ✅ Unique constraint trên `username` và `email` |

---

## 📊 V. FLOW DIAGRAM

```
User nhập form (Frontend)
        ↓
[Validate: username, email, password]
        ↓
Trim khoảng trắng & gửi POST
        ↓
Axios call: http://localhost:8000/api/register/
        ↓
        ┌─────────────────────────────────┐
        ↓                                 ↓
  Backend nhận dữ liệu          Backend validate
        ↓
  ┌─────────────────────────────┐
  ↓                             ↓
Hợp lệ                    Không hợp lệ
  ↓                             ↓
Tạo User                   Trả 400 + Error
Hash password              message
Lưu DB
  ↓
Trả 201 + Data
  ↓
Frontend hiển thị success
Chuyển về trang chủ
```

---

## 📝 VI. TỔNG KẾT CÁC FILE THAY ĐỔI

| File | Dòng | Thay đổi |
|------|------|----------|
| `backend/api/serializers.py` | 1-10 | Thêm import`get_user_model` |
| | 30-47 | Thêm `RegisterSerializer` |
| `backend/api/views.py` | 18 | Thêm import `RegisterSerializer` |
| | 26-35 | Thêm `RegisterViewSet` |
| `backend/api/urls.py` | 4 | Thêm import `RegisterViewSet` |
| | 11 | Thêm route `register` vào router |
| `frontend/src/app/pages/Register.tsx` | 1-8 | Sửa imports |
| | 11-22 | Đổi state `name`→`username`, xóa `phone` |
| | 35-45 | Đổi `handleNameChange`→`handleUsernameChange` |
| | 47-55 | Sửa `handleEmailChange` thêm `trim()` |
| | 57-75 | Xóa `handlePhoneChange` |
| | 77-100 | Sửa `handleSubmit` call axios trực tiếp |
| | 120-145 | Sửa form HTML: xóa field phone |
| | 175-180 | Cải thiện UI nút bấm: flex-col, căn giữa, Đăng ký trên |

---

## ❓ VII. CÂU HỎI THƯỜNG GẶP

**Q: Tại sao dùng `axios.post()` trực tiếp thay vì `useAuth().register()`?**  
A: Vì `useAuth()` cũ đang call `users/` endpoint, chúng ta tạo endpoint đúng là `register/` để tách biệt logic - rõ ràng, dễ maintain.

**Q: Tại sao phải `trim()` 2 lần (frontend + backend)?**  
A: Frontend `trim()` để UX tốt hơn (user không nhìn thấy space), Backend `trim()` để security (tránh bypass).

**Q: Nếu mật khẩu không hash sẽ sao?**  
A: Nếu lưu plain text → Nếu database bị leak, attacker biết mật khẩu của tất cả user. `create_user()` tự động hash bằng PBKDF2.

**Q: CORS error là gì?**  
A: Khi Frontend (5173) gọi API (8000), browser chặn vì khác domain. `CORS_ALLOWED_ORIGINS` cho phép ngoại lệ.

---

**Hết**

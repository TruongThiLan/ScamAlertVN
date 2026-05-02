# ScamAlert VN

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Django](https://img.shields.io/badge/Django-5-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-API-red)
![SQLite](https://img.shields.io/badge/SQLite-demo-003B57?logo=sqlite&logoColor=white)

ScamAlert VN là hệ thống cộng đồng hỗ trợ đăng tải, kiểm duyệt, tra cứu và cảnh báo các hành vi lừa đảo thường gặp tại Việt Nam. Dự án mô phỏng một nền tảng nơi người dùng có thể chia sẻ cảnh báo, tương tác với bài viết, báo cáo nội dung vi phạm và để quản trị viên kiểm duyệt bằng dashboard riêng.

## MỤC LỤC

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Tài khoản demo](#tài-khoản-demo)
- [Dữ liệu mẫu](#dữ-liệu-mẫu)
- [Kiểm tra trước khi nộp](#kiểm-tra-trước-khi-nộp)
- [Ghi chú vận hành](#ghi-chú-vận-hành)

## TÍNH NĂNG CHÍNH

### Người dùng

- Đăng ký, đăng nhập bằng JWT.
- Cập nhật hồ sơ cá nhân và đổi mật khẩu.
- Đăng bài cảnh báo lừa đảo theo danh mục.
- Chọn đăng bài ẩn danh để bảo vệ danh tính trên giao diện public.
- Xem trang chủ, tìm kiếm bài viết, lọc theo danh mục và sắp xếp mới nhất/thịnh hành.
- Xem chi tiết bài viết, bình luận, phản hồi bình luận, thích bài viết/bình luận.
- Lưu bài viết quan trọng vào danh sách bookmark.
- Báo cáo bài viết, bình luận hoặc người dùng.
- Xem hồ sơ công khai của tác giả và lịch sử điểm uy tín của bản thân.

### Quản trị viên

- Dashboard quản trị tách riêng với giao diện người dùng.
- Quản lý người dùng: tìm kiếm, lọc trạng thái/vai trò, khóa, mở khóa, cảnh báo và xóa mềm tài khoản.
- Quản lý bài viết: xem tất cả trạng thái, duyệt, từ chối, ẩn, khóa hoặc xóa bài.
- Phân tích nội dung bằng AI theo thao tác thủ công, không tự chạy khi người dùng đăng bài.
- Quản lý danh mục lừa đảo.
- Xem thống kê hệ thống, báo cáo nội dung và điểm uy tín.

### Kiểm duyệt và an toàn dữ liệu

- Bài viết mới mặc định ở trạng thái `PENDING`.
- Bài đã duyệt mới xuất hiện ở trang public.
- Chủ bài vẫn có thể xem bài của mình khi bài chưa duyệt để sửa.
- Bài/bình luận ẩn danh được mask với khách và người dùng khác.
- Admin và chủ sở hữu vẫn nhìn được thông tin thật khi cần quản lý.
- Sidebar danh mục xử lý cả bài `Chưa phân loại`, tránh lệch tổng số.

## CÔNG NGHỆ SỬ DỤNG

| Phần | Công nghệ |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router |
| UI | Tailwind CSS, Radix UI, Lucide React, Sonner |
| Backend | Django, Django REST Framework |
| Auth | JWT với `djangorestframework-simplejwt` |
| Database | SQLite cho môi trường demo |
| AI moderation | OpenAI/Gemini nếu có API key, fallback local rule-based analyzer |

## CẤU TRÚC THƯ MỤC

```text
ScamAlertVN/
├── backend/
│   ├── api/
│   │   ├── management/commands/seed_demo_data.py
│   │   ├── migrations/
│   │   ├── serializers/
│   │   ├── services/
│   │   ├── urls/
│   │   └── views/
│   ├── core/
│   ├── media/
│   ├── db.sqlite3
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── pages/
│   │   │   └── routes.tsx
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
├── package.json
└── README.md
```

## CÀI ĐẶT VÀ CHẠY DỰ ÁN

### 1. Backend

Di chuyển vào thư mục backend:

```powershell
cd backend
```

Nếu máy chưa có môi trường Python, tạo virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Cài các package backend cần thiết:

```powershell
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

Chạy migration:

```powershell
python manage.py migrate
```

Nếu muốn tạo lại dữ liệu demo:

```powershell
python manage.py seed_demo_data --reset
```

Khởi động backend:

```powershell
python manage.py runserver
```

Backend mặc định chạy tại:

```text
http://127.0.0.1:8000/
```

### 2. Frontend

Mở terminal khác và chạy:

```powershell
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173/
```

## Tài Khoản Demo

Nếu đã chạy `seed_demo_data`, có thể dùng:

| Vai trò | Username | Email                 | Password |
| --- | --- |-----------------------| --- |
| Admin | `adscamalert` | `adscamalert@gmail.com` | `123456` |
| User | `vietanh` | `vietanh@example.com` | `Demo@123456` |
| User | `ngocanh` | `ngocanh@example.com` | `Demo@123456` |
| User | `thanhtruc` | `thanhtruc@example.com` | `Demo@123456` |


## GHI CHÚ VẬN HÀNH

- API chính dùng base URL `http://127.0.0.1:8000/api/`.
- Frontend được cấu hình cho Vite dev server ở `http://localhost:5173`.
- CORS hiện cho phép `localhost:5173`, `127.0.0.1:5173`, `localhost:5174`, `127.0.0.1:5174`.
- AI moderation dùng cấu hình trong `backend/core/settings.py`:
  - `AI_ANALYSIS_PROVIDER=auto|openai|gemini|local`
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
- Nếu không có API key, hệ thống tự dùng bộ phân tích local để demo không bị gián đoạn.

## NHÓM PHÁT TRIỂN - NHÓM 06 49K14.2

Dự án được xây dựng phục vụ học phần Lập trình Web, tập trung vào luồng nghiệp vụ cộng đồng cảnh báo lừa đảo và kiểm duyệt nội dung.


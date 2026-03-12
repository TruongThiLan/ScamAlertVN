import { Outlet } from 'react-router';
import { Header } from '../components/Header';
import { Toaster } from '../components/ui/sonner';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
      <Toaster />
      
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">ScamAlert VN</h3>
              <p className="text-sm text-gray-600">
                Cộng đồng cảnh báo lừa đảo Việt Nam. Chia sẻ và cập nhật các thủ đoạn lừa đảo mới nhất.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên kết</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/" className="hover:text-red-600">Trang chủ</a></li>
                <li><a href="/search" className="hover:text-red-600">Tìm kiếm</a></li>
                <li><a href="/posts/create" className="hover:text-red-600">Đăng bài</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <p className="text-sm text-gray-600">
                Email: contact@scamalert.vn<br />
                Hotline: 1900 xxxx
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            © 2026 ScamAlert VN. Mọi quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
}

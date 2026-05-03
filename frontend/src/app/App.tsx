import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes';

// NOTE VAN DAP:
// App la diem boc toan bo frontend:
// AuthProvider nap user/token truoc, sau do RouterProvider moi render cac trang.
// Vi vay page nao cung co the dung useAuth() de biet user dang dang nhap hay admin.

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

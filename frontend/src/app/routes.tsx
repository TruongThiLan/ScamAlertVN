import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { PostDetail } from './pages/PostDetail';
import { CreatePost } from './pages/CreatePost';
import { MyPosts } from './pages/MyPosts';
import { SavedPosts } from './pages/SavedPosts';
import { Profile } from './pages/Profile';
import { SearchPage } from './pages/SearchPage';
import { ScamChecker } from './pages/ScamChecker';
import { UserProfile } from './pages/UserProfile';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminUsers } from './pages/admin/Users';
import { AdminPosts } from './pages/admin/Posts';
import { AdminCategories } from './pages/admin/Categories';
import { AdminStatistics } from './pages/admin/Statistics';
import { ReputationHistory } from './pages/ReputationHistory';
import { Outlet, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { EditPost } from './pages/EditPost';
import { useAuth } from './contexts/AuthContext';

// NOTE VAN DAP:
// routes.tsx la ban do man hinh frontend.
// RootLayout la layout user public, AdminLayout la layout admin.
// AdminProtectedRoute chan nguoi khong co role Admin truy cap /admin.

function AuthLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

function AdminProtectedRoute() {
  // Neu user khong phai admin, dieu huong ve trang chu.
  const { is_admin } = useAuth();
  return is_admin ? <Outlet /> : <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      { path: 'scam-checker', Component: ScamChecker },
      { path: 'posts/:id', Component: PostDetail },
      { path: 'posts/create', Component: CreatePost },
      { path: 'posts/:id/edit', Component: EditPost },
      { path: 'my-posts', Component: MyPosts },
      { path: 'saved-posts', Component: SavedPosts },
      { path: 'profile', Component: Profile },
      { path: 'reputation-history', Component: ReputationHistory },
      { path: 'search', Component: SearchPage },
      { path: 'user/:userId', Component: UserProfile },
      { path: 'post/:id', Component: PostDetail },
      { path: 'create-post', Component: CreatePost },
      { path: 'edit-post/:id', Component: EditPost },
    ],
  },
  {
    path: 'admin',
    Component: AdminProtectedRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', Component: AdminStatistics },
          { path: 'users', Component: AdminUsers },
          { path: 'posts', Component: AdminPosts },
          { path: 'categories', Component: AdminCategories },
          { path: 'categories/:id', Component: AdminCategories },
          { path: 'statistics', Component: AdminStatistics },
        ],
      },
    ],
  },
  {
    path: 'login',
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
    ],
  },
  {
    path: 'register',
    Component: AuthLayout,
    children: [
      { index: true, Component: Register },
    ],
  },
  {
    path: 'forgot-password',
    Component: AuthLayout,
    children: [
      { index: true, Component: ForgotPassword },
    ],
  },
  {
    path: 'reset-password',
    Component: AuthLayout,
    children: [
      { index: true, Component: ResetPassword },
    ],
  },
]);

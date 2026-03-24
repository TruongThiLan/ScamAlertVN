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
import { Profile } from './pages/Profile';
import { SearchPage } from './pages/SearchPage';
import { UserProfile } from './pages/UserProfile';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminUsers } from './pages/admin/Users';
import { AdminPosts } from './pages/admin/Posts';
import { AdminCategories } from './pages/admin/Categories';
import { AdminStatistics } from './pages/admin/Statistics';
import { Outlet, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { EditPost } from './pages/EditPost';

function AuthLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      { path: 'posts/:id', Component: PostDetail },
      { path: 'posts/create', Component: CreatePost },
      { path: 'posts/:id/edit', Component: CreatePost },
      { path: 'my-posts', Component: MyPosts },
      { path: 'profile', Component: Profile },
      { path: 'search', Component: SearchPage },
      { path: 'user/:userId', Component: UserProfile },
      { path: 'post/:id', Component: PostDetail },
      { path: 'create-post', Component: CreatePost },
    ],
  },
  {
    path: 'admin',
    Component: AdminLayout,
    children: [
      { index: true, element: <Navigate to="/admin/posts" replace /> },
      { path: 'users', Component: AdminUsers },
      { path: 'posts', Component: AdminPosts },
      { path: 'categories', Component: AdminCategories },
      { path: 'categories/:id', Component: AdminCategories },
      { path: 'statistics', Component: AdminStatistics },
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
  {
  path: 'edit-post/:id',
  element: <EditPost />,
},
]);
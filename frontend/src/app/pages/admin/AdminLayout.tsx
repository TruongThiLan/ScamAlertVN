import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../components/AdminHeader';
import { Category, mockCategories } from './Categories';
import { Post, mockPosts } from './Posts';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  const getPendingCount = (categoryId?: string) => {
    return posts.filter(p => p.status === 'pending' && (!categoryId || p.category.id === categoryId)).length;
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Admin Header */}
      <AdminHeader />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[220px] bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-73px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/posts')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  location.pathname === '/admin/posts' && !new URLSearchParams(location.search).get('category')
                    ? 'bg-[#FFF5F5]'
                    : 'hover:bg-[#FFF5F5]'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#E01515] text-white flex items-center justify-center font-semibold text-sm">
                    {getPendingCount()}
                  </div>
                  <span className={`text-sm transition-colors ${
                    location.pathname === '/admin/posts' && !new URLSearchParams(location.search).get('category')
                      ? 'text-[#E01515] font-medium'
                      : 'text-[#1E293B] group-hover:text-[#E01515]'
                  }`}>
                    Tất cả danh mục
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-colors ${
                  location.pathname === '/admin/posts' && !new URLSearchParams(location.search).get('category')
                    ? 'text-[#E01515]'
                    : 'text-[#99A1AF] group-hover:text-[#E01515]'
                }`} />
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/admin/posts?category=${category.id}`)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                    location.pathname === '/admin/posts' && new URLSearchParams(location.search).get('category') === category.id
                      ? 'bg-[#FFF5F5]'
                      : 'hover:bg-[#FFF5F5]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#E01515] text-white flex items-center justify-center font-semibold text-sm">
                      {getPendingCount(category.id)}
                    </div>
                    <span className={`text-sm transition-colors ${
                      location.pathname === '/admin/posts' && new URLSearchParams(location.search).get('category') === category.id
                        ? 'text-[#E01515] font-medium'
                        : 'text-[#1E293B] group-hover:text-[#E01515]'
                    }`}>
                      {category.name}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-colors ${
                    location.pathname === '/admin/posts' && new URLSearchParams(location.search).get('category') === category.id
                      ? 'text-[#E01515]'
                      : 'text-[#99A1AF] group-hover:text-[#E01515]'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet context={{ categories, setCategories, posts, setPosts }} />
        </div>
      </div>
    </div>
  );
}
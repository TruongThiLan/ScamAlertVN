import { Outlet, useLocation, useNavigate } from 'react-router';
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
    return posts.filter(
      p => p.status === 'pending' && (!categoryId || p.category.id === categoryId)
    ).length;
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const selectedCategory = new URLSearchParams(location.search).get('category');
  const isAllActive = location.pathname === '/admin/posts' && !selectedCategory;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminHeader />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-73px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">
              Danh mục lừa đảo
            </h2>

            <div className="space-y-3">
              {/* Tất cả */}
              <button
                onClick={() => navigate('/admin/posts')}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 ${
                  isAllActive
                    ? 'bg-[#FFF1F1] border-[#F7BABA]'
                    : 'bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 ${
                      isAllActive
                        ? 'bg-[#E01515] text-white'
                        : 'bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]'
                    }`}
                  >
                    {getPendingCount()}
                  </div>

                  <span
                    className={`text-left font-medium transition-colors duration-200 ${
                      isAllActive
                        ? 'text-[#E01515] font-semibold'
                        : 'text-[#111827] group-hover:text-[#E01515]'
                    }`}
                  >
                    Tất cả danh mục
                  </span>
                </div>

                <ChevronRight
                  className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                    isAllActive
                      ? 'text-[#E01515]'
                      : 'text-[#99A1AF] group-hover:text-[#E01515]'
                  }`}
                />
              </button>

              {/* Các danh mục */}
              {categories.map((category) => {
                const pendingCount = getPendingCount(category.id);
                const isActive =
                  location.pathname === '/admin/posts' &&
                  selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/admin/posts?category=${category.id}`)}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFF1F1] border-[#F7BABA]'
                        : 'bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#E01515] text-white'
                            : 'bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]'
                        }`}
                      >
                        {pendingCount}
                      </div>

                      <span
                        className={`text-left font-medium transition-colors duration-200 ${
                          isActive
                            ? 'text-[#E01515] font-semibold'
                            : 'text-[#111827] group-hover:text-[#E01515]'
                        }`}
                      >
                        {category.name}
                      </span>
                    </div>

                    <ChevronRight
                      className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#E01515]'
                          : 'text-[#99A1AF] group-hover:text-[#E01515]'
                      }`}
                    />
                  </button>
                );
              })}
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
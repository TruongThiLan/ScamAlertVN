import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '../../components/AdminHeader';
import api from '../../../api/axiosInstance';

// ─── Types (dùng chung cho toàn bộ admin) ────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

export interface Post {
  id: string;
  title: string;
  author: { id: string; name: string };
  category: { id: string; name: string } | null;
  content: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'LOCKED';
  rejectionReason?: string;
}

// ─── Adapter: Chuyển response API → shape frontend cần ───────────────────────

function adaptPost(raw: any): Post {
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    content: raw.content ?? '',
    createdAt: raw.created_time ?? '',
    status: raw.status ?? 'PENDING',
    rejectionReason: raw.rejection_reason ?? undefined,
    author: raw.user_detail
      ? { id: String(raw.user_detail.id), name: raw.user_detail.username }
      : { id: String(raw.user ?? ''), name: '(unknown)' },
    category: raw.category_detail
      ? { id: String(raw.category_detail.id), name: raw.category_detail.category_name }
      : null,
  };
}

function adaptCategory(raw: any): Category {
  return {
    id: String(raw.id),
    name: raw.category_name ?? '',
    description: raw.description ?? '',
    postCount: raw.post_count ?? 0,
  };
}

// ─── AdminLayout ─────────────────────────────────────────────────────────────

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Kéo danh sách bài (tất cả trạng thái)
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await api.get('posts/all/');
      const results = res.data?.results ?? res.data ?? [];
      setPosts(results.map(adaptPost));
      console.log("DEBUG: Posts Loaded:", results.map(adaptPost));
      console.log("DEBUG: Categories Loaded:", categories);
    } catch (err) {
      console.error('Không thể tải danh sách bài viết:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Kéo danh mục
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('categories/');
      const results = res.data?.results ?? res.data ?? [];
      setCategories(results.map(adaptCategory));
    } catch (err) {
      console.error('Không thể tải danh mục:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  // Kiểm tra quyền admin (dùng role từ AuthContext)
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role?.toLowerCase() !== 'admin') return null;

  const getPendingCount = (categoryId?: string) =>
    posts.filter(
      (p) => 
        String(p.status).toUpperCase() === 'PENDING' && 
        (!categoryId || String(p.category?.id) === String(categoryId))
    ).length;

  const selectedCategory = new URLSearchParams(location.search).get('category');
  const isAllActive = location.pathname === '/admin/posts' && !selectedCategory;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminHeader />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-73px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">Danh mục lừa đảo</h2>

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
                    {loadingPosts ? '…' : getPendingCount()}
                  </div>
                  <span
                    className={`text-left font-medium transition-colors duration-200 ${
                      isAllActive ? 'text-[#E01515] font-semibold' : 'text-[#111827] group-hover:text-[#E01515]'
                    }`}
                  >
                    Tất cả danh mục
                  </span>
                </div>
                <ChevronRight
                  className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                    isAllActive ? 'text-[#E01515]' : 'text-[#99A1AF] group-hover:text-[#E01515]'
                  }`}
                />
              </button>

              {/* Từng danh mục */}
              {loadingCategories ? (
                <p className="text-sm text-[#99A1AF] px-3">Đang tải...</p>
              ) : (
                categories.map((category) => {
                  const pendingCount = getPendingCount(category.id);
                  const isActive =
                    location.pathname === '/admin/posts' && selectedCategory === category.id;

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
                            isActive ? 'text-[#E01515] font-semibold' : 'text-[#111827] group-hover:text-[#E01515]'
                          }`}
                        >
                          {category.name}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                          isActive ? 'text-[#E01515]' : 'text-[#99A1AF] group-hover:text-[#E01515]'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet
            context={{
              categories, setCategories, fetchCategories,
              posts, setPosts, fetchPosts,
              loadingPosts, loadingCategories,
            }}
          />
        </div>
      </div>
    </div>
  );
}
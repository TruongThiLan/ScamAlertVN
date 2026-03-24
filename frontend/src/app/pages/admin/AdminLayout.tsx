import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../components/AdminHeader';
import { Category, mockCategories } from './Categories';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(mockCategories);

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
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF5F5] transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#E01515] text-white flex items-center justify-center font-semibold text-sm">
                      {category.postCount}
                    </div>
                    <span className="text-sm text-[#1E293B] group-hover:text-[#E01515] transition-colors">
                      {category.name}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#99A1AF] group-hover:text-[#E01515] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet context={{ categories, setCategories }} />
        </div>
      </div>
    </div>
  );
}
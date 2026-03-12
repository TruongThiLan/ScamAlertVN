import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { AdminHeader } from '../../components/AdminHeader';

const adminCategories = [
  { id: '1', name: 'Lừa đảo qua điện thoại', count: 45, icon: '📞' },
  { id: '2', name: 'Lừa đảo trực tuyến', count: 78, icon: '💻' },
  { id: '3', name: 'Lừa đảo đầu tư', count: 32, icon: '💰' },
  { id: '4', name: 'Lừa đảo tín dụng đen', count: 21, icon: '💳' },
  { id: '5', name: 'Lừa đảo việc làm', count: 56, icon: '💼' },
  { id: '6', name: 'Lừa đảo mua sắm', count: 89, icon: '🛒' },
  { id: '7', name: 'Lừa đảo giả danh', count: 43, icon: '🎭' },
  { id: '8', name: 'Lừa đảo bất động sản', count: 18, icon: '🏠' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
              {adminCategories.map((category) => (
                <button
                  key={category.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF5F5] transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#E01515] text-white flex items-center justify-center font-semibold text-sm">
                      {category.count}
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
          <Outlet />
        </div>
      </div>
    </div>
  );
}
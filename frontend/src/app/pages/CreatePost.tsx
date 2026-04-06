import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { categories, mockPosts, scamCategories } from '../data/mockData';
import { ArrowLeft, Upload, Send, ChevronRight } from 'lucide-react';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';

export function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const hasUnsavedChanges = title.trim() || content.trim() || category;

  const approvedPosts = mockPosts.filter(post => post.status === 'approved');
  
  const categoryCounts = scamCategories.map(c => approvedPosts.filter(p => p.category.id === c.id).length);
  const maxCategoryCount = Math.max(...categoryCounts, 1);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscard = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    const selectedCategoryData = categories.find(c => c.id === category);
    
    const anonymousCount = mockPosts.filter((p: any) => p.isAnonymous).length + 1;
    const postAuthor = isAnonymous 
      ? { ...user, name: `Người tham gia ẩn danh ${anonymousCount}` } 
      : user;

    const newPost = {
      id: `p${Date.now()}`,
      title: title || 'Bài viết chưa có tiêu đề', 
      content: content,
      category: {
        id: category || 'uncategorized',
        name: selectedCategoryData ? selectedCategoryData.name : 'Chưa phân loại'
      },
      author: postAuthor, 
      isAnonymous: isAnonymous,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      status: 'draft', 
    };

    mockPosts.unshift(newPost as any);
    setShowUnsavedDialog(false); 
    alert('Đã lưu bản nháp thành công!');
    navigate('/my-posts'); 
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const selectedCategoryData = categories.find(c => c.id === category);
    const anonymousCount = mockPosts.filter((p: any) => p.isAnonymous).length + 1;
    const postAuthor = isAnonymous 
      ? { ...user, name: `Người tham gia ẩn danh ${anonymousCount}` } 
      : user;

    const newPost = {
      id: `p${Date.now()}`,
      title: title,
      content: content,
      category: {
        id: category,
        name: selectedCategoryData ? selectedCategoryData.name : 'Chưa phân loại'
      },
      author: postAuthor,
      isAnonymous: isAnonymous,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      status: 'pending', 
    };

    mockPosts.unshift(newPost as any);

    setShowSuccessDialog(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    navigate('/my-posts');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">Danh mục lừa đảo</h2>

            <div className="space-y-3">
              {/* Tất cả */}
              <Link
                to="/"
                className="group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]">
                    {approvedPosts.length}
                  </div>

                  <span className="text-left font-medium transition-colors duration-200 text-[#111827] group-hover:text-[#E01515]">
                    Tất cả
                  </span>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 transition-colors duration-200 text-[#99A1AF] group-hover:text-[#E01515]" />
              </Link>

              {/* Các danh mục */}
              {scamCategories.map((cat) => {
                const categoryPostCount = approvedPosts.filter(
                  (p) => p.category.id === cat.id
                ).length;

                return (
                  <Link
                    key={cat.id}
                    to={`/?category=${cat.id}`}
                    className="group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]">
                        {categoryPostCount}
                      </div>

                      <span className="text-left font-medium transition-colors duration-200 text-[#111827] group-hover:text-[#E01515]">
                        {cat.name}
                      </span>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 transition-colors duration-200 text-[#99A1AF] group-hover:text-[#E01515]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="max-w-[943px] mx-auto px-6 py-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </button>

            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
              <h1 className="text-2xl font-semibold mb-2">Tạo bài viết cảnh báo lừa đảo</h1>
              <p className="text-[#99A1AF] mb-6">
                Chia sẻ thông tin và cảnh báo cho cộng đồng về các hành vi lừa đảo
              </p>

              {/* Anonymous Toggle */}
              <div className="mb-6 pb-6 border-b border-[#D1D5DC]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Đăng bài ẩn danh</h3>
                    <p className="text-sm text-[#99A1AF]">
                      Tên và huy hiệu của bạn sẽ không được thể hiện trên bài viết.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnonymous ? 'bg-[#E01515]' : 'bg-[#D1D5DC]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isAnonymous ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Tiêu đề bài viết <span className="text-[#E01515]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Danh mục / Hình thức lừa đảo <span className="text-[#E01515]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
                >
                  <option value="">Chọn danh mục lừa đảo</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Nội dung bài viết <span className="text-[#E01515]">*</span>
                </label>
                <textarea
                  placeholder="Mô tả chi tiết về hình vị lừa đảo, thủ đoạn, cách nhận biết và phòng tránh..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors resize-none"
                />
                <p className="text-sm text-[#99A1AF] mt-2">
                  Nội dung không được chứa các từ khóa bị cấm, vi phạm pháp luật, quảng cáo hoặc spam
                </p>
              </div>

              {/* Media Upload */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">Hình ảnh / Video</label>
                <button className="flex items-center gap-2 px-4 py-3 rounded-[10px] border border-[#D1D5DC] text-[#4A5565] hover:border-[#E01515] hover:text-[#E01515] transition-colors">
                  <Upload className="h-5 w-5" />
                  <span>Tải ảnh/video lên</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#D1D5DC]">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] text-[#4A5565] hover:bg-[#F3F3F5] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors font-medium"
                >
                  <Send className="h-5 w-5" />
                  Đăng bài
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onDiscard={handleDiscard}
        onSaveDraft={handleSaveDraft}
      />

      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] p-8 w-full max-w-[360px] text-center shadow-xl">
            <h2 className="text-xl font-bold text-[#1E293B] mb-4">Thông báo</h2>
            <p className="text-[#1E293B] mb-8">Tạo bài viết thành công</p>
            <button
              onClick={handleCloseSuccess}
              className="w-full py-3 bg-[#E01515] hover:bg-[#C10007] text-white font-semibold rounded-[8px] transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
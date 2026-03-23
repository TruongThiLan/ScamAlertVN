import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router'; // Thêm Link
import { useAuth } from '../contexts/AuthContext';
import { categories, mockPosts, scamCategories } from '../data/mockData'; // Thêm mockPosts và scamCategories
import { ArrowLeft, Upload, Send, ChevronRight } from 'lucide-react'; // Thêm ChevronRight
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';

export function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const hasUnsavedChanges = title.trim() || content.trim() || category;

  // Lấy dữ liệu để đếm số bài viết cho thanh danh mục bên trái
  const approvedPosts = mockPosts.filter(post => post.status === 'approved');

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
    alert('Đã lưu bản nháp');
    navigate(-1);
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const selectedCategoryData = categories.find(c => c.id === category);

    const newPost = {
      id: `p${Date.now()}`,
      title: title,
      content: content,
      category: {
        id: category,
        name: selectedCategoryData ? selectedCategoryData.name : 'Chưa phân loại'
      },
      author: user,
      isAnonymous: isAnonymous,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      status: 'approved',
    };

    mockPosts.unshift(newPost as any);

    alert('Đã đăng bài viết thành công!');
    navigate('/my-posts');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Bắt đầu chia cột bằng Flex */}
      <div className="flex">
        
        {/* === THÊM MỚI: CỘT BÊN TRÁI === */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen sticky top-[70px] h-[calc(100vh-70px)] overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <Link
                to="/"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm transition-colors hover:bg-gray-50`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: '#E01515' }}
                  >
                    {approvedPosts.length}
                  </div>
                  <span className="text-left">Tất cả</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#99A1AF]" />
              </Link>

              {scamCategories.map(cat => {
                const categoryPostCount = approvedPosts.filter(p => p.category.id === cat.id).length;
                return (
                  <Link
                    key={cat.id}
                    to={`/?category=${cat.id}`}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm transition-colors hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: '#E01515' }}
                      >
                        {categoryPostCount}
                      </div>
                      <span className="text-left text-xs">{cat.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#99A1AF]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* === GIỮ NGUYÊN HOÀN TOÀN: CỘT BÊN PHẢI (Form tạo bài viết) === */}
        <main className="flex-1">
          {/* Chỗ này giữ y chang class cũ của bạn: max-w-[943px] mx-auto px-6 py-8 */}
          <div className="max-w-[943px] mx-auto px-6 py-8">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </button>

            {/* Form Card */}
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#D1D5DC]">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] text-[#4A5565] hover:bg-[#F3F3F5] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
                >
                  <Send className="h-5 w-5" />
                  Đăng bài
                </button>
              </div>
            </div>
          </div>
        </main>

      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onDiscard={handleDiscard}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/mockData';
import { ArrowLeft, Upload, Send } from 'lucide-react';
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
    // TODO: Save as draft
    alert('Đã lưu bản nháp');
    navigate(-1);
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // TODO: Submit post to backend
    console.log({
      title,
      category,
      content,
      isAnonymous,
    });

    alert('Đã đăng bài viết thành công!');
    navigate('/my-posts');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
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
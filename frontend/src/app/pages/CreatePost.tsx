import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { scamCategories } from '../data/mockData';
import { ArrowLeft, Upload, Send, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import api from '../../api/axiosInstance';
import { toast } from 'sonner';

export function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('categories/');
        setCategories(res.data.map((c: any) => ({ id: c.id, name: c.category_name })));
      } catch (err) {
        toast.error('Không thể tải danh mục');
      }
    };
    fetchCategories();
  }, []);

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
    setShowUnsavedDialog(false); 
    alert('Đã lưu bản nháp thành công!');
    navigate('/my-posts'); 
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category || !content.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      formData.append('is_anonymous', String(isAnonymous));

      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post('posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowSuccessDialog(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Đã có lỗi xảy ra khi đăng bài';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setImages(prev => [...prev, url]);
        setSelectedFiles(prev => [...prev, file]);
      }
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
              <Link
                to="/"
                className="group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]">
                    {categories.reduce((acc, c) => acc + ((c as any).post_count || 0), 0)}
                  </div>
                  <span className="text-left font-medium transition-colors duration-200 text-[#111827] group-hover:text-[#E01515]">
                    Tất cả
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 transition-colors duration-200 text-[#99A1AF] group-hover:text-[#E01515]" />
              </Link>

              {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/?category=${cat.id}`}
                    className="group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]">
                        {(cat as any).post_count || 0}
                      </div>
                      <span className="text-left font-medium transition-colors duration-200 text-[#111827] group-hover:text-[#E01515]">
                        {cat.name}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 transition-colors duration-200 text-[#99A1AF] group-hover:text-[#E01515]" />
                  </Link>
                ))}
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

              <div className="mb-6 pb-6 border-b border-[#D1D5DC]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Đăng bài ẩn danh</h3>
                    <p className="text-sm text-[#99A1AF]">
                      Tên của bạn sẽ được hiển thị dưới dạng "Người dùng ẩn danh" kèm theo ID.
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
                <label className="block font-semibold mb-2">Hình ảnh chứng minh</label>
                
                {/* Preview Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#D1D5DC] group">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-[#E01515] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-[10px] border-2 border-dashed border-[#D1D5DC] flex flex-col items-center justify-center gap-1 text-[#99A1AF] hover:border-[#E01515] hover:text-[#E01515] transition-all cursor-pointer">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-medium">Thêm ảnh</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  </div>
                )}

                {images.length === 0 && (
                  <label className="flex flex-col items-center justify-center gap-3 w-full p-10 rounded-[10px] border-2 border-dashed border-[#D1D5DC] text-[#4A5565] hover:border-[#E01515] hover:text-[#E01515] transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#F3F3F5] flex items-center justify-center">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Tải ảnh/video minh chứng</p>
                      <p className="text-xs text-[#99A1AF]">Hỗ trợ JPG, PNG, GIF (Tối đa 5MB)</p>
                    </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                  </label>
                )}
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
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors font-medium ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {isSubmitting ? 'Đang xử lý...' : 'Đăng bài'}
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
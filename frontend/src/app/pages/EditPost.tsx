import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, ChevronRight, Plus, X, Upload, Loader2 } from 'lucide-react';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { getCategoryBadgeStyle } from '../utils/colorUtils';
import api from '../../api/axiosInstance';
import { toast } from 'sonner';

type CategoryOption = {
  id: string;
  name: string;
  post_count: number;
};

async function fetchAllResults<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await api.get(nextUrl);
    const data = res.data;

    if (Array.isArray(data)) {
      items.push(...data);
      break;
    }

    items.push(...(Array.isArray(data?.results) ? data.results : []));
    nextUrl = data?.next ?? null;
  }

  return items;
}

export function EditPost() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [categoryResults, postRes, postResults] = await Promise.all([
          fetchAllResults<any>('categories/'),
          api.get(`posts/${id}/`),
          fetchAllResults<any>('posts/')
        ]);

        const approvedPosts = postResults.filter((item) => item.status === 'APPROVED');
        setUncategorizedCount(approvedPosts.filter((item) => !item.category_detail && !item.category).length);
        setCategoriesList(categoryResults.map((c: any) => ({
          id: String(c.id),
          name: c.category_name,
          post_count: approvedPosts.filter(
            (item) => String(item.category_detail?.id ?? item.category ?? '') === String(c.id)
          ).length,
        })));
        
        const post = postRes.data;
        // Verify ownership (optional check, backend enforces)
        if (Number(post.user) !== user.id && post.user_detail?.id !== user.id) {
          toast.error('Bạn không có quyền sửa bài viết này!');
          navigate('/my-posts');
          return;
        }

        // Verify status
        if (post.status === 'APPROVED') {
          toast.error('Không thể chỉnh sửa bài viết đã được duyệt!');
          navigate('/my-posts');
          return;
        }

        setTitle(post.title || '');
        setCategory(String(post.category || ''));
        setContent(post.content || '');
        setIsAnonymous(post.is_anonymous || false);
        setImages(post.images || []);
      } catch (err: any) {
        toast.error('Không tìm thấy bài viết hoặc bạn không có quyền truy cập');
        navigate('/my-posts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);

  if (!user) return null;

  const hasUnsavedChanges = title.trim() || content.trim() || category;
  const maxCategoryCount = Math.max(...categoriesList.map(c => (c as any).post_count || 0), 1);

  const handleBack = () => {
    setShowUnsavedDialog(true);
  };

  const handleDiscard = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    const draft = {
      title: title || 'Bài viết chưa có tiêu đề',
      content: content,
      category: category,
      isAnonymous: isAnonymous,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`draft_post_${id}`, JSON.stringify(draft));
    setShowUnsavedDialog(false);
    toast.success('Đã lưu bản nháp vào trình duyệt!');
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
      
      // Gửi danh sách ảnh hiện có (đã lọc) dưới dạng chuỗi JSON
      formData.append('images', JSON.stringify(images));

      // Thêm các file mới
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      await api.put(`posts/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowSuccessDialog(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Đã có lỗi xảy ra khi cập nhật bài';
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
    const imageUrlToRemove = images[index];
    
    // Nếu là ảnh mới (blob URL), xóa khỏi selectedFiles
    if (imageUrlToRemove.startsWith('blob:')) {
      const blobIndex = images.slice(0, index).filter(url => url.startsWith('blob:')).length;
      setSelectedFiles(prev => prev.filter((_, i) => i !== blobIndex));
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-70px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-left">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/')} className="w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B]">
                    {categoriesList.reduce((acc, c) => acc + c.post_count, 0) + uncategorizedCount}
                  </div>
                  <span>Tất cả</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </button>
              {categoriesList.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => navigate(`/?category=${cat.id}`)} 
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base hover:bg-gray-50 ${String(cat.id) === String(category) ? 'bg-[#FFF5F5] border-l-4 border-[#E01515]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B]">
                      {cat.post_count}
                    </div>
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                </button>
              ))}
              {uncategorizedCount > 0 && (
                <button
                  onClick={() => navigate('/?category=uncategorized')}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 bg-[#F3F4F6] text-[#64748B]">
                      {uncategorizedCount}
                    </div>
                    <span>Chưa phân loại</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-[943px] mx-auto px-6 py-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6">
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </button>
            
            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 text-left">
              <h1 className="text-2xl font-semibold mb-2 text-left">Chỉnh sửa bài viết</h1>
              <p className="text-[#99A1AF] mb-6 text-left">Cập nhật lại thông tin cảnh báo của bạn</p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b">
                   <div className="text-left">
                    <h3 className="font-semibold">Đăng bài ẩn danh</h3>
                    <p className="text-sm text-[#99A1AF]">Tên của bạn sẽ được hiển thị dưới dạng "Người dùng ẩn danh" kèm theo ID.</p>
                  </div>
                  <button onClick={() => setIsAnonymous(!isAnonymous)} className={`relative w-12 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-[#E01515]' : 'bg-[#D1D5DC]'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="text-left">
                  <label className="block font-semibold mb-2">Tiêu đề bài viết <span className="text-[#E01515]">*</span></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515]" />
                </div>

                <div className="text-left">
                  <label className="block font-semibold mb-2">Danh mục <span className="text-[#E01515]">*</span></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515]">
                    <option value="">Chọn danh mục lừa đảo</option>
                    {categoriesList.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>

                <div className="text-left">
                  <label className="block font-semibold mb-2">Nội dung bài viết <span className="text-[#E01515]">*</span></label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none" />
                </div>

                <div className="text-left">
                  <label className="block font-semibold mb-2">Hình ảnh chứng minh</label>
                  
                  {/* Preview Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#D1D5DC] group">
                          <img src={url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`} alt="Preview" className="w-full h-full object-cover" />
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
                          accept="image/*" 
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
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button onClick={handleBack} className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">Hủy</button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors font-medium ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật bài'}
                  </button>
                </div>
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
            <h2 className="text-xl font-bold mb-4">Thông báo</h2>
            <p className="mb-8">Cập nhật bài viết thành công!</p>
            <button onClick={() => { setShowSuccessDialog(false); navigate('/my-posts'); }} className="w-full py-3 bg-[#E01515] text-white font-semibold rounded-[8px]">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

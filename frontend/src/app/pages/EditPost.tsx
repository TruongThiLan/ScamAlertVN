import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { categories, mockPosts, scamCategories } from '../data/mockData';
import { ArrowLeft, Send, ChevronRight } from 'lucide-react';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { Header } from '../components/Header'; 

export function EditPost() {
  const { id } = useParams<{ id: string }>(); 
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
      return;
    }

    const postToEdit: any = mockPosts.find(p => p.id === id);
    if (postToEdit) {
      if (postToEdit.author.id !== user.id) {
        alert('Bạn không có quyền sửa bài viết này!');
        navigate('/my-posts');
        return;
      }
      setTitle(postToEdit.title === 'Bài viết chưa có tiêu đề' ? '' : postToEdit.title);
      setCategory(postToEdit.category.id === 'uncategorized' ? '' : postToEdit.category.id);
      setContent(postToEdit.content);
      setIsAnonymous(postToEdit.isAnonymous || false);
    } else {
      alert('Không tìm thấy bài viết!');
      navigate('/my-posts');
    }
  }, [id, user, navigate]);

  if (!user) return null;

  const hasUnsavedChanges = title.trim() || content.trim() || category;
  const approvedPosts = mockPosts.filter(post => post.status === 'approved');

  const handleBack = () => {
    setShowUnsavedDialog(true);
  };

  const handleDiscard = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    const postIndex = mockPosts.findIndex(p => p.id === id);
    if (postIndex !== -1) {
      const selectedCategoryData = categories.find(c => c.id === category);
      mockPosts[postIndex] = {
        ...mockPosts[postIndex],
        title: title || 'Bài viết chưa có tiêu đề',
        content: content,
        category: {
          id: category || 'uncategorized',
          name: selectedCategoryData ? selectedCategoryData.name : 'Chưa phân loại'
        },
        isAnonymous: isAnonymous,
        updatedAt: new Date().toISOString(),
        status: 'draft', 
      } as any;
    }
    setShowUnsavedDialog(false);
    alert('Đã cập nhật bản nháp thành công!');
    navigate('/my-posts');
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const postIndex = mockPosts.findIndex(p => p.id === id);
    if (postIndex !== -1) {
      const selectedCategoryData = categories.find(c => c.id === category);
      mockPosts[postIndex] = {
        ...mockPosts[postIndex],
        title: title,
        content: content,
        category: {
          id: category,
          name: selectedCategoryData ? selectedCategoryData.name : 'Chưa phân loại'
        },
        isAnonymous: isAnonymous,
        updatedAt: new Date().toISOString(),
        status: 'pending', 
      } as any; 
    }
    setShowSuccessDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-70px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-left">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/')} className="w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm bg-[#E01515]">
                    {approvedPosts.length}
                  </div>
                  <span>Tất cả</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </button>
              {scamCategories.map(cat => (
                <button key={cat.id} onClick={() => navigate(`/?category=${cat.id}`)} className="w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm bg-[#E01515]">
                      {approvedPosts.filter(p => p.category.id === cat.id).length}
                    </div>
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                </button>
              ))}
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
                    <p className="text-sm text-[#99A1AF]">Tên và huy hiệu của bạn sẽ không được thể hiện trên bài viết.</p>
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
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>

                <div className="text-left">
                  <label className="block font-semibold mb-2">Nội dung bài viết <span className="text-[#E01515]">*</span></label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full px-4 py-3 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none" />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button onClick={handleBack} className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">Hủy</button>
                  <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors font-medium">
                    <Send className="h-5 w-5" /> Cập nhật bài
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
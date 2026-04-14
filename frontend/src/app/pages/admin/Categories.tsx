import { useState } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import api from '../../../api/axiosInstance';
import type { Category } from './AdminLayout';

type DialogType = 'add' | 'edit' | 'delete' | null;

interface OutletCtx {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  fetchCategories: () => Promise<void>;
  loadingCategories: boolean;
}

export function AdminCategories() {
  const { categories, setCategories, fetchCategories, loadingCategories } =
    useOutletContext<OutletCtx>();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openDialog = (type: DialogType, category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description);
    }
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setShowAddForm(false);
  };

  // ─── Thêm / Sửa danh mục ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);
    try {
      if (dialogType === 'add') {
        const res = await api.post('categories/', {
          category_name: categoryName,
          description: categoryDescription,
        });
        // Thêm ngay vào state local, không cần fetch lại toàn bộ
        const raw = res.data;
        setCategories((prev) => [
          ...prev,
          {
            id: String(raw.id),
            name: raw.category_name,
            description: raw.description ?? '',
            postCount: 0,
          },
        ]);
        toast.success('Đã thêm danh mục mới');

      } else if (dialogType === 'edit' && selectedCategory) {
        await api.patch(`categories/${selectedCategory.id}/`, {
          category_name: categoryName,
          description: categoryDescription,
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === selectedCategory.id
              ? { ...c, name: categoryName, description: categoryDescription }
              : c
          )
        );
        toast.success('Đã cập nhật danh mục');
      }
      closeDialog();
    } catch (err: any) {
      const msg =
        err?.response?.data?.category_name?.[0] ||
        err?.response?.data?.detail ||
        Object.values(err?.response?.data ?? {}).flat().join(' ') ||
        'Đã xảy ra lỗi, vui lòng thử lại.';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Xóa danh mục ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await api.delete(`categories/${selectedCategory.id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id));
      toast.success('Đã xóa danh mục');
      closeDialog();
    } catch (err: any) {
      // Backend sẽ trả 400 nếu danh mục còn bài viết
      const msg =
        err?.response?.data?.detail ||
        'Không thể xóa danh mục này. Vui lòng thử lại.';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Quản lý danh mục lừa đảo</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) openDialog('add');
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Thêm danh mục
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Thêm danh mục mới</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên danh mục</label>
              <input
                type="text"
                placeholder="Nhập tên danh mục..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mô tả</label>
              <textarea
                placeholder="Nhập mô tả danh mục..."
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="w-full min-h-[100px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 rounded-[8px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu
              </button>
              <button
                onClick={closeDialog}
                className="px-6 py-2 rounded-[8px] bg-[#99A1AF] text-white hover:bg-[#4A5565] transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loadingCategories ? (
        <div className="flex items-center justify-center py-20 text-[#99A1AF]">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Đang tải danh mục...
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{category.name}</h3>
                    <span className="text-sm text-[#99A1AF]">{category.postCount} bài viết</span>
                  </div>
                  <p className="text-sm text-[#4A5565]">{category.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openDialog('edit', category)}
                    className="p-2 rounded-[8px] border border-[#D1D5DC] text-[#4A5565] hover:border-[#E01515] hover:text-[#E01515] transition-colors"
                    title="Sửa"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openDialog('delete', category)}
                    className="p-2 rounded-[8px] border border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogType === 'edit'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sửa danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên danh mục</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mô tả</label>
              <textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="w-full min-h-[100px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}
              className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={submitting}
              className="bg-[#E01515] text-white hover:bg-[#C10007]">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogType === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Xác nhận xóa danh mục</DialogTitle>
          </DialogHeader>
          <div className="bg-[#FFF5F5] border border-[#E01515] rounded-[8px] p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-[#E01515] flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-[#E01515] mb-1">Cảnh báo!</p>
              <p className="text-sm text-[#E01515]">
                Bạn có chắc chắn muốn xóa danh mục &quot;{selectedCategory?.name}&quot; không?
              </p>
            </div>
          </div>
          <p className="text-sm text-[#4A5565]">
            Danh mục này có <span className="font-semibold">{selectedCategory?.postCount} bài viết</span>.
            {selectedCategory?.postCount && selectedCategory.postCount > 0
              ? ' Không thể xóa khi còn bài viết đang sử dụng.'
              : ' Hành động này không thể hoàn tác.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}
              className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button
              onClick={handleDelete}
              disabled={submitting || (selectedCategory?.postCount ?? 0) > 0}
              className="bg-[#E01515] text-white hover:bg-[#C10007] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

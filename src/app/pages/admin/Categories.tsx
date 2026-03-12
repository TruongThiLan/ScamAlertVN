import { useState } from 'react';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

interface Category {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Lừa đảo qua điện thoại',
    description: 'Các hình thức lừa đảo qua cuộc gọi điện thoại, tin nhắn SMS',
    postCount: 45,
  },
  {
    id: '2',
    name: 'Lừa đảo trực tuyến',
    description: 'Lừa đảo qua mạng xã hội, email, website giả mạo',
    postCount: 78,
  },
  {
    id: '3',
    name: 'Lừa đảo đầu tư',
    description: 'Chiêu trò lừa đảo đầu tư tiền ảo, chứng khoán, đa cấp',
    postCount: 32,
  },
  {
    id: '4',
    name: 'Lừa đảo tín dụng đen',
    description: 'Cho vay lãi suất cao, đòi nợ bằng nhiều thủ đoạn',
    postCount: 21,
  },
  {
    id: '5',
    name: 'Lừa đảo việc làm',
    description: 'Tuyển dụng giả, yêu cầu đặt cọc, lừa phí môi giới',
    postCount: 56,
  },
  {
    id: '6',
    name: 'Lừa đảo mua sắm',
    description: 'Shop online lừa đảo, hàng giả, hàng nhái',
    postCount: 89,
  },
  {
    id: '7',
    name: 'Lừa đảo giả danh',
    description: 'Giả danh cơ quan nhà nước, công an, ngân hàng',
    postCount: 43,
  },
  {
    id: '8',
    name: 'Lừa đảo bất động sản',
    description: 'Lừa đảo mua bán, cho thuê nhà đất',
    postCount: 18,
  },
];

type DialogType = 'add' | 'edit' | 'delete' | null;

export function AdminCategories() {
  const [categories, setCategories] = useState(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

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

  const handleSave = () => {
    if (dialogType === 'add') {
      // TODO: Add category
      console.log('Add category:', { categoryName, categoryDescription });
    } else if (dialogType === 'edit') {
      // TODO: Edit category
      console.log('Edit category:', { id: selectedCategory?.id, categoryName, categoryDescription });
    }
    closeDialog();
  };

  const handleDelete = () => {
    // TODO: Delete category
    console.log('Delete category:', selectedCategory?.id);
    closeDialog();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Quản lý danh mục lừa đảo</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              openDialog('add');
            }
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Thêm danh mục
        </button>
      </div>

      {/* Add/Edit Form */}
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
                className="px-6 py-2 rounded-[8px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
              >
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

      {/* Edit Dialog */}
      <Dialog open={dialogType === 'edit'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Tên danh mục</DialogTitle>
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
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleSave} className="bg-[#E01515] text-white hover:bg-[#C10007]">
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
            Danh mục này có <span className="font-semibold">{selectedCategory?.postCount} bài viết</span>. Hành động này
            không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleDelete} className="bg-[#E01515] text-white hover:bg-[#C10007]">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

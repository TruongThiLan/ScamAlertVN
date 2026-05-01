lines = open('D:/HK6/ScamAlertVN/frontend/src/app/pages/PostDetail.tsx', 'r', encoding='utf-8').readlines()

# Part1: lines 0-435 (renderComment + helpers)
part1 = lines[0:436]

# Bridge: return + layout
bridge = [
  '  return (\r\n',
  '    <div className="min-h-screen bg-[#F9FAFB]">\r\n',
  '      <div className="flex">\r\n',
  '        <aside className="w-[300px] shrink-0 bg-white border-r border-[#D1D5DC] sticky top-0 h-screen overflow-y-auto">\r\n',
  '          <div className="p-6">\r\n',
  '            <h2 className="text-base font-semibold mb-4 text-[#111827]">Danh muc lua dao</h2>\r\n',
  '            <div className="space-y-2">\r\n',
  '              {categories.map((category) => {\r\n',
  '                const isActive = category.id === post?.category;\r\n',
  '                return (\r\n',
  '                  <Link key={category.id} to={`/?category=${category.id}`}\r\n',
  '                    className={`flex items-center justify-between px-3 py-2 rounded-[8px] border transition-all ${\r\n',
  '                      isActive ? "bg-[#FFF1F1] border-[#F7BABA] text-[#E01515]" : "border-transparent hover:bg-[#FFF5F5] text-[#111827]"}`}>\r\n',
  '                    <span className="text-sm font-medium">{category.category_name}</span>\r\n',
  '                    <ChevronRight className="h-4 w-4 shrink-0" />\r\n',
  '                  </Link>\r\n',
  '                );\r\n',
  '              })}\r\n',
  '            </div>\r\n',
  '          </div>\r\n',
  '        </aside>\r\n',
  '        <main className="flex-1 max-w-3xl mx-auto px-6 py-6">\r\n',
]

# Part2: Post Card block lines 529-667 (0-indexed 528-666)
part2 = lines[529:668]

# Fix the broken like button ending (was </Button></form>) 
fix_like_end = [
  '                >\r\n',
  '                  <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />\r\n',
  '                  <span>{likesCount}</span>\r\n',
  '                </button>\r\n',
  '                <button onClick={handleShare}\r\n',
  '                  className="flex items-center gap-2 text-[#99A1AF] hover:text-[#E01515] transition-colors">\r\n',
  '                  <Share2 className="h-5 w-5" />\r\n',
  '                  <span>Chia se</span>\r\n',
  '                </button>\r\n',
  '              </div>\r\n',
  '            </div>\r\n',
]

# Comment input section (clean)
comment_section = [
  '            {/* Comment Input */}\r\n',
  '            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-4 mb-4">\r\n',
  '              {user ? (\r\n',
  '                <div className="flex flex-col gap-3">\r\n',
  '                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}\r\n',
  '                    placeholder="Viet binh luan..." rows={3}\r\n',
  '                    className="w-full px-3 py-2 border border-[#D1D5DC] rounded-[8px] resize-none focus:outline-none focus:border-[#E01515]" />\r\n',
  '                  {newCommentImage && (\r\n',
  '                    <div className="relative w-24">\r\n',
  '                      <img src={newCommentImage.previewUrl} className="w-24 h-24 object-cover rounded" alt="preview" />\r\n',
  '                      <button onClick={removeCommentImage}\r\n',
  '                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">\r\n',
  '                        <X className="h-3 w-3" />\r\n',
  '                      </button>\r\n',
  '                    </div>\r\n',
  '                  )}\r\n',
  '                  <div className="flex items-center justify-between">\r\n',
  '                    <label className="cursor-pointer text-[#99A1AF] hover:text-[#E01515] transition-colors">\r\n',
  '                      <Camera className="h-5 w-5" />\r\n',
  '                      <input type="file" accept="image/*" className="hidden" onChange={handleCommentImageChange} />\r\n',
  '                    </label>\r\n',
  '                    <button onClick={handleAddComment} disabled={!newComment.trim() && !newCommentImage}\r\n',
  '                      className="flex items-center gap-2 px-4 py-2 bg-[#E01515] text-white rounded-[8px] hover:bg-[#C10007] disabled:bg-gray-300 transition-colors">\r\n',
  '                      <Send className="h-4 w-4" />\r\n',
  '                      <span>Gui</span>\r\n',
  '                    </button>\r\n',
  '                  </div>\r\n',
  '                </div>\r\n',
  '              ) : (\r\n',
  '                <p className="text-center text-[#99A1AF] py-4">Vui long dang nhap de binh luan</p>\r\n',
  '              )}\r\n',
  '            </div>\r\n',
]

# Part3: comments list + dialogs (lines 712-756, 0-indexed 711-755)
part3 = lines[712:757]

result = part1 + bridge + part2 + fix_like_end + comment_section + part3

with open('D:/HK6/ScamAlertVN/frontend/src/app/pages/PostDetail.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.writelines(result)

print(f'Done! Total lines: {len(result)}')

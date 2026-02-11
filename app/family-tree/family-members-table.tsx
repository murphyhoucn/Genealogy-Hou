"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { FamilyMember } from "./actions";
import {
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMembers,
  fetchAllMembersForSelect,
  fetchAllMembersForMatching,
  fetchMemberByUid,
} from "./actions";
import { ImportMembersDialog } from "./import-members-dialog";
import { FatherCombobox } from "./father-combobox";
import { RichTextEditor } from "@/components/rich-text/editor";
import { RichTextViewer } from "@/components/rich-text/viewer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Base62编码函数
function base62Encode(num: number): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (num === 0) return alphabet[0];
  
  const arr = [];
  const base = alphabet.length;
  while (num) {
    const rem = num % base;
    num = Math.floor(num / base);
    arr.push(alphabet[rem]);
  }
  
  return arr.reverse().join('');
}

// 生成自定义ID
function generateCustomId(name: string): string {
  const timestamp = Date.now();
  const nameEncode = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const randomSalt = Math.floor(Math.random() * 90000) + 10000;
  const rawStr = `${timestamp}-${nameEncode}-${randomSalt}`;
  
  // 使用简单的哈希函数代替MD5
  let hash = 0;
  for (let i = 0; i < rawStr.length; i++) {
    const char = rawStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const hashUnsigned = Math.abs(hash);
  const b62Str = base62Encode(hashUnsigned);
  let resultId = b62Str.slice(-6);
  
  // 如果不够6位，用随机字符填充
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (resultId.length < 6) {
    resultId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return resultId;
}

// 生成完整的成员ID
function generateFullId(name: string, generation: number | null): string {
  if (!generation) {
    return `G0-${generateCustomId(name)}`;
  }
  return `G${generation}-${generateCustomId(name)}`;
}

interface FamilyMembersTableProps {
  initialData: FamilyMember[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
}

export function FamilyMembersTable({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
}: FamilyMembersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(searchQuery);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingParents, setIsLoadingParents] = React.useState(false);
  const [loadingFatherUid, setLoadingFatherUid] = React.useState<string | null>(null);

  const [editingMember, setEditingMember] = React.useState<FamilyMember | null>(null);
  const [biographyMember, setBiographyMember] = React.useState<FamilyMember | null>(null);
  const [parentOptions, setParentOptions] = React.useState<
    { id: number; name: string; generation: number | null; uid: string | null }[]
  >([]);
  
  // 新增：存储所有成员数据用于父亲姓名匹配
  const [allMembersForMatching, setAllMembersForMatching] = React.useState<FamilyMember[]>(initialData);

  // 新增表单状态
  const [formData, setFormData] = React.useState({
    name: "",
    generation: "",
    sibling_order: "",
    father_uid: "",
    gender: "",
    official_position: "",
    is_alive: true,
    spouse: "",
    bio: "",
    birth_date: "",
    death_date: "",
    residence_place: "",
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // 判断是否为编辑模式
  const isEditMode = editingMember !== null;

  // 加载所有成员数据用于自定义ID匹配
  React.useEffect(() => {
    fetchAllMembersForMatching()
      .then(setAllMembersForMatching)
      .catch(error => console.error("Failed to load all members:", error));
  }, []);

  // 刷新所有成员数据的函数
  const refreshAllMembers = React.useCallback(async () => {
    try {
      const allMembers = await fetchAllMembersForMatching();
      setAllMembersForMatching(allMembers);
    } catch (error) {
      console.error("Failed to refresh all members:", error);
    }
  }, []);

  // 加载父亲选择列表
  React.useEffect(() => {
    if (isDialogOpen) {
      setIsLoadingParents(true);
      fetchAllMembersForSelect()
        .then(setParentOptions)
        .finally(() => setIsLoadingParents(false));
    }
  }, [isDialogOpen]);

  const updateUrlParams = (params: Record<string, string>) => {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      router.push(`/family-tree?${newParams.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage.toString() });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(initialData.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedIds.size} 条记录吗？`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const result = await deleteFamilyMembers(Array.from(selectedIds));
    setIsDeleting(false);

    if (result.success) {
      setSelectedIds(new Set());
      router.refresh();
      // 刷新所有成员数据用于匹配
      refreshAllMembers();
    } else {
      alert(`删除失败: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      generation: "",
      sibling_order: "",
      father_uid: "",
      gender: "",
      official_position: "",
      is_alive: true,
      spouse: "",
      bio: "",
      birth_date: "",
      death_date: "",
      residence_place: "",
    });
    setEditingMember(null);
  };

  // 打开新增弹窗
  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleOpenEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      generation: member.generation?.toString() ?? "",
      sibling_order: member.sibling_order?.toString() ?? "",
      father_uid: member.father_uid ?? "",
      gender: member.gender ?? "",
      official_position: member.official_position ?? "",
      is_alive: member.is_alive,
      spouse: member.spouse ?? "",
      bio: member.bio ?? "",
      birth_date: member.birth_date?.toString() ?? "",
      death_date: member.death_date?.toString() ?? "",
      residence_place: member.residence_place ?? "",
    });
    setIsDialogOpen(true);
  };

  // 关闭弹窗
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("请输入姓名");
      return;
    }

    setIsSubmitting(true);

    // 为新增成员生成自定义UID
    let uid: string | null = null;
    if (!isEditMode) {
      uid = generateFullId(formData.name.trim(), formData.generation ? parseInt(formData.generation) : null);
      console.log('🆔 生成的UID:', uid);
    }

    const memberData = {
      name: formData.name.trim(),
      generation: formData.generation ? parseInt(formData.generation) : null,
      sibling_order: formData.sibling_order
        ? parseInt(formData.sibling_order)
        : null,
      father_uid: formData.father_uid || null,
      gender: (formData.gender as "男" | "女") || null,
      official_position: formData.official_position || null,
      is_alive: formData.is_alive,
      spouse: formData.spouse || null,
      bio: formData.bio || null,
      uid: uid,
      birth_date: formData.birth_date || null,
      death_date: (!formData.is_alive && formData.death_date) ? formData.death_date : null,
      residence_place: formData.residence_place || null,
    };

    const result = isEditMode && editingMember
      ? await updateFamilyMember({ ...memberData, id: editingMember.id })
      : await createFamilyMember(memberData);

    setIsSubmitting(false);

    if (result.success) {
      handleCloseDialog();
      router.refresh();
      // 刷新所有成员数据用于匹配
      refreshAllMembers();
    } else {
      alert(`${isEditMode ? "更新" : "添加"}失败: ${result.error}`);
    }
  };

  const allSelected =
    initialData.length > 0 && selectedIds.size === initialData.length;

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* 搜索 */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
          <Input
            placeholder="搜索姓名..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="submit" variant="outline" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {/* 操作按钮 - 只有登录用户才能看到 */}
        {isLoggedIn && (
          <div className="flex gap-2 flex-wrap w-full lg:w-auto">
            <ImportMembersDialog onSuccess={() => {
              router.refresh();
              // 刷新所有成员数据用于匹配
              refreshAllMembers();
            }} />
            
            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新增
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selectedIds.size === 0 || isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        )}
        
        {/* 未登录提示 */}
        {!authLoading && !isLoggedIn && (
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            📌 当前为访客模式，可查看数据但不能编辑。
            <a href="/auth/login" className="ml-2 underline hover:no-underline">点击登录</a>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0"
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{isEditMode ? "编辑成员" : "新增成员"}</DialogTitle>
            <DialogDescription>
              填写成员信息后点击保存
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitMember} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
                {/* 姓名 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    姓名 *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>

                {/* 父亲 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="father_uid" className="text-right">
                    父亲
                  </Label>
                  <div className="col-span-3">
                    <FatherCombobox
                      value={formData.father_uid}
                      options={parentOptions}
                      isLoading={isLoadingParents}
                      onChange={(value) => {
                        const father = parentOptions.find(p => p.uid === value);
                        const newGeneration = father && father.generation !== null 
                          ? (father.generation + 1).toString() 
                          : (value ? formData.generation : "");
                        setFormData({ 
                          ...formData, 
                          father_uid: value, 
                          generation: newGeneration 
                        });
                      }}
                    />
                  </div>
                </div>

                {/* 世代 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="generation" className="text-right">
                    世代
                  </Label>
                  <Input
                    id="generation"
                    type="number"
                    value={formData.generation}
                    onChange={(e) =>
                      setFormData({ ...formData, generation: e.target.value })
                    }
                    className="col-span-3"
                    disabled={!!formData.father_uid}
                  />
                </div>

                {/* 排行 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sibling_order" className="text-right">
                    排行
                  </Label>
                  <Input
                    id="sibling_order"
                    type="number"
                    value={formData.sibling_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sibling_order: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                {/* 性别 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right">
                    性别
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 生日 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="birth_date" className="text-right">
                    出生年
                  </Label>
                  <Input
                    id="birth_date"
                    type="text"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    placeholder="仅支持年份，如 1995"
                    className="col-span-3"
                  />
                </div>

                {/* 居住地 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="residence_place" className="text-right">
                    居住地
                  </Label>
                  <Input
                    id="residence_place"
                    value={formData.residence_place}
                    onChange={(e) =>
                      setFormData({ ...formData, residence_place: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                {/* 官职 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="official_position" className="text-right">
                    官职
                  </Label>
                  <Input
                    id="official_position"
                    value={formData.official_position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        official_position: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                {/* 是否在世 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_alive" className="text-right">
                    是否在世
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="is_alive"
                      checked={formData.is_alive}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_alive: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="is_alive" className="font-normal">
                      在世
                    </Label>
                  </div>
                </div>

                {/* 卒年 (仅去世可选) */}
                {!formData.is_alive && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="death_date" className="text-right">
                      卒年
                    </Label>
                    <Input
                      id="death_date"
                      type="text"
                      value={formData.death_date}
                      onChange={(e) =>
                        setFormData({ ...formData, death_date: e.target.value })
                      }
                      placeholder="仅支持年份，如 2000"
                      className="col-span-3"
                    />
                  </div>
                )}

                {/* 配偶 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="spouse" className="text-right">
                    配偶
                  </Label>
                  <Input
                    id="spouse"
                    value={formData.spouse}
                    onChange={(e) =>
                      setFormData({ ...formData, spouse: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                {/* 备注 / 生平事迹 */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="bio" className="text-right pt-2">
                    生平事迹
                  </Label>
                  <div className="col-span-3">
                    <RichTextEditor
                      value={formData.bio}
                      onChange={(value) =>
                        setFormData({ ...formData, bio: value })
                      }
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4 border-t mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 表格 */}
      <div className={cn("border rounded-lg transition-opacity duration-200", isPending && "opacity-60 pointer-events-none")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {isLoggedIn && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="全选"
                  />
                )}
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead className="w-20">世代</TableHead>
              <TableHead className="w-20">排行</TableHead>
              <TableHead className="w-24">父亲</TableHead>
              <TableHead className="w-16">性别</TableHead>
              <TableHead>生日</TableHead>
              <TableHead>卒年</TableHead>
              <TableHead>居住地</TableHead>
              <TableHead>官职</TableHead>
              <TableHead className="w-20">在世</TableHead>
              <TableHead>配偶</TableHead>
              <TableHead>生平事迹</TableHead>
              <TableHead className="w-44">更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((member) => (
                <TableRow
                  key={member.id}
                  data-state={selectedIds.has(member.id) ? "selected" : undefined}
                >
                  <TableCell>
                    {isLoggedIn && (
                      <Checkbox
                        checked={selectedIds.has(member.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(member.id, checked as boolean)
                        }
                        aria-label={`选择 ${member.name}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{
                    member.uid || member.id
                  }</TableCell>
                  <TableCell className="font-medium">
                    {isLoggedIn ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDialog(member)}
                        className="text-primary hover:underline cursor-pointer text-left"
                      >
                        {member.name}
                      </button>
                    ) : (
                      <span className="text-left">{member.name}</span>
                    )}
                  </TableCell>
                  <TableCell>{member.generation ?? "-"}</TableCell>
                  <TableCell>{member.sibling_order ?? "-"}</TableCell>
                  <TableCell>
                    {(() => {
                      if (!member.father_uid) return "-";
                      
                      // 找到父亲记录
                      const father = allMembersForMatching.find(m => m.uid === member.father_uid);
                      if (!father) return "-";
                      
                      // 获取父亲姓名
                      const fatherName = father.name;
                      
                      return (
                        <div className="flex items-center gap-1">
                          {isLoggedIn ? (
                            <button
                              type="button"
                              disabled={loadingFatherUid === member.father_uid}
                              onClick={async () => {
                                if (!member.father_uid) return;
                                setLoadingFatherUid(member.father_uid);
                                try {
                                  const fatherData = await fetchMemberByUid(member.father_uid);
                                  if (fatherData) {
                                    handleOpenEditDialog(fatherData);
                                  }
                                } finally {
                                  setLoadingFatherUid(null);
                                }
                              }}
                              className={cn(
                                "text-primary hover:underline cursor-pointer text-left",
                                loadingFatherUid === member.father_uid && "opacity-70 cursor-wait"
                              )}
                            >
                              {fatherName}
                            </button>
                          ) : (
                            <span>{fatherName}</span>
                          )}
                          {loadingFatherUid === member.father_uid && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{member.gender ?? "-"}</TableCell>
                  <TableCell>
                    {member.birth_date ? `${member.birth_date}年` : "-"}
                  </TableCell>
                  <TableCell>
                    {member.death_date ? `${member.death_date}年` : "-"}
                  </TableCell>
                  <TableCell>{member.residence_place ?? "-"}</TableCell>
                  <TableCell>{member.official_position ?? "-"}</TableCell>
                  <TableCell>{member.is_alive ? "是" : "否"}</TableCell>
                  <TableCell>{member.spouse ?? "-"}</TableCell>
                  <TableCell>
                    {member.bio ? (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0" 
                        onClick={() => setBiographyMember(member)}
                      >
                        查看
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.updated_at).toLocaleString("zh-CN")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        <p className="text-sm text-muted-foreground">
          共 {totalCount} 条记录，第 {currentPage} / {totalPages || 1} 页
                    placeholder="仅支持年份，如 2000"
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 生平事迹查看弹窗 */}
      <Dialog open={!!biographyMember} onOpenChange={(open) => !open && setBiographyMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{biographyMember?.name} 的生平事迹</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RichTextViewer value={biographyMember?.bio ?? null} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
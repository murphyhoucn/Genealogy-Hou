"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Upload, Download, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { batchCreateFamilyMembers, type ImportMemberInput } from "./actions";
import { FAMILY_SURNAME } from "@/lib/utils";

interface ImportMembersDialogProps {
  onSuccess?: () => void;
}

export function ImportMembersDialog({ onSuccess }: ImportMembersDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ImportMemberInput[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isBatchMode, setIsBatchMode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedData([]);
    setSelectedFiles([]);
    setIsBatchMode(false);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  // 下载Excel模板
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        uid: "G20-example1",
        father_uid: "G19-father1",
        generation: 20,
        name: `${FAMILY_SURNAME}某某`,
        gender: "男",
        sibling_order: 1,
        is_alive: true,
        birth_date: 1990,
        death_date: null,
        official_position: "进士",
        residence_place: "某地",
        bio: "字某某",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成员导入模板");
    XLSX.writeFile(wb, "族谱成员导入模板.xlsx");
  };

  // 下载YAML模板
  const handleDownloadYamlTemplate = () => {
    const yamlTemplate = `# 族谱数据YAML格式模板
  - uid: G20-example1
    father_uid: G19-father1
    generation: 20
    name: "${FAMILY_SURNAME}某某"
    gender: 男
    sibling_order: 1
    is_alive: true
    birth_date: 1990
    death_date: null
    official_position: 进士
    residence_place: 某地
    bio: 字某某，幼年聪颖过人，勤奋好学。弱冠之年中进士，历任知县、知府，政绩卓著，深得民心。

  - uid: G21-example2
    father_uid: G20-example1
    generation: 21
    name: "${FAMILY_SURNAME}某某二"
    gender: 女
    sibling_order: 2
    is_alive: true
    birth_date: 2020
    death_date: null
    residence_place: 某地
    bio: 自幼聪慧，受过良好教育。嫁某地张家，相夫教子，持家有方。

  # 字段说明：
  # uid: 唯一标识符（格式：G{世代}-{随机字符串}）
  # father_uid: 父亲的 uid（对应父辈的 uid）
  # generation: 世代数
  # name: 姓名（必填）
  # gender: 性别（男 或 女）
  # sibling_order: 在兄弟姐妹中的排行
  # is_alive: 是否在世（true 或 false）
  # birth_date: 出生年份（YYYY）
  # death_date: 去世年份（YYYY，可为 null）
  # official_position: 官职（可选）
  # residence_place: 居住地（可选）
  # bio: 生平事迹（富文本内容）`;
    
    const blob = new Blob([yamlTemplate], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '族谱成员导入模板.yaml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSelectedFiles(files);

    // 检查是否为批量模式（多文件或多个YAML文件）
    const yamlFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
    });
    
    const excelFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    });

    // 验证文件类型
    if (files.length !== (yamlFiles.length + excelFiles.length)) {
      setError("仅支持Excel文件（.xlsx, .xls）和YAML文件（.yaml, .yml）");
      setIsLoading(false);
      return;
    }

    // 如果是多文件，设置为批量模式
    if (files.length > 1) {
      setIsBatchMode(true);
      setIsLoading(false);
      return;
    }

    // 单文件处理
    const file = files[0];
    const fileName = file.name.toLowerCase();
    const isYamlFile = fileName.endsWith('.yaml') || fileName.endsWith('.yml');

    const reader = new FileReader();
    
    if (isYamlFile) {
      // 处理YAML文件
      reader.onload = (evt) => {
        try {
          const yamlText = evt.target?.result as string;
          const yamlData = yaml.load(yamlText);
          
          // 支持两种格式：直接数组或members字段包装
          let members: any[];
          if (Array.isArray(yamlData)) {
            members = yamlData;
          } else if (yamlData && Array.isArray((yamlData as any).members)) {
            members = (yamlData as any).members;
          } else {
            setError("YAML文件格式错误，应为数组格式或包含members数组");
            setIsLoading(false);
            return;
          }

          const formattedData: ImportMemberInput[] = members.map((member: any) => {
            return {
              id: member.uid ? String(member.uid) : (member.id ? String(member.id) : undefined),
              father_uid: member.father_uid ? String(member.father_uid) : null,
              generation: member.generation ? Number(member.generation) : null,
              name: String(member.name || ""),
              gender: (member.gender === "女" ? "女" : "男") as "男" | "女",
              sibling_order: member.sibling_order ? Number(member.sibling_order) : null,
              is_alive: member.is_alive === false ? false : true,
              birth_date: member.birth_date ?? null,
              death_date: member.death_date ?? null,
              official_position: member.official_position ? String(member.official_position) : null,
              residence_place: member.residence_place
                ? String(member.residence_place)
                : (member.residence_plac ? String(member.residence_plac) : null),
              bio: member.bio ? String(member.bio) : null,
              spouse: member.spouse ? String(member.spouse) : null,
            };
          }).filter(item => item.name);

          if (formattedData.length === 0) {
            setError("未找到有效的成员数据，请检查YAML文件格式");
          } else {
            setParsedData(formattedData);
          }
        } catch (err) {
          console.error(err);
          setError("解析YAML文件失败，请检查文件格式是否正确");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      // 处理Excel文件（原有逻辑）
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (data.length === 0) {
            setError("文件中没有数据");
            setIsLoading(false);
            return;
          }

          const formattedData: ImportMemberInput[] = (data as Record<string, string | number>[]).map((row) => {
            const isAliveValue = row["is_alive"];
            const isAliveText = String(isAliveValue ?? "").toLowerCase();
            const isAlive = !["false", "0", "否", "no"].includes(isAliveText);
            return {
              id: row["uid"] ? String(row["uid"]) : undefined,
              father_uid: row["father_uid"] ? String(row["father_uid"]) : null,
              generation: row["generation"] ? Number(row["generation"]) : null,
              name: String(row["name"] || ""),
              gender: (row["gender"] === "女" ? "女" : "男") as "男" | "女",
              sibling_order: row["sibling_order"] ? Number(row["sibling_order"]) : null,
              is_alive: isAlive,
              birth_date: row["birth_date"] ?? null,
              death_date: row["death_date"] ?? null,
              official_position: row["official_position"] ? String(row["official_position"]) : null,
              residence_place: row["residence_place"]
                ? String(row["residence_place"])
                : (row["residence_plac"] ? String(row["residence_plac"]) : null),
              bio: row["bio"] ? String(row["bio"]) : null,
            };
          }).filter(item => item.name); 

          if (formattedData.length === 0) {
            setError("未找到有效的成员数据，请检查表头是否正确");
          } else {
            setParsedData(formattedData);
          }
        } catch (err) {
          console.error(err);
          setError("解析Excel文件失败，请确保文件格式正确");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // 批量导入所有文件
  const handleBatchImport = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    
    let totalImported = 0;
    const errors: string[] = [];

    for (const file of selectedFiles) {
      try {
        const fileName = file.name.toLowerCase();
        const isYamlFile = fileName.endsWith('.yaml') || fileName.endsWith('.yml');
        
        let formattedData: ImportMemberInput[] = [];

        if (isYamlFile) {
          // 处理YAML文件
          const text = await file.text();
          const yamlData = yaml.load(text);
          
          // 支持两种格式：直接数组或members字段包装
          let members: any[];
          if (Array.isArray(yamlData)) {
            members = yamlData;
          } else if (yamlData && Array.isArray((yamlData as any).members)) {
            members = (yamlData as any).members;
          } else {
            errors.push(`${file.name}: YAML格式错误，应为数组格式或包含members数组`);
            continue;
          }

          formattedData = members.map((member: any) => {
            return {
              id: member.uid ? String(member.uid) : (member.id ? String(member.id) : undefined),
              father_uid: member.father_uid ? String(member.father_uid) : null,
              generation: member.generation ? Number(member.generation) : null,
              name: String(member.name || ""),
              gender: (member.gender === "女" ? "女" : "男") as "男" | "女",
              sibling_order: member.sibling_order ? Number(member.sibling_order) : null,
              is_alive: member.is_alive === false ? false : true,
              birth_date: member.birth_date ?? null,
              death_date: member.death_date ?? null,
              official_position: member.official_position ? String(member.official_position) : null,
              residence_place: member.residence_place
                ? String(member.residence_place)
                : (member.residence_plac ? String(member.residence_plac) : null),
              bio: member.bio ? String(member.bio) : null,
              spouse: member.spouse ? String(member.spouse) : null,
            };
          }).filter(item => item.name);
        } else {
          // 处理Excel文件
          const arrayBuffer = await file.arrayBuffer();
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          formattedData = (data as Record<string, string | number>[]).map((row) => {
            const isAliveValue = row["is_alive"];
            const isAliveText = String(isAliveValue ?? "").toLowerCase();
            const isAlive = !["false", "0", "否", "no"].includes(isAliveText);
            return {
              id: row["uid"] ? String(row["uid"]) : undefined,
              father_uid: row["father_uid"] ? String(row["father_uid"]) : null,
              generation: row["generation"] ? Number(row["generation"]) : null,
              name: String(row["name"] || ""),
              gender: (row["gender"] === "女" ? "女" : "男") as "男" | "女",
              sibling_order: row["sibling_order"] ? Number(row["sibling_order"]) : null,
              is_alive: isAlive,
              birth_date: row["birth_date"] ?? null,
              death_date: row["death_date"] ?? null,
              official_position: row["official_position"] ? String(row["official_position"]) : null,
              residence_place: row["residence_place"]
                ? String(row["residence_place"])
                : (row["residence_plac"] ? String(row["residence_plac"]) : null),
              bio: row["bio"] ? String(row["bio"]) : null,
            };
          }).filter(item => item.name);
        }

        if (formattedData.length > 0) {
          const result = await batchCreateFamilyMembers(formattedData);
          if (result.success) {
            totalImported += result.count || 0;
          } else {
            errors.push(`${file.name}: ${result.error}`);
          }
        } else {
          errors.push(`${file.name}: 未找到有效的成员数据`);
        }
      } catch (err) {
        errors.push(`${file.name}: 解析失败 - ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }

    setIsLoading(false);
    
    if (errors.length > 0) {
      setError(`部分文件导入失败:\n${errors.join('\n')}`);
    }
    
    if (totalImported > 0) {
      alert(`批量导入完成！成功导入 ${totalImported} 条记录`);
      setIsOpen(false);
      onSuccess?.();
    }
  };

  // 提交单文件导入
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    const result = await batchCreateFamilyMembers(parsedData);
    setIsLoading(false);

    if (result.success) {
      alert(`成功导入 ${result.count} 条记录`);
      setIsOpen(false);
      onSuccess?.();
    } else {
      setError(`导入失败: ${result.error}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入成员</DialogTitle>
          <DialogDescription>
            支持 Excel (.xlsx, .xls) 和 YAML (.yaml, .yml) 格式。可选择单个或多个文件进行批量导入。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={handleDownloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              下载Excel模板
            </Button>
            <Button variant="secondary" onClick={handleDownloadYamlTemplate} size="sm">
              <FileText className="h-4 w-4 mr-2" />
              下载YAML模板
            </Button>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .yaml, .yml"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                已选择 {selectedFiles.length} 个文件: {selectedFiles.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {/* 批量模式 */}
          {isBatchMode && selectedFiles.length > 0 && (
            <div className="grid gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">批量导入模式</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  将逐个处理以下文件，每个文件的导入结果会单独显示：
                </p>
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-sm">
                      • {file.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 单文件预览模式 */}
          {!isBatchMode && parsedData.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted p-2 text-sm text-muted-foreground flex justify-between items-center">
                <span>预览 ({parsedData.length} 条记录)</span>
                {parsedData.some(m => m.father_uid) && (
                  <span className="text-xs text-amber-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    注意：father_uid 需对应父辈的 uid
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>世代</TableHead>
                      <TableHead>父亲 UID</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead>出生年</TableHead>
                      <TableHead>居住地</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((member, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.generation}</TableCell>
                        <TableCell className={member.father_uid ? "text-primary" : "text-muted-foreground"}>
                          {member.father_uid || "-"}
                        </TableCell>
                        <TableCell>{member.gender}</TableCell>
                        <TableCell>{member.birth_date ?? "-"}</TableCell>
                        <TableCell>{member.residence_place || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          
          {/* 批量导入按钮 */}
          {isBatchMode && (
            <Button onClick={handleBatchImport} disabled={selectedFiles.length === 0 || isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "批量导入中..." : `批量导入 ${selectedFiles.length} 个文件`}
            </Button>
          )}
          
          {/* 单文件导入按钮 */}
          {!isBatchMode && (
            <Button onClick={handleImport} disabled={parsedData.length === 0 || isLoading}>
              {isLoading ? "导入中..." : "确认导入"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

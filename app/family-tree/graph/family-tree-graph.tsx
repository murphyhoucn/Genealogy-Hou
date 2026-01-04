"use client";

import { useCallback, useMemo, useState, useRef, useEffect, type MouseEvent } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
} from "@xyflow/react";
// @ts-expect-error - CSS module import
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Maximize,
  Minimize,
  Search,
  X,
  User,
} from "lucide-react";
import { FamilyMemberNodeType, type FamilyNodeData } from "./family-node";
import type { FamilyMemberNode } from "./actions";

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNodeType,
};

interface FamilyTreeGraphProps {
  initialData: FamilyMemberNode[];
}

// 布局常量
const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 120;

// 将族谱数据转换为 React Flow 的节点和边
function transformDataToFlow(
  members: FamilyMemberNode[],
  highlightedId: number | null
): { nodes: Node[]; edges: Edge[] } {
  if (!members.length) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 按世代分组
  const generationMap = new Map<number, FamilyMemberNode[]>();
  members.forEach((member) => {
    const gen = member.generation ?? 0;
    if (!generationMap.has(gen)) {
      generationMap.set(gen, []);
    }
    const genMembers = generationMap.get(gen);
    if (genMembers) {
      genMembers.push(member);
    }
  });

  // 按世代排序
  const sortedGenerations = Array.from(generationMap.keys()).sort((a, b) => a - b);

  // 计算每个节点的位置
  sortedGenerations.forEach((gen, genIndex) => {
    const membersInGen = generationMap.get(gen);
    if (!membersInGen) return;
    // 按排行排序
    membersInGen.sort((a, b) => (a.sibling_order ?? 0) - (b.sibling_order ?? 0));

    const totalWidth = membersInGen.length * NODE_WIDTH + (membersInGen.length - 1) * HORIZONTAL_GAP;
    const startX = -totalWidth / 2;

    membersInGen.forEach((member, index) => {
      const nodeData: FamilyNodeData = {
        ...member,
        isHighlighted: member.id === highlightedId,
      };

      nodes.push({
        id: String(member.id),
        type: "familyMember",
        position: {
          x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
          y: genIndex * (NODE_HEIGHT + VERTICAL_GAP),
        },
        data: nodeData,
      });

      // 创建与父亲的连接边
      if (member.father_id) {
        edges.push({
          id: `e${member.father_id}-${member.id}`,
          source: String(member.father_id),
          target: String(member.id),
          type: "smoothstep",
          animated: false,
          style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 },
        });
      }
    });
  });

  return { nodes, edges };
}

function FamilyTreeGraphInner({ initialData }: FamilyTreeGraphProps) {
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberNode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 转换数据为节点和边
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformDataToFlow(initialData, highlightedId),
    [initialData, highlightedId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // 当高亮ID变化时更新节点
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.data.id === highlightedId,
        },
      }))
    );
  }, [highlightedId, setNodes]);

  // 重置视图
  const onResetView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  // 搜索功能
  const onSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setHighlightedId(null);
      return;
    }

    const found = initialData.find((member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found) {
      setHighlightedId(found.id);
      // 聚焦到找到的节点
      const node = nodes.find((n) => n.id === String(found.id));
      if (node) {
        reactFlowInstance.setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2, {
          zoom: 1.5,
          duration: 500,
        });
      }
    } else {
      setHighlightedId(null);
    }
  }, [searchQuery, initialData, nodes, reactFlowInstance]);

  // 清除搜索
  const onClearSearch = useCallback(() => {
    setSearchQuery("");
    setHighlightedId(null);
  }, []);

  // 节点点击事件
  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      const member = initialData.find((m) => m.id === Number(node.id));
      if (member) {
        setSelectedMember(member);
        setIsDetailOpen(true);
      }
    },
    [initialData]
  );

  // 全屏切换
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 获取父亲姓名
  const getFatherName = useCallback(
    (fatherId: number | null) => {
      if (!fatherId) return null;
      const father = initialData.find((m) => m.id === fatherId);
      return father?.name || null;
    },
    [initialData]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-[calc(100vh-200px)] min-h-[500px] border rounded-lg bg-background relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Controls 
          showInteractive={false} 
          className="!bg-background !border !border-border !shadow-md [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted [&>button>svg]:!fill-current"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        {/* 顶部工具栏 */}
        <Panel position="top-left" className="flex items-center gap-2 flex-wrap">
          {/* 搜索框 */}
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-md p-1">
            <Input
              placeholder="搜索成员姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="h-8 w-40 md:w-56 border-0 focus-visible:ring-0"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSearch}>
              <Search className="h-4 w-4" />
            </Button>
            {searchQuery && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClearSearch}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-2">
          {/* 重置视图按钮 */}
          <Button size="sm" variant="outline" onClick={onResetView}>
            <RotateCcw className="h-4 w-4 mr-1" />
            重置视图
          </Button>

          {/* 全屏按钮 */}
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-1" />
                退出全屏
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1" />
                全屏
              </>
            )}
          </Button>
        </Panel>

        {/* 统计信息 */}
        <Panel position="bottom-right" className="bg-background/95 backdrop-blur-sm border rounded-md px-3 py-2">
          <span className="text-sm text-muted-foreground">
            共 {initialData.length} 位成员
          </span>
        </Panel>
      </ReactFlow>

      {/* 成员详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              成员详情
            </DialogTitle>
            <DialogDescription>查看家族成员的详细信息</DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{selectedMember.name}</span>
                <div className="flex gap-2">
                  {selectedMember.gender && (
                    <Badge
                      variant={selectedMember.gender === "男" ? "default" : "secondary"}
                    >
                      {selectedMember.gender}
                    </Badge>
                  )}
                  {!selectedMember.is_alive && (
                    <Badge variant="outline">已故</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">世代</span>
                  <p className="font-medium">
                    {selectedMember.generation !== null
                      ? `第 ${selectedMember.generation} 世`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">排行</span>
                  <p className="font-medium">
                    {selectedMember.sibling_order !== null
                      ? `第 ${selectedMember.sibling_order}`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">父亲</span>
                  <p className="font-medium">
                    {getFatherName(selectedMember.father_id) || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">配偶</span>
                  <p className="font-medium">{selectedMember.spouse || "-"}</p>
                </div>
                {selectedMember.official_position && (
                  <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground">官职</span>
                    <p className="font-medium">{selectedMember.official_position}</p>
                  </div>
                )}
                {selectedMember.remarks && (
                  <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground">备注</span>
                    <p className="font-medium text-wrap">{selectedMember.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FamilyTreeGraph({ initialData }: FamilyTreeGraphProps) {
  return (
    <ReactFlowProvider>
      <FamilyTreeGraphInner initialData={initialData} />
    </ReactFlowProvider>
  );
}

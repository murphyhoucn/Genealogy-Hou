"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FamilyMemberNode } from "./actions";

export interface FamilyNodeData extends FamilyMemberNode {
  isHighlighted?: boolean;
  [key: string]: unknown;
}

export interface FamilyNodeProps {
  data: FamilyNodeData;
}

function FamilyMemberNodeComponent({ data }: FamilyNodeProps) {
  const nodeData = data;
  
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-card text-card-foreground shadow-md min-w-[140px] transition-all duration-200",
        nodeData.gender === "男" 
          ? "border-blue-400 dark:border-blue-500" 
          : nodeData.gender === "女" 
            ? "border-pink-400 dark:border-pink-500" 
            : "border-border",
        nodeData.isHighlighted && "ring-4 ring-yellow-400 dark:ring-yellow-500 scale-110",
        !nodeData.is_alive && "opacity-70"
      )}
    >
      {/* 顶部连接点 - 连接到父亲 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
      {/* 节点内容 */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="font-semibold text-base text-center">{nodeData.name}</div>
        
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {nodeData.generation !== null && (
            <Badge variant="secondary" className="text-xs">
              第{nodeData.generation}世
            </Badge>
          )}
          {nodeData.sibling_order !== null && (
            <Badge variant="outline" className="text-xs">
              排行{nodeData.sibling_order}
            </Badge>
          )}
        </div>
        
        {nodeData.gender && (
          <span className={cn(
            "text-xs",
            nodeData.gender === "男" ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"
          )}>
            {nodeData.gender}
          </span>
        )}
        
        {!nodeData.is_alive && (
          <span className="text-xs text-muted-foreground">已故</span>
        )}
      </div>
      
      {/* 底部连接点 - 连接到子女 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
}

export const FamilyMemberNodeType = memo(FamilyMemberNodeComponent);

import { Suspense } from "react";
import { fetchAllFamilyMembers } from "../graph/actions";
import { FamilyForceGraph } from "./force-graph";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "族谱关系图 (3D) | Liu Family",
  description: "三维视角的家族族谱关系图",
};

async function Graph3DLoader() {
  const { data, error } = await fetchAllFamilyMembers();

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-destructive/10 text-destructive p-4">
        <p>加载数据失败: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50 text-muted-foreground p-8 text-center">
        <p>暂无族谱数据，请先添加成员。</p>
      </div>
    );
  }

  return <FamilyForceGraph data={data} />;
}

export default function FamilyTreeGraph3DPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">族谱关系图 (3D)</h1>
      </div>
      
      <Suspense fallback={
        <div className="w-full h-[600px] border rounded-lg bg-muted/20 animate-pulse flex items-center justify-center">
          <div className="text-muted-foreground">加载族谱数据...</div>
        </div>
      }>
        <Graph3DLoader />
      </Suspense>
    </div>
  );
}

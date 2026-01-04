import { Suspense } from "react";
import { fetchAllFamilyMembers } from "./actions";
import { FamilyTreeGraph } from "./family-tree-graph";

function GraphSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[500px] border rounded-lg bg-muted/20 animate-pulse flex items-center justify-center">
      <div className="text-muted-foreground">加载族谱关系图...</div>
    </div>
  );
}

async function GraphLoader() {
  const { data, error } = await fetchAllFamilyMembers();

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p>加载数据失败: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-muted/50 text-muted-foreground p-8 rounded-lg text-center">
        <p>暂无族谱数据，请先添加成员。</p>
      </div>
    );
  }

  return <FamilyTreeGraph initialData={data} />;
}

export default function FamilyTreeGraphPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">族谱关系图</h1>

      <Suspense fallback={<GraphSkeleton />}>
        <GraphLoader />
      </Suspense>
    </div>
  );
}

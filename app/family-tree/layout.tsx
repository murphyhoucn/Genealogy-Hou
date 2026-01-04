import { Suspense } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function FamilyTreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
            刘氏族谱
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded-md" />}>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

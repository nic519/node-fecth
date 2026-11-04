import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodefetch.example.com"),
  title: "NodeFetch - Clash 订阅配置生成工具",
  description: "专业的节点配置管理平台，支持多订阅聚合、规则分流与延迟优选。",
  openGraph: {
    title: "NodeFetch - Clash 订阅配置生成工具",
    description: "专业的节点配置管理平台，支持多订阅聚合、规则分流与延迟优选。",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "NodeFetch - Clash 订阅配置生成工具",
    description: "专业的节点配置管理平台，支持多订阅聚合、规则分流与延迟优选。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-background text-foreground"
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

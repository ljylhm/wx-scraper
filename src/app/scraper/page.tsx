"use client";

import { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

interface ErrorDetails {
  error: string;
  message?: string;
  availableSelectors?: string[];
  bodyPreview?: string;
}

// 包装使用useSearchParams的组件
function ScraperContent() {
  const searchParams = useSearchParams();
  
  // 从URL参数中获取初始值
  const initialUrl = searchParams.get('url') || "";
  const initialSelector = searchParams.get('selector') || "#fullpage";
  
  const [url, setUrl] = useState<string>(initialUrl);
  const [content, setContent] = useState<string>("");
  const [selector, setSelector] = useState<string>(initialSelector);
  const [error, setError] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [usedSelector, setUsedSelector] = useState<string>("");
  const [usedSource, setUsedSource] = useState<string>("");
  const [showAdvancedHelp, setShowAdvancedHelp] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("GET");
  const [apiUrl, setApiUrl] = useState<string>("");
  
  // 如果URL中有参数，自动执行爬取
  useEffect(() => {
    if (initialUrl) {
      handleScrape();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 生成API调用URL
  useEffect(() => {
    if (url) {
      const apiBaseUrl = "/api/scrape";
      const encodedUrl = encodeURIComponent(formatUrl(url));
      const encodedSelector = encodeURIComponent(selector.trim() || "#fullpage");
      
      setApiUrl(`${apiBaseUrl}?url=${encodedUrl}&selector=${encodedSelector}`);
    } else {
      setApiUrl("");
    }
  }, [url, selector]);

  // 验证URL是否有效
  const isValidUrl = (url: string): boolean => {
    try {
      // 如果没有协议，自动添加https://
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 格式化URL，确保有协议前缀
  const formatUrl = (url: string): string => {
    if (!/^https?:\/\//i.test(url)) {
      return "https://" + url;
    }
    return url;
  };

  const handleScrape = async () => {
    if (!url) {
      setError("请输入网页URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("请输入有效的URL地址");
      return;
    }

    const formattedUrl = formatUrl(url);
    setLoading(true);
    setError("");
    setContent("");
    setSourceUrl("");
    setErrorDetails(null);
    setUsedSelector("");

    try {
      let response;
      
      if (requestMethod === "GET") {
        // 使用GET方式
        const params = new URLSearchParams({
          url: formattedUrl,
          selector: selector.trim() || "#fullpage",
        });
        
        response = await fetch(`/api/scrape?${params.toString()}`);
      } else {
        // 使用POST方式
        response = await fetch("/api/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            url: formattedUrl,
            selector: selector.trim() || "#fullpage",
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && data.availableSelectors) {
          setErrorDetails(data);
          throw new Error("未找到指定元素或内容为空。请参考下方推荐的选择器，这些选择器可能包含有效内容。");
        } else {
          throw new Error(data.error || data.message || "爬取失败");
        }
      }

      setContent(data.content);
      setSourceUrl(data.source);
      setUsedSelector(data.usedSelector || selector);
      setUsedSource(data.usedSource || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : "爬取过程中发生错误");
    } finally {
      setLoading(false);
    }
  };

  // 使用推荐的选择器
  const handleSelectSelector = (selectorToUse: string) => {
    setSelector(selectorToUse);
    handleScrape(); // 自动尝试使用新选择器爬取
  };

  // 按回车键也可以触发爬取
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScrape();
    }
  };

  // 重置表单
  const handleReset = () => {
    setUrl("");
    setSelector("#fullpage");
    setContent("");
    setError("");
    setErrorDetails(null);
    setSourceUrl("");
    setUsedSelector("");
  };

  // 复制API URL到剪贴板
  const handleCopyApiUrl = () => {
    if (apiUrl) {
      navigator.clipboard.writeText(window.location.origin + apiUrl)
        .then(() => alert("API URL已复制到剪贴板"))
        .catch(() => alert("复制失败，请手动复制"));
    }
  };

  return (
    
    <div  
      className="flex min-h-screen bg-page-background" 
      style={{ backgroundImage: 'url(https://weball.baigekeji.com/tmp/static/pc-bg.png)', backgroundSize: '100% 100%' }}
    >
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        <Card className="p-6 mb-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4 border-l-4 border-blue-500 pl-3">网页内容爬取工具</h1>
          <p className="text-gray-600 mb-4">
            输入网页URL和CSS选择器，爬取网页中的内容。系统会自动检测<span className="text-blue-500 font-medium">var data</span>开头的脚本数据，或使用选择器提取内容。
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="请输入要爬取的网页URL (例如: example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              onClick={handleScrape}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? "爬取中..." : "开始爬取"}
            </Button>
          </div>
          
          <div className="mb-2">
            <Input
              placeholder="CSS选择器 (例如: #fullpage, .content, body)"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-500 mt-1">
                默认使用 #fullpage 选择器，如不确定可留空。系统会尝试多个常见选择器。
              </p>
              <div className="flex gap-3">
                <button 
                  className="text-xs text-blue-500 hover:underline mt-1"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  {showAdvancedOptions ? "隐藏高级选项" : "高级选项"}
                </button>
                <button 
                  className="text-xs text-blue-500 hover:underline mt-1"
                  onClick={() => setShowAdvancedHelp(!showAdvancedHelp)}
                >
                  {showAdvancedHelp ? "隐藏帮助" : "查看帮助"}
                </button>
              </div>
            </div>
          </div>

          {showAdvancedOptions && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium mb-2">高级选项</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">请求方式</label>
                  <div className="flex items-center gap-2">
                    <div className="flex border rounded-md overflow-hidden">
                      <button 
                        className={`px-3 py-1 text-sm ${requestMethod === "GET" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                        onClick={() => setRequestMethod("GET")}
                      >
                        GET
                      </button>
                      <button 
                        className={`px-3 py-1 text-sm ${requestMethod === "POST" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                        onClick={() => setRequestMethod("POST")}
                      >
                        POST
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      GET方式可以通过URL直接调用API
                    </span>
                  </div>
                </div>
                
                {apiUrl && (
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">API 调用URL</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded p-2 text-xs font-mono text-gray-700 overflow-x-auto">
                        {apiUrl}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyApiUrl}
                        className="whitespace-nowrap"
                      >
                        复制
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      可以通过浏览器直接访问此URL获取爬取结果
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showAdvancedHelp && (
            <div className="bg-blue-50 p-3 rounded-md text-sm text-gray-700 mb-4">
              <h3 className="font-medium mb-1">爬虫功能说明:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>自动脚本数据检测</strong>: 系统会自动查找页面中以<code>var data</code>开头的脚本，并提取其中的content字段</li>
                <li><strong>选择器提取</strong>: 如果没有找到脚本数据，系统会尝试使用CSS选择器提取内容</li>
                <li>许多网站有反爬虫机制，可能会阻止爬取</li>
                <li>如何找到正确的选择器:</li>
                <ol className="list-decimal pl-5 pt-1">
                  <li>在浏览器中打开目标网页</li>
                  <li>右键点击想要爬取的内容 -&gt; 检查</li>
                  <li>在开发者工具中找到对应的HTML元素</li>
                  <li>查看元素的ID或class属性</li>
                  <li>使用 #{`ID值`} 或 .{`class值`} 作为选择器</li>
                </ol>
              </ul>
              <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                <p className="font-medium">技巧: 对于复杂的动态页面</p>
                <ol className="list-decimal pl-5 mt-1">
                  <li>增加等待时间到3000-5000毫秒</li>
                  <li>使用更精确的选择器，避免过于通用的选择器</li>
                  <li>如果页面有多步加载过程，可能需要更长的等待时间</li>
                </ol>
              </div>
              
              <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                <p className="font-medium">直接API调用方式</p>
                <p className="mt-1">您可以通过浏览器直接访问以下URL格式来获取爬取结果：</p>
                <pre className="mt-1 bg-white p-2 rounded overflow-x-auto">
                  /api/scrape?url=网址&selector=选择器
                </pre>
                <p className="mt-1">例如: <code>/api/scrape?url=https://example.com&selector=%23main</code></p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              <p className="font-medium">{error}</p>
              
              {errorDetails?.availableSelectors && errorDetails.availableSelectors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">页面可用的选择器（按内容长度排序）：</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {errorDetails.availableSelectors.map((sel, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSelector(sel)}
                        className="text-xs bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        {sel}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorDetails?.bodyPreview && (
                <div className="mt-3">
                  <p className="text-sm font-medium">页面预览（前1000字符）:</p>
                  <div className="mt-1 text-xs bg-white p-2 rounded border border-red-200 max-h-[200px] overflow-auto">
                    <pre className="whitespace-pre-wrap break-all">{errorDetails.bodyPreview}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {content && (
            <div className="flex justify-end">
              <Button 
                onClick={handleReset}
                variant="outline" 
                size="sm"
                className="text-gray-500"
              >
                重置
              </Button>
            </div>
          )}
        </Card>

        {content && (
          <Card className="p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold border-l-4 border-green-500 pl-3">爬取结果</h2>
              <div className="flex items-center gap-2">
                {usedSource === 'script-data' ? (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    数据源: 脚本数据
                  </span>
                ) : usedSelector ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    选择器: {usedSelector}
                  </span>
                ) : null}
                {sourceUrl && (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    查看源网页
                  </a>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-[500px]">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
            <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
              <span>
                提示: 显示的内容可能包含HTML标签，是原始的DOM结构。图片和样式可能无法正常显示。
              </span>
              <span className="text-xs text-gray-400">
                内容长度: {content.length} 字符
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="flex min-h-screen p-6 items-center justify-center">
      <div className="text-center">
        <p className="text-lg">加载中...</p>
      </div>
    </div>
  );
}

export default function ScraperPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ScraperContent />
    </Suspense>
  );
} 
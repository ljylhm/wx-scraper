"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { QRCode } from "@/components/QRCode";

const PREVIEW_135_URL = "https://www.135editor.com/editor_styles/";
const PREVIEW_96_URL = "https://bj.96weixin.com/material/tpl/";

// 进度状态类型定义
type ProcessStep = 'idle' | 'scraping' | 'saving' | 'sending' | 'success' | 'error';
// 编辑器类型
type EditorType = "135" | "wechat" | "96";
// 接收编辑器类型
type ReceiveEditorType = "135" | "96" | null;

export default function EditPage() {
  const [editorType, setEditorType] = useState<EditorType>("135");
  const [templateUrl, setTemplateUrl] = useState<string>("");
  const [receiveEditorType, setReceiveEditorType] = useState<ReceiveEditorType>("135");
  const [receiverId, setReceiverId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  
  // 进度状态
  const [processStep, setProcessStep] = useState<ProcessStep>('idle');
  const [detailedLogs, setDetailedLogs] = useState<string[]>([]);

  // 添加日志
  const addLog = (log: string) => {
    setDetailedLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleConfirm = async () => {
    // 表单验证
    if (!templateUrl.trim()) {
      setMessage({
        type: 'error',
        text: '请输入模板ID'
      });
      return;
    }

    if (!receiveEditorType) {
      setMessage({
        type: 'error',
        text: '请选择接收编辑器'
      });
      return;
    }

    if (!receiverId.trim()) {
      setMessage({
        type: 'error',
        text: '请输入接收账户ID'
      });
      return;
    }

    // 重置状态
    setLoading(true);
    setMessage(null);
    setProcessStep('scraping');
    setDetailedLogs([]);
    
    try {
      // 步骤1: 调用scrape接口获取模板HTML内容
      addLog(`开始获取模板HTML内容...编辑器类型: ${editorType}`);
      setMessage({
        type: 'info',
        text: '正在获取模板HTML内容...'
      });
      
      // 根据编辑器类型设置不同的请求参数
      let requestUrl = '';
      let selector = '';
      
      if (editorType === '135') {
        requestUrl = PREVIEW_135_URL + templateUrl.trim() + "?preview=1";
        selector = '#fullpage';
      } else if (editorType === 'wechat') {
        requestUrl = templateUrl.trim();
        selector = '.rich_media_content';
      } else if (editorType === '96') {
        requestUrl = PREVIEW_96_URL + templateUrl.trim() + ".html";
        selector = '.detail_block'; // 96微信编辑器模板内容选择器
      }
      
      addLog(`使用URL: ${requestUrl}, 选择器: ${selector}`);
      
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: requestUrl,
          selector: selector
        })
      });
      
      const scrapeResult = await scrapeResponse.json();
      
      if (!scrapeResponse.ok || !scrapeResult.content) {
        throw new Error(scrapeResult.error || scrapeResult.message || "获取模板HTML内容失败");
      }
      
      addLog("模板HTML内容获取成功，内容长度: " + scrapeResult.content.length);
      
      // 步骤2: 调用保存接口，根据选择的编辑器类型选择接口
      setProcessStep('saving');
      
      const successResults = [];
      
      // 根据选择的接收编辑器类型处理
      if (receiveEditorType === '135') {
        try {
          const title = `135模板导入-${new Date().toLocaleString()}`;
          addLog("开始保存模板内容到135编辑器...");
          
          setMessage({
            type: 'info',
            text: `正在保存模板内容到135编辑器...`
          });
          
          const saveResponse = await fetch('/api/save135', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: scrapeResult.content,
              title: title
            })
          });
          
          const saveResult = await saveResponse.json();
          
          if (!saveResponse.ok || !(saveResult.success || saveResult.data)) {
            if (saveResult.needLogin) {
              throw new Error("保存失败，请先登录135编辑器");
            }
            throw new Error(saveResult.error || saveResult.message || "保存模板到135编辑器失败");
          }
          
          // 从保存结果中提取模板ID
          if (!saveResult.data || !saveResult.data.id) {
            throw new Error("保存到135编辑器成功但未能获取模板ID");
          }
          
          const templateId = saveResult.data.id;
          addLog(`模板内容保存到135编辑器成功，获取到模板ID: ${templateId}`);
          
          // 调用send-template接口
          setProcessStep('sending');
          addLog(`开始将模板ID ${templateId} 发送给135编辑器用户 ${receiverId}...`);
          
          const sendResponse = await fetch('/api/send-template', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: templateId,
              creator: receiverId.trim()
            })
          });
          
          const sendResult = await sendResponse.json();
          
          if (!sendResponse.ok || !sendResult.success) {
            throw new Error(sendResult.error || sendResult.message || "模板发送到135编辑器失败");
          }
          
          addLog(`模板发送给135编辑器用户成功，模板ID: ${templateId}`);
          successResults.push(`135编辑器: 成功发送模板ID ${templateId} 到用户 ${receiverId}`);
          
        } catch (error) {
          addLog(`135编辑器处理失败: ${error instanceof Error ? error.message : "未知错误"}`);
          throw error;
        }
      } else if (receiveEditorType === '96') {
        try {
          const title = `96微信编辑器导入-${new Date().toLocaleString()}`;
          addLog("开始保存模板内容到96微信编辑器...");
          
          setMessage({
            type: 'info',
            text: `正在保存模板内容到96微信编辑器...`
          });
          
          const saveResponse = await fetch('/api/save96', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: scrapeResult.content,
              title: title,
              to_user: receiverId.trim()
            })
          });
          
          const saveResult = await saveResponse.json();
          
          if (!saveResponse.ok || !(saveResult.success || saveResult.data)) {
            if (saveResult.needLogin) {
              throw new Error("保存失败，请先登录96微信编辑器");
            }
            throw new Error(saveResult.error || saveResult.message || "保存模板到96微信编辑器失败");
          }
          
          // 从保存结果中提取模板ID
          const templateId = saveResult.data?.info?.id || saveResult.data?.id || 'unknown';
          
          addLog(`模板内容保存到96微信编辑器成功，已保存至用户 ${receiverId}，模板ID: ${templateId}`);
          successResults.push(`96微信编辑器: 成功保存模板ID ${templateId} 到用户 ${receiverId}`);
          
        } catch (error) {
          addLog(`96微信编辑器处理失败: ${error instanceof Error ? error.message : "未知错误"}`);
          throw error;
        }
      }
      
      // 全部流程完成
      setProcessStep('success');
      
      if (successResults.length > 0) {
        setMessage({
          type: 'success',
          text: successResults.join('；\n')
        });
      } else {
        throw new Error("保存操作失败");
      }
      
    } catch (error) {
      console.error("处理失败", error);
      setProcessStep('error');
      addLog(`错误: ${error instanceof Error ? error.message : "未知错误"}`);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      setLoading(false);
    }
  };

  // 生成进度指示器
  const renderProgressIndicator = () => {
    const steps = [
      { key: 'scraping', label: '获取HTML' },
      { key: 'saving', label: '保存模板' },
      { key: 'sending', label: '处理完成' }
    ];
    
    return (
      <div className="flex items-center justify-between mb-4 mt-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              processStep === step.key ? 'bg-blue-500 text-white' : 
              processStep === 'success' && steps.findIndex(s => s.key === processStep) < index ? 'bg-green-500 text-white' :
              processStep === 'error' && steps.findIndex(s => s.key === processStep) <= index ? 'bg-red-500 text-white' :
              steps.findIndex(s => s.key === processStep) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {steps.findIndex(s => s.key === processStep) > index || (processStep === 'success' && steps.findIndex(s => s.key === processStep) < index) ? 
                '✓' : index + 1}
            </div>
            <span className="ml-2 text-sm">{step.label}</span>
            {index < steps.length - 1 && (
              <div className="h-1 bg-gray-200 w-full mx-2" 
                   style={{width: '20px'}}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="flex min-h-screen bg-page-background" 
      style={{ backgroundImage: 'url(https://weball.baigekeji.com/tmp/static/pc-bg.png)', backgroundSize: '100% 100%' }}
    >     
      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          <Card className="rounded-3xl overflow-hidden border-0 shadow-lg">
            <div className="p-6 space-y-6">
              {/* 模板选择部分 */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-l-4 border-blue-500 pl-2">模板选择</h2>
                
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="editor135" 
                      checked={editorType === "135"}
                      onCheckedChange={() => setEditorType("135")}
                    />
                    <Label htmlFor="editor135">135编辑器</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="editorWechat" 
                      checked={editorType === "wechat"}
                      onCheckedChange={() => setEditorType("wechat")}
                    />
                    <Label htmlFor="editorWechat">微信公众号</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="editor96" 
                      checked={editorType === "96"}
                      onCheckedChange={() => setEditorType("96")}
                    />
                    <Label htmlFor="editor96">96微信编辑器</Label>
                  </div>
                </div>
                
                <Input
                  className="rounded-md"
                  placeholder={
                    editorType === "135" ? "输入模板ID" : 
                    editorType === "96" ? "输入模板ID" : 
                    "输入公众号文章URL"
                  }
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                />
                {editorType === "135" && (
                  <p className="text-sm text-gray-500">支持会员/付费全文模板！</p>
                )}
                {editorType === "wechat" && (
                  <p className="text-sm text-gray-500">输入微信公众号文章完整URL，例如https://mp.weixin.qq.com/s/xxx</p>
                )}
                {editorType === "96" && (
                  <p className="text-sm text-gray-500">输入96微信编辑器模板ID，例如21658</p>
                )}
              </div>

              {/* 接收账户部分 */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-l-4 border-blue-500 pl-2">接收账户</h2>
                
                <div className="border rounded-md p-4 space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-1">选择接收编辑器：</p>
                    
                    <div className="flex items-center space-x-4 flex-wrap">
                      <div className="flex items-center space-x-2 mb-1">
                        <Checkbox 
                          id="receive135" 
                          checked={receiveEditorType === "135"}
                          onCheckedChange={() => setReceiveEditorType("135")}
                        />
                        <Label htmlFor="receive135">135编辑器</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-1">
                        <Checkbox 
                          id="receive96" 
                          checked={receiveEditorType === "96"}
                          onCheckedChange={() => setReceiveEditorType("96")}
                        />
                        <Label htmlFor="receive96">96微信编辑器</Label>
                      </div>
                    </div>
                  </div>
                  
                  {receiveEditorType && (
                    <div>
                      <Input
                        id="receiverId"
                        className="rounded-md"
                        placeholder={`输入${receiveEditorType === "135" ? "135编辑器" : "96微信编辑器"}用户ID`}
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 进度指示器 - 仅在处理过程中显示 */}
              {processStep !== 'idle' && renderProgressIndicator()}

              {/* 消息提示 */}
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' : 
                  message.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* 详细日志 - 收起式面板 */}
              {detailedLogs.length > 0 && (
                <div className="mt-2 border rounded-md overflow-hidden">
                  <details>
                    <summary className="p-2 bg-gray-50 cursor-pointer text-sm font-medium">
                      详细日志
                    </summary>
                    <div className="p-2 bg-gray-50 text-xs text-gray-700 max-h-40 overflow-y-auto">
                      {detailedLogs.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* 确认按钮 */}
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? '处理中...' : '确认'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 右侧说明部分 */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-green-500 mb-6">公众号模板提取</h1>
          <p className="text-lg mb-6">
            多平台互通，A平台的模板可发送到A平台，也可以发送到B平台、C平台等。
          </p>
          <p className="text-lg mb-8">
            兑换成功后，请到&ldquo;我的文章&rdquo;查看！
          </p>

          <div className="border-4 border-green-500 inline-block p-2 rounded-lg">
            <QRCode size={200} />
          </div>
        </div>
      </div>
    </div>
  );
} 
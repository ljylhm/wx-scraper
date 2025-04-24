"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { QRCode } from "@/components/QRCode";

export default function EditPage() {
  const [editorType, setEditorType] = useState<"135" | "96" | "公众号">("135");
  const [templateId, setTemplateId] = useState<string>("158229");
  const [accountId, setAccountId] = useState<string>("9848467");

  const handleConfirm = () => {
    console.log("已确认模板选择", { editorType, templateId, accountId });
    // 这里可以添加提交操作
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundImage: 'url(https://weball.baigekeji.com/tmp/static/pc-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          <Card className="rounded-3xl overflow-hidden border-0 shadow-lg">
            <div className="p-6 space-y-6">
              {/* 模板选择部分 */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-l-4 border-blue-500 pl-2">模板选择</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editor135" 
                      checked={editorType === "135"}
                      onCheckedChange={() => setEditorType("135")}
                    />
                    <Label htmlFor="editor135">135编辑器</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editor96" 
                      checked={editorType === "96"}
                      onCheckedChange={() => setEditorType("96")}
                    />
                    <Label htmlFor="editor96">96编辑器</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="wxPublic" 
                      checked={editorType === "公众号"}
                      onCheckedChange={() => setEditorType("公众号")}
                    />
                    <Label htmlFor="wxPublic">公众号</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showMi" />
                  <Label htmlFor="showMi">秀米</Label>
                </div>
                <Input
                  className="rounded-md"
                  placeholder="输入模板ID"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                />
                <p className="text-sm text-gray-500">支持会员/付费全文模板！</p>
              </div>

              {/* 接收账户部分 */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-l-4 border-blue-500 pl-2">接收账户</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="account135" 
                      checked 
                    />
                    <Label htmlFor="account135">135编辑器</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="account96" />
                    <Label htmlFor="account96">96编辑器</Label>
                  </div>
                </div>
                <Input
                  className="rounded-md"
                  placeholder="输入账户ID"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>

              {/* 使用记录部分 */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-l-4 border-blue-500 pl-2">使用记录</h2>
                <p className="text-sm text-gray-600">
                  1.135编辑器模板 (158229) → 135编辑器账户 (9848467)
                </p>
              </div>

              {/* 确认按钮 */}
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md"
                onClick={handleConfirm}
              >
                确认
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
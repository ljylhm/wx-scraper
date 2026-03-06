# 模板提取记录页设计

## 1. 目标
提供一个仅管理员可访问的记录页，查看每一次模板提取操作，支持按条件搜索与分页浏览。

## 2. 记录字段
每次提取写入以下关键信息：
- IP
- 提取时间（createdAt）
- 提取码（accessCode）
- 来源编辑器类型（editorType）
- 模板编号（templateCode）
- 接收编辑器类型（receiverEditorType）
- 接收账号编号（receiverId）
- 状态（processing/success/failed）
- 结果模板ID（resultTemplateId）
- 错误信息（errorMessage）

## 3. 写入时机
- 开始提取前：创建记录，状态为 `processing`
- 提取成功后：更新为 `success`
- 提取失败后：更新为 `failed`，并写入错误原因

## 4. 页面
- 路径：`/admin/extract-records`
- 权限：管理员登录后访问（与访问码管理页共用登录态）
- 功能：
  - 条件搜索：提取码、模板编号、接收账号、IP、状态、日期区间
  - 分页：页码 + 每页条数（10/20/50）
  - 列表展示：时间、IP、提取码、模板编号、接收账号、状态、结果模板ID、错误信息

## 5. 接口
- `POST /api/extract-records/start`：创建提取记录
- `POST /api/extract-records/update`：更新记录状态
- `GET /api/extract-records/list`：管理员查询记录（支持筛选+分页）

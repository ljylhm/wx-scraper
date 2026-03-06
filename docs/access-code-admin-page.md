# 访问码管理页设计（管理员）

## 1. 目标
提供一个仅管理员可访问的后台页面，用于创建、删除访问码，并查看所有访问码的使用情况（已用次数、剩余次数、状态、创建时间），可设置指定 code 永久有效。

## 2. 权限模型
- 管理员密码来源：
  - `ACCESS_CODE_ADMIN_PASSWORD`（优先）
  - 或回退到 `ACCESS_CODE_ADMIN_SECRET`
- 登录方式：管理员在后台页面输入密码，后端校验成功后写入 `HttpOnly` 会话 Cookie。
- 接口鉴权：
  - 支持 `x-admin-secret`（脚本/运维调用）
  - 或管理员会话 Cookie（后台页面调用）

## 3. 页面结构
路径：`/admin/access-codes`

模块：
1. 登录卡片（未登录态）
- 密码输入框
- 登录按钮
- 错误提示

2. 列表页（已登录态）
- 顶部操作：刷新、退出登录
- 创建区：输入 code（可留空自动生成临时码）、设置可用次数、设置是否永久有效、提交创建
- 列表字段：
  - Code
  - 已用次数（usedCount/maxUses）
  - 剩余次数
  - 状态（可用/已失效/已禁用）
  - 创建时间
  - 操作（设为永久/取消永久、删除）

## 4. 交互流程
1. 页面初始化调用 `/api/admin/me` 校验登录状态。
2. 未登录：显示登录表单。
3. 登录成功：调用 `/api/access-code/list` 拉取列表。
4. 管理员可创建 code，也可对已有 code 删除或切换永久状态。
5. 点击刷新：重新拉取列表。
6. 点击退出：调用 `/api/admin/logout`，清理会话。

## 5. 关键接口
- `POST /api/admin/login`
- `GET /api/admin/me`
- `POST /api/admin/logout`
- `POST /api/access-code/create`
- `GET /api/access-code/list`
- `PATCH /api/access-code/{code}`
- `DELETE /api/access-code/{code}`

## 6. 验收标准
- 未登录时不能看到访问码列表。
- 密码正确后可查看完整列表。
- 列表中可清晰看到使用情况。
- 管理员可以创建 code、删除 code、设置/取消永久有效。
- 退出登录后，刷新页面回到登录态。

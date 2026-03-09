# 定时登录与Cookie管理设计

## 1. 目标
提供一套可运营的自动登录能力，确保 135/96 平台 Cookie 每天按计划刷新，并在后台可配置、可追溯、可查看当前 Cookie 状态。

## 2. 核心能力
- 定时登录配置：启用开关、每天执行时间、执行渠道（135/96）
- 手动执行：管理员可立即触发一次
- 历史记录：每次执行都记录触发方式、开始/结束时间、结果明细
- 当前Cookie：展示当前 Redis 中生效的 Cookie 条数、更新时间、预览

## 3. 触发机制
- Vercel Cron 每 5 分钟调用 `/api/auto-login/tick`
- `tick` 根据 Redis 配置判断“当前是否到点且当天未执行”
- 满足条件才执行登录流程，否则跳过

## 4. Redis 数据
- 配置：`wx_auto_login:config`
- 执行锁：`wx_auto_login:lock`
- 历史索引：`wx_auto_login:history:index`
- 历史详情：`wx_auto_login:history:item:{id}`
- 历史自增ID：`wx_auto_login:history:counter`

## 5. 页面
- 路径：`/admin/auto-login`
- 权限：管理员登录态
- 模块：
  - 定时配置（启用、时间、渠道、保存）
  - 手动执行按钮
  - 当前Cookie列表
  - 执行历史列表（分页）

## 6. 接口
- `GET/POST /api/auto-login/config`：读写定时配置
- `POST /api/auto-login/run`：管理员手动触发执行
- `GET /api/auto-login/history`：历史记录分页查询
- `GET /api/auto-login/cookies`：当前 Cookie 概览
- `GET /api/auto-login/tick`：定时任务心跳入口

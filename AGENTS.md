# IELTI AI 工作规则

这个项目是用户个人 IELTS General Training（G 类）学习工具。

Codex / Claude Code 在进入本项目后，应优先阅读并遵守本文件。

项目详细介绍请参考 README.md。

---

# 1. 开发环境

当前项目环境：

- 主机：Mac mini M1
- 项目路径：

```
/Users/ilam/Projects/IELTI
```

- 编辑器：
  - VS Code
  - VS Code Remote SSH

- AI 工具：
  - Codex CLI
  - Claude Code

当前目录即为：

- 网站源码目录
- GitHub Pages 发布目录

不要假设存在其他源码副本。

---

# 2. 项目类型

IELTI 是：

- 原生 HTML5 多页面应用
- 原生 CSS
- 原生 JavaScript

不使用：

- React
- Vue
- TypeScript
- Vite
- Webpack
- npm
- package.json
- 数据库

不要主动引入新的前端框架或构建系统。

保持：

- 简单
- 可维护
- GitHub Pages 兼容

---

# 3. 修改原则

修改代码前：

1. 先理解现有结构。
2. 检查相关 HTML、CSS、JS 文件。
3. 说明修改方案。
4. 只进行必要修改。

不要：

- 大规模重构
- 重写整个页面
- 修改目录结构
- 删除旧功能
- 替换技术架构

优先：

1. 稳定性
2. 用户学习数据安全
3. 保持现有设计
4. 小范围优化

---

# 4. IELTS 学习目标

用户目标：

IELTS General Training（G 类）。

涉及：

- 词汇
- 例句
- 学习路线
- 练习场景

默认使用：

- 日常生活
- 工作
- 社区沟通
- 书信写作
- 生活化听说场景

不要默认按照 Academic IELTS：

- 学术论文
- 图表作文
- 高难学术表达

设计内容。

---

# 5. 核心代码规则

## HTML

主要页面：

- index.html
- ielts-roadmap.html
- ielts_word_memory_v2_ipa.html
- ielts-core-vocabulary.html
- ielts-vocabulary-categories.html
- 121-letter-combinations.html
- ielts-video-player.html
- ielts-ebook-library.html
- ielts-ebook-reader.html

修改 HTML 时：

- 保持页面结构。
- 保持导航一致。
- 不删除已有功能。

---

## CSS

主要样式：

- apple-ui.css
- eink-ui.css
- library-ui.css

规则：

- 优先修改共享 CSS。
- 不在多个页面重复写相同样式。
- 保持 Apple 风格。

设计要求：

- 简洁
- 清晰
- 半透明材质
- 自然反馈

墨水屏模式：

- 高对比
- 黑白清晰
- 减少阴影
- 减少渐变

---

## JavaScript

共享逻辑：

- ielti-core.js

负责：

- 学习进度
- 数据迁移
- 间隔重复
- 导入导出
- 同步
- 主题
- 导航
- 语音
- 学习计时

修改时必须谨慎。

不要随意改变：

- localStorage 数据结构
- 学习进度格式
- 同步逻辑

---

# 6. 学习数据保护

学习数据非常重要。

不要：

- 清空 localStorage
- 重置学习进度
- 覆盖用户备份
- 删除同步身份

修改学习功能前：

必须确认：

- 数据迁移是否安全
- 旧数据是否兼容

---

# 7. 单词复习与到期计算规则

当前间隔复习的唯一有效规则如下；如果其他文档、注释或旧实现与本节冲突，以本节和当前代码为准，并应同步替换冲突内容。

## 复习间隔

- `忘记（rating=0）`：约 10 分钟后重新到期。
- `模糊（rating=1）`、`记得（rating=2）`、`很熟（rating=3）`：继续按真实复习时间计算间隔。
- 日级间隔不得简单改成目标日期凌晨、早上 4 点或其他固定时刻，因为这可能把“1 天后”缩短为几个小时。
- 卡片的 `due` 和 `lastReviewed` 必须保留完整 ISO 日期与时间，不能只保存日期。

## 每日到期快照

- 每个浏览器每天第一次打开网站时，创建当天的到期截止时间快照。
- 快照保存在浏览器 `localStorage`：

```text
ielti_due_snapshot_v1
```

- 当天“今日到期”只包含在截止时间之前已经成熟的卡片。
- 当天截止时间之后才成熟的日级间隔卡片进入 `deferredDue`，留到第二天首次打开时再进入“今日到期”。
- 普通刷新、页面切换、词库切换和同步更新不得自动推进当天截止时间。
- 用户主动点击“继续复习到期词”时，可以将截止时间推进到当前时间，主动纳入当天后来成熟的卡片。
- 当天点击“忘记”的卡片属于短时重练，仍必须在约 10 分钟后返回，不能被每日快照推迟到第二天。
- 首页和复习页必须使用同一快照及同一“今日到期”统计口径。

## 队列与统计术语

- `rawDue`：截至当前真实时间已经成熟的全部卡片。
- `todayDue`：符合当天快照、允许进入今日任务的卡片。
- `deferredDue`：已经成熟但在当天截止时间之后成熟、留到次日的卡片。
- `queueDue`：本轮实际加入队列的到期卡片。
- `fresh`：本轮加入的新词。

不要恢复“页面每次刷新都按当前时间重新计算并追加今日到期词”的旧行为。

---

# 8. 同步规则

同步配置：

文件：

```
ielti-config.js
```

当前 Worker：

```
https://word-sync.chilamc-y.workers.dev
```

同步规则：

- 本地 file:// 页面和 GitHub Pages 使用同一同步系统。
- localhost、127.0.0.1、::1 视为开发环境。
- 卡片合并必须以 `lastReviewed` 及状态更新时间戳判断新旧，不能让旧设备覆盖较新的复习结果。
- 分类词汇中不符合“至少复习 3 次、间隔至少 21 天且存在 `lastReviewed`”条件的旧 `mastered=true`，必须在合并前规范化并安全回写云端，使多设备状态收敛。
- 同步日志不得放入学习进度对象或随学习进度上传，避免日志本身制造同步差异。

不要修改同步地址。

不要删除：

- 旧 PHP 同步代码
- 数据兼容逻辑

除非用户明确要求。

---

# 9. 调试日志规则

日志实现代码位于：

```text
ielti-core.js
```

队列日志的调用位于：

```text
ielts_word_memory_v2_ipa.html
```

## 存储位置

- 日志必须独立保存在当前浏览器的 `localStorage`：

```text
ielti_debug_log_v2
```

- 日志不是项目目录中的常驻 `.log` 文件。
- 日志不得写入学习进度键 `ielti_progress_v3`。
- 日志不得写入 `model._debugLog`。
- 日志不得随学习进度同步到 Worker。
- 旧版 `model._debugLog` 只允许自动迁移一次到 `ielti_debug_log_v2`，迁移后必须从学习进度中删除。

## 独立日志文件

右下角调试面板的“下载 JSONL”按钮将独立日志导出为：

```text
IELTI-debug-YYYY-MM-DD.jsonl
```

该文件由浏览器下载到用户的默认下载目录，不固定写入项目目录。它用于查看、搜索或提交诊断，不属于学习备份，不得提交到 Git。

“复制诊断”应包含：

- 应用版本
- 设备 ID 尾部
- 页面及在线状态
- 当天到期快照
- 两个词库的 `rawDue`、`todayDue`、`deferredDue`
- 最近同步过程
- 最近错误

## 日志内容

- 每条日志必须有独立 `eventId`、完整 ISO 时间、类型和设备 ID。
- 同一次同步的所有阶段必须使用相同 `syncId`。
- 同步日志应区分开始、拉取、合并、推送、成功和错误阶段。
- 同步错误应记录阶段、请求路径、耗时、在线状态和 HTTP 状态码（如可用）。
- 严禁记录同步令牌、Authorization 请求头或其他秘密信息。
- 合并日志应记录变化原因及汇总，并最多保存 10 张异常卡片的本地、远端和最终状态。
- 评分日志应记录单词、评分，以及复习次数、间隔和到期时间的前后变化。
- 队列日志必须记录 `rawDue`、`todayDue`、`deferredDue`、`queueDue` 和 `fresh`。

## 保留策略

- 普通活动日志：保留 7 天，最多 300 条。
- 同步日志：保留 14 天，最多 200 条。
- 错误日志：保留 14 天，最多 200 条。
- 清空日志只能清除 `ielti_debug_log_v2`，不得影响学习进度。

---

# 10. NAS 媒体规则

视频和 PDF 不进入 GitHub。

NAS 地址：

```
http://192.168.10.115/IELTI/
```

Tailscale HTTPS 地址：

```
https://ds418play.tail6d2cd4.ts.net/IELTI/
```

图书馆封面和 PDF 优先使用 Tailscale HTTPS：

- 封面：`https://ds418play.tail6d2cd4.ts.net/IELTI/thumbs/<id>.jpg`
- PDF：`https://ds418play.tail6d2cd4.ts.net/IELTI/03漫画书合集pdf/<文件名>`
- 配置统一写在 `ielti-config.js` 的 `nasHttpsBaseUrl`、`libraryThumbDir` 和 `libraryPdfDir`。
- 列表模式使用随 GitHub Pages 发布的轻量封面 `thumbs-sm/<id>.jpg`；网格展示模式使用 `libraryThumbDir` 指向的 NAS 大封面。不要混淆两套资源。
- PDF 卡片保持进入 `ielts-ebook-reader.html?id=<id>`，由阅读器使用 `libraryPdfDir` 加载 NAS 文件；EPUB 可以直接打开媒体地址。
- GitHub Pages 是 HTTPS，禁止把图书馆媒体主地址改回 NAS HTTP，否则会触发混合内容限制。
- 上述地址只对已连接当前 Tailnet 的设备可用。

学习路线图视频规则：

- 路线图视频必须通过 `nasHttpsBaseUrl` 生成 Tailscale HTTPS 地址，并使用部署在同一 NAS domain 的 `ielts-video-player.html` 播放，避免 GitHub Pages 到 Tailscale 私网媒体触发 PNA/CORS 预检；GitHub Pages 和本地 `file:` 页面都不得跳转到外部播放器或解析成 Mac 本地视频文件。
- NAS `/Volumes/web/IELTI/` 必须同步部署最新版 `ielts-video-player.html` 和 `ielti-core.js`；保留 NAS 自己的 `ielti-config.js`，不要用 GitHub 配置覆盖它。
- 播放器按真实播放秒数累计学习时长；暂停、后台和拖动跳转不得虚增时长。
- 单个视频累计实际观看达到视频时长的 90%，或自然播放结束后，自动标记路线图课程完成；不得要求用户必须手动勾选。
- 视频观看断点和累计时长写入 `ielti_video_watch_v1`，并纳入学习备份。

不要上传：

- 视频
- PDF
- 课程资料

不要修改 NAS 资源结构。

局域网 HTTP 地址仅作为本地兼容信息保留，不作为 GitHub Pages 图书馆媒体主地址。

---

# 11. PWA 缓存规则

相关文件：

- manifest.webmanifest
- sw.js

修改：

- CSS
- JS
- HTML

后：

必须检查：

- HTML 版本参数
- sw.js 缓存名称

避免移动端读取旧缓存。

---

# 12. Git 工作流

默认：

只修改本地。

不要自动：

- git commit
- git push
- 发布网站

除非用户明确要求。

提交前：

检查：

```bash
git status
```

查看：

```bash
git diff
```

提交信息使用英文。

例如：

```text
update IELTS vocabulary IPA display
```

---

# 13. 发布规则

GitHub Pages：

- 使用 GitHub Actions
- workflow：

```
.github/workflows/pages.yml
```

发布内容只包含：

允许：

- HTML
- CSS
- JS
- manifest
- Service Worker
- 图标
- 必要小尺寸封面

禁止：

- PDF
- 视频
- 学习备份
- 截图
- 下载生成的日志文件（包括 `IELTI-debug-*.jsonl`）
- thumbs/
- pdfs NAS 链接

不要修改 deploy/ 作为主要源码。

根目录才是源码。

---

# 14. 验证要求

修改 JavaScript：

至少执行：

```bash
node --check ielti-core.js
```

同时检查：

- HTML 内联脚本
- 页面加载
- 手机端布局
- 桌面端布局
- safe-area
- 墨水屏模式

---

# 15. AI 工作流程

每次修改：

1. 先分析。
2. 提出方案。
3. 修改最少文件。
4. 验证。
5. 汇报修改内容。

不要未经确认：

- 重构
- 发布
- 删除
- 修改数据结构。

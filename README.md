# IELTI 雅思学习工具

IELTI 是一个面向 **IELTS General Training（G 类）** 的个人学习网站，覆盖今日学习、课程路线、词汇记忆、听写复习、视频课程和电子书阅读。

项目采用原生 HTML、CSS 和 JavaScript，不依赖 npm、前端框架或构建工具。根目录就是网站的主要源码和 GitHub Pages 发布目录。

## 技术架构

- **页面层**：原生 HTML5 多页面应用
- **样式层**：原生 CSS，包含 Apple 风格、响应式布局和墨水屏模式
- **逻辑层**：原生 JavaScript，共享功能集中在 `ielti-core.js`
- **本地存储**：浏览器 `localStorage`
- **进度同步**：由 `ielti-config.js` 配置的 Cloudflare Worker HTTP 接口
- **离线与安装**：Web App Manifest + Service Worker（PWA）
- **图表**：Chart.js 和 chartjs-plugin-datalabels，通过 CDN 加载
- **PDF 阅读**：项目内置 Mozilla PDF.js
- **语音功能**：浏览器 Web Speech API
- **IPA 补全**：dictionaryapi.dev
- **部署**：GitHub Actions 自动部署到 GitHub Pages
- **大文件存储**：课程视频和 PDF 保存在 NAS，不进入 Git 仓库

项目没有使用 React、Vue、TypeScript、Vite、Webpack 或数据库，也没有 `package.json`。网页可以直接通过 `file://` 打开；PWA、Service Worker 等功能需要 HTTPS 或 localhost。

## 主要页面

| 文件 | 作用 |
| --- | --- |
| `index.html` | 今日学习首页，汇总当天课程、词汇复习和总体进度 |
| `ielts-roadmap.html` | IELTS G 类学习路线、课程打卡、统计和图表 |
| `ielts_word_memory_v2_ipa.html` | 词汇记忆中心，支持分类/核心词库、间隔重复、听写、发音和 IPA |
| `ielts-core-vocabulary.html` | 雅思核心词表浏览、分日背诵和掌握状态管理 |
| `ielts-vocabulary-categories.html` | 按主题分类学习词汇 |
| `121-letter-combinations.html` | 英语字母组合与发音学习 |
| `ielts-video-player.html` | NAS 课程视频播放页 |
| `ielts-ebook-library.html` | 电子书目录、封面和阅读进度 |
| `ielts-ebook-reader.html` | 基于 PDF.js 的电子书阅读器 |
| `category-notes-review.html` | 分类词汇例句和学习笔记检查工具 |

## 共享样式与逻辑

- `ielti-core.js`：统一进度模型、旧数据迁移、间隔重复、导入导出、自动同步、主题、导航、头像、语音和学习计时等共享逻辑。
- `ielti-config.js`：Worker 同步地址、同步范围及 NAS 视频、PDF、封面地址等环境配置。
- `apple-ui.css`：网站的主要视觉系统，包括页面布局、桌面/手机导航、卡片、按钮和交互反馈。
- `eink-ui.css`：墨水屏模式样式，强调高对比黑白显示并减少阴影和渐变。
- `library-ui.css`：电子书图书馆和阅读器专用样式。

统一标题、导航、显示模式、播放器控件或响应式规则时，应优先修改共享文件，避免在各页面重复实现。

## 内容数据

| 文件 | 内容 |
| --- | --- |
| `ielts-roadmap-data.js` | G 类学习路线和课程数据 |
| `ielts-word-data.js` | 分类词汇数据 |
| `ielts-core-word-data.js` | 记忆中心使用的核心词汇数据 |
| `ielts-core-vocab-data.js` | 核心词表页面数据 |
| `ielts-vocab-learning-notes.js` | 词汇释义、例句和学习提示 |
| `ielts-ebook-library-data.js` | 电子书目录、文件和封面信息 |

主要学习内容直接保存在 JavaScript 数据文件中，不依赖数据库。`IELTI-all-progress-*.json` 是个人进度备份，不是网站运行所需的源码文件。

## 学习进度与同步

统一学习数据保存在浏览器的 `ielti_progress_v3` 中。旧版路线图、核心词表、分类词汇和间隔重复记录会由共享逻辑自动迁移。

各词库的掌握状态和记忆中心的长期复习记录有所区别：“已熟悉”用于词汇浏览和筛选，长期掌握则由记忆中心的间隔重复结果决定。分类词汇与核心词表分别保存当前队列和学习位置，以便切换页面或词库后继续。

所有主要学习页面均可导出和导入 IELTI v1 格式的进度备份。备份包含路线图、计划开始日期、词汇状态、间隔重复记录和同步身份；主题、翻译缓存及 IPA 缓存等设备设置不包含在备份中。导入前会要求确认，未包含的数据不会被主动清除。

当前自动同步接口在 `ielti-config.js` 中配置为：

```text
https://word-sync.chilamc-y.workers.dev
```

本地 `file://` 页面和 GitHub Pages 页面使用同一套 Worker 同步。`localhost`、`127.0.0.1` 和 `::1` 被视为开发环境，可以不自动同步。`ielti-sync.php` 是保留的旧式 PHP 同步实现，目前不是默认同步入口。

学习进度属于重要数据。开发和调试时不要随意清空、重置或覆盖 `localStorage`，切换访问入口或设备前建议先导出备份。

## NAS 媒体

课程视频和 PDF 不存放在 GitHub。当前局域网媒体根地址由 `ielti-config.js` 配置，默认是：

```text
http://192.168.10.115/IELTI/
```

电子书 PDF 和封面分别通过 `libraryPdfDir` 与 `libraryThumbDir` 配置。根目录的 `pdfs` 是指向 NAS PDF 目录的本地符号链接，不属于发布文件。

GitHub Pages 使用 HTTPS，而 NAS 地址是 HTTP。浏览器可能因混合内容策略阻止线上页面加载 NAS 视频或 PDF；此问题需要在家庭局域网中为媒体提供可信 HTTPS，或采用其他浏览器允许的访问方式。

## PWA 与离线缓存

- `manifest.webmanifest`：定义应用名称、启动页、显示方式和安装图标。
- `sw.js`：缓存网站外壳和学习页面；视频、音频与 PDF 等媒体始终走网络，不写入离线缓存。
- `icon.png`：GitHub Pages 和 NAS 环境的默认图标及头像。
- `icon_local.png`：通过 `file://` 打开时的默认图标及头像。

用户上传的自定义头像优先于默认头像；重置头像后才按当前运行环境恢复对应默认图标。

修改共享 CSS 或 JavaScript 后，需要同步更新 HTML 引用中的版本参数以及 `sw.js` 的缓存名，避免移动设备继续使用旧缓存。

## 电子书与辅助工具

- `pdfjs/`：PDF.js 主程序和 Worker。
- `thumbs-sm/`：可随静态网站发布的小尺寸书籍封面。
- `thumbs/`：本地生成的较大封面目录，已被 Git 忽略。
- `scripts/start-library.command`：在 macOS 上启动本地 Python HTTP 服务并打开电子书库。
- `scripts/generate-thumbs.sh`：从 NAS 的 PDF/EPUB 批量生成封面。
- `fix2.pl`、`fix3.pl`：历史批量修正脚本，不是网站运行依赖。

## 本地运行

一般学习可以直接打开 `index.html`。如需测试 PWA、Service Worker 或电子书模块，可在项目根目录启动静态服务器：

```bash
python3 -m http.server 8765
```

然后访问：

```text
http://localhost:8765/index.html
```

电子书库也可以在 macOS 上运行 `scripts/start-library.command`。

## 验证要求

修改共享 JavaScript 后至少执行：

```bash
node --check ielti-core.js
```

同时应检查所有 HTML 内联脚本能否解析。修改样式时应检查桌面端、手机端、iPhone safe-area、深色模式和墨水屏模式。

## 发布规则

项目默认只做本地修改，不自动提交、推送或发布。只有在明确要求上传时，才通过 GitHub Desktop 或 Git 命令发布。

GitHub Pages 工作流位于 `.github/workflows/pages.yml`，推送到 `main` 后会部署根目录内容。发布前只应包含网站运行所需的静态文件，例如 HTML、CSS、JavaScript、manifest、Service Worker、图标和必要的小尺寸封面。

不要上传：

- 视频、PDF 和课程资料
- 学习进度备份
- 临时截图、日志和备份文件
- `node_modules`
- `thumbs/` 大封面目录
- `pdfs` 符号链接或 NAS 内容

`deploy/` 不是主要维护目录；根目录页面和共享资源才是源码来源。

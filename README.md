# IELTI 雅思学习工具

IELTI 是一个面向 **IELTS General Training（G 类）** 的个人学习网站，覆盖：

- 今日学习
- G 类课程路线
- 词汇记忆
- 听写复习
- 视频课程
- 电子书阅读
- 学习进度管理

项目采用原生 HTML、CSS 和 JavaScript 开发，不依赖 npm、前端框架或构建工具。

项目根目录即为：

- 网站源码目录
- GitHub Pages 发布目录

---

# 技术架构

## 页面层

- 原生 HTML5
- 多页面 Web 应用

## 样式层

- 原生 CSS
- Apple 风格 UI
- 响应式布局
- 墨水屏模式

## 逻辑层

- 原生 JavaScript

共享功能集中于：

```
ielti-core.js
```

负责：

- 学习进度管理
- 数据迁移
- 间隔重复
- 导入导出
- 自动同步
- 主题切换
- 导航
- 头像管理
- 语音功能
- 学习计时

---

# 数据与存储

## 本地存储

学习数据保存在浏览器：

```
localStorage
```

主要数据：

```
ielti_progress_v3
```

项目不使用数据库。

---

# 项目特点

## IELTS General Training（G 类）

学习内容围绕：

- 日常生活
- 工作场景
- 社区沟通
- 书信写作
- 实用英语表达

而不是 Academic IELTS 的：

- 学术论文
- 图表作文
- 高难学术场景

---

# 功能模块

## 词汇学习

支持：

- IELTS 核心词汇
- 分类词汇学习
- IPA 音标
- 发音练习
- 间隔重复复习
- 听写训练
- 学习状态记录

---

## 学习路线

页面：

```
ielts-roadmap.html
```

功能：

- G 类学习路线
- 课程计划
- 学习打卡
- 统计图表

---

## 电子书系统

页面：

```
ielts-ebook-library.html
ielts-ebook-reader.html
```

功能：

- 电子书目录
- 封面展示
- PDF 阅读
- 阅读进度记录

阅读器基于：

```
Mozilla PDF.js
```

---

## 视频课程

页面：

```
ielts-video-player.html
```

课程视频存放：

- NAS

不进入 GitHub 仓库。

---

# 主要页面

| 文件 | 作用 |
| --- | --- |
| `index.html` | 今日学习首页 |
| `ielts-roadmap.html` | IELTS G 类学习路线、课程计划和统计 |
| `ielts_word_memory_v2_ipa.html` | 词汇记忆中心，支持间隔重复、听写、IPA |
| `ielts-core-vocabulary.html` | 雅思核心词表 |
| `ielts-vocabulary-categories.html` | 分类词汇学习 |
| `121-letter-combinations.html` | 英语字母组合与发音学习 |
| `ielts-video-player.html` | NAS 视频课程播放 |
| `ielts-ebook-library.html` | 电子书目录 |
| `ielts-ebook-reader.html` | PDF.js 阅读器 |
| `category-notes-review.html` | 分类词汇例句和学习笔记检查 |

---

# 共享资源

## 样式

主要 CSS：

```
apple-ui.css
```

网站主要视觉系统：

- 页面布局
- 卡片
- 按钮
- 导航
- 响应式设计


```
eink-ui.css
```

墨水屏模式：

- 高对比
- 黑白显示
- 减少阴影和渐变


```
library-ui.css
```

电子书模块样式。

---

## 数据文件

| 文件 | 内容 |
| --- | --- |
| `ielts-roadmap-data.js` | G 类学习路线和课程数据 |
| `ielts-word-data.js` | 分类词汇数据 |
| `ielts-core-word-data.js` | 核心词汇数据 |
| `ielts-core-vocab-data.js` | 核心词表页面数据 |
| `ielts-vocab-learning-notes.js` | 词汇释义、例句和学习提示 |
| `ielts-ebook-library-data.js` | 电子书目录数据 |

---

# 学习进度与同步

学习进度由：

```
ielti-config.js
```

配置。

同步接口：

```
https://word-sync.chilamc-y.workers.dev
```

规则：

- 本地 `file://` 页面使用同步
- GitHub Pages 页面使用同步
- localhost / 127.0.0.1 / ::1 视为开发环境

旧 PHP 同步文件：

```
ielti-sync.php
```

目前保留，但不是默认同步入口。

---

# 学习数据保护

学习进度属于重要数据。

包括：

- 路线图进度
- 词汇状态
- 间隔重复记录
- 同步身份

开发时：

不要：

- 清空 localStorage
- 重置学习进度
- 覆盖用户备份
- 删除迁移逻辑

支持：

- IELTI v1 格式导入导出
- 学习进度备份恢复

---

# NAS 媒体

课程视频和 PDF 不存储在 GitHub。

NAS 地址：

```
http://192.168.10.115/IELTI/
```

包括：

- 视频
- PDF
- 大尺寸封面

GitHub 仓库只保存：

- 网站源码
- 必要的小尺寸资源

注意：

GitHub Pages：

```
HTTPS
```

NAS：

```
HTTP
```

可能受到浏览器混合内容策略限制。

---

# PWA 与离线支持

项目支持：

Progressive Web App（PWA）

相关文件：

```
manifest.webmanifest
sw.js
```

功能：

- 添加到桌面
- 网站外壳缓存
- 离线访问学习页面

媒体：

- 视频
- 音频
- PDF

不进入离线缓存。

---

# 辅助工具

## PDF.js

目录：

```
pdfjs/
```

用于电子书阅读。


## 本地启动

启动静态服务器：

```bash
python3 -m http.server 8765
```

访问：

```
http://localhost:8765/index.html
```

---

# 开发验证

修改 JavaScript 后：

运行：

```bash
node --check ielti-core.js
```

同时检查：

- HTML 内联脚本
- 手机端布局
- 桌面端布局
- iPhone safe-area
- 墨水屏模式

---

# 部署

GitHub Pages 自动部署：

```
.github/workflows/pages.yml
```

流程：

```
git push main
        ↓
GitHub Actions
        ↓
GitHub Pages
```

---

# 发布规则

允许发布：

- HTML
- CSS
- JavaScript
- manifest
- Service Worker
- 图标
- 必要的小尺寸封面


禁止上传：

- 视频
- PDF
- 课程资料
- 学习备份
- 临时截图
- 日志文件
- 大尺寸封面目录 `thumbs/`
- NAS 内容
- `pdfs` 符号链接


源码位置：

```
项目根目录
```

不要将：

```
deploy/
```

作为主要维护目录。

---

# 项目目录

当前开发环境：

```
Mac mini M1
```

项目：

```
/Users/ilam/Projects/IELTI
```

Git：

```
git@github.com:chiyim/IELTI.git
```

开发方式：

```
MacBook
   ↓
VS Code Remote SSH
   ↓
Mac mini
   ↓
IELTI
```

AI 工具：

- Codex CLI
- Claude Code
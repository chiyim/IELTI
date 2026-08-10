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

# 7. 同步规则

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

不要修改同步地址。

不要删除：

- 旧 PHP 同步代码
- 数据兼容逻辑

除非用户明确要求。

---

# 8. NAS 媒体规则

视频和 PDF 不进入 GitHub。

NAS 地址：

```
http://192.168.10.115/IELTI/
```

不要上传：

- 视频
- PDF
- 课程资料

不要修改 NAS 资源结构。

注意：

GitHub Pages 是 HTTPS。

NAS 是 HTTP。

可能存在浏览器混合内容限制。

---

# 9. PWA 缓存规则

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

# 10. Git 工作流

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

# 11. 发布规则

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
- 日志
- thumbs/
- pdfs NAS 链接

不要修改 deploy/ 作为主要源码。

根目录才是源码。

---

# 12. 验证要求

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

# 13. AI 工作流程

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
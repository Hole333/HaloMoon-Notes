---
title: 'HaloMoon 笔记仓库使用说明'
description: '使用普通 Markdown 文件一键同步到 HaloMoon 博客。'
created: '2026-09-17'
updated: '2026-09-17'
tags: ['HaloMoon', 'Markdown']
draft: false
---

学习笔记全部保存在这个 GitHub 仓库中。

## Markdown 格式

只需要在对应分类目录创建普通 Markdown 文件：

```markdown
# 笔记标题

这里直接编写正文。
```

第一个一级标题自动成为博客标题，父文件夹自动成为分类和标签，不需要手写 Front Matter、摘要或 URL。

## 一键发布

Windows 双击：

```text
publish-notes.cmd
```

Linux 运行：

```bash
./publish-notes.sh
```

脚本会自动补齐元数据、提交、推送 GitHub 并更新博客。删除 Markdown 文件后运行同一个命令，对应页面也会删除。

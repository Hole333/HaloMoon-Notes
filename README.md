# HaloMoon Notes

HaloMoon 的独立 Markdown 学习笔记仓库。

## 最快使用方式

双击：

```text
manage-notes.cmd
```

Linux：

```bash
chmod +x manage-notes.sh
./manage-notes.sh
```

可以直接新建、删除、同步或拉取笔记。新建笔记会优先使用 VS Code 打开 Markdown 文件；保存完成后，脚本会提交并推送 GitHub，GitHub Actions 自动更新博客。

## 分类与网址映射

目录就是分类，Markdown 文件路径就是博客路径：

```text
notes/linux/network.md
→ https://www.halomoon.cn/notes/linux/network/
```

多级目录同样有效：

```text
notes/programming/python/asyncio.md
→ https://www.halomoon.cn/notes/programming/python/asyncio/
```

设置 Front Matter 中的 `draft: true` 后不会生成公开页面。

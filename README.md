# HaloMoon Markdown Articles

Write standard Markdown files inside a category folder. Every file is published in the website's **Articles** section.

```markdown
# Article title

Write the article body here.
```

The first H1 becomes the article title. The parent folder becomes the category and tag. The file path becomes `/blog/category/file-name/`.

Supported content includes GFM tables, task lists, strikethrough, footnotes, fenced code, local and remote images, inline math, and display math.

## One-click publish

Windows:

```text
publish-notes.cmd
```

Linux:

```bash
./publish-notes.sh
```

The publisher prepares metadata, commits every Markdown change, pushes GitHub, and starts deployment. Deleting a Markdown file and running the same command removes its article page.

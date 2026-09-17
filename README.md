# HaloMoon Notes

Write ordinary Markdown files inside a category folder. The first H1 is the title, and the parent folder is the category and tag.

```markdown
# My note title

Write the note body here.
```

Example:

```text
notes/structured_light/measurement.md
```

## One-click publish

Windows:

```text
publish-notes.cmd
```

Linux:

```bash
chmod +x publish-notes.sh
./publish-notes.sh
```

The publisher automatically creates the required metadata, commits every Markdown change, pushes GitHub, and starts the blog deployment. Deleting a Markdown file and running the same command removes its blog page.

## Note manager

Use `manage-notes.cmd` or `./manage-notes.sh` only when you want the interactive create/delete menu.

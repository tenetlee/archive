# GitHub repo structure for ARCHIVE

Your notes repo (`tenetlee/archive-legacy`) must follow this layout for the app to work.

## Folder layout

Categories live at the **root** of the repo — no wrapper folder needed:

```
Mathematics/
├── Calculus 1/
│   ├── notes.md          ← required
│   └── images/           ← optional
│       ├── limits-graph.png
│       └── derivative-rules.jpg
├── Calculus 2/
│   ├── notes.md
│   └── images/
└── Linear Algebra/
    ├── notes.md
    └── images/
Biology/
└── Cell Biology/
    ├── notes.md
    └── images/
Computer Science/
└── Data Structures/
    ├── notes.md
    └── images/
```

Rules:

- **Category** — One folder per subject at the repo root (e.g. `Mathematics`, `Biology`). Name = label on the home page.
- **Course** — One folder per course inside each category (e.g. `Calculus 1`, `Data Structures`). Name = label on the category page.
- **notes.md** — Required in each course folder. Markdown + LaTeX supported.
- **images/** — Optional. Put images here and reference them in `notes.md` as `images/filename.png`.

## notes.md format

Each course's `notes.md` must start with a title and optional prerequisites:

```markdown
# Course Title Here

Prerequisites: Mathematics/Calculus 1, Biology/Cell Biology

Your full markdown content starts here. Use **bold**, *italic*, lists, code blocks, and LaTeX math.

Inline math: $E = mc^2$

Block math:
$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

Reference images in the same course's images folder:

![Limits graph](images/limits-graph.png)
```

- **Line 1:** `# Title` — Shown as the article title and in breadcrumbs.
- **Line 2:** `Prerequisites: ...` — Comma-separated paths. Each path is either:
  - `Category/Course` (e.g. `Mathematics/Calculus 1`), or
  - `Category/Course/notes.md`
- **Line 3:** Empty line.
- **Rest:** Normal markdown (headings, paragraphs, lists, code, LaTeX, images).

Image paths in the body are relative to the **course folder**. So from `Mathematics/Calculus 1/notes.md`, use `images/limits-graph.png`, not `Mathematics/Calculus 1/images/...`.

## Prerequisites paths

Prerequisites are shown on the right sidebar and link to other articles. Use the path that identifies the course:

- ✅ `Mathematics/Calculus 1`
- ✅ `Mathematics/Calculus 1/notes.md`
- ❌ `Calculus 1` (no category — won't resolve correctly)

The app will look up the target course's `notes.md` and use its `# Title` as the link label.

## Branch

The app expects content on the **`main`** branch.

## Minimal example

Smallest valid setup:

```
Getting Started/
└── Welcome/
    └── notes.md
```

**Getting Started/Welcome/notes.md:**

```markdown
# Welcome to ARCHIVE

Your first paragraph. No prerequisites needed.
```

After you push this to `tenetlee/archive-legacy`, the app will show "Getting Started" on the home page and "Welcome" as a course inside it.

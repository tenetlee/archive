"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  imageBaseUrl: string;
}

export function MarkdownRenderer({
  content,
  imageBaseUrl,
}: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1
        className="mb-6 mt-10 text-4xl font-normal leading-tight tracking-tight text-foreground first:mt-0"
        style={{ fontFamily: "var(--font-title)" }}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="mb-4 mt-8 text-3xl font-normal leading-snug text-foreground"
        style={{ fontFamily: "var(--font-subtitle)" }}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="mb-3 mt-6 text-2xl font-normal leading-snug text-foreground"
        style={{ fontFamily: "var(--font-subtitle)" }}
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="mb-2 mt-5 text-xl font-normal text-foreground"
        style={{ fontFamily: "var(--font-subtitle)" }}
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        className="mb-2 mt-4 text-lg font-normal text-foreground"
        style={{ fontFamily: "var(--font-subtitle)" }}
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="mb-2 mt-4 text-base font-normal text-muted"
        style={{ fontFamily: "var(--font-subtitle)" }}
        {...props}
      >
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p
        className="mb-4 text-base leading-7 text-foreground"
        style={{ fontFamily: "var(--font-body)" }}
        {...props}
      >
        {children}
      </p>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-accent underline underline-offset-2 transition-colors hover:text-foreground"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    ),
    ul: ({ children, ...props }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="mb-4 ml-6 list-decimal space-y-1 text-foreground"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="mb-4 border-l-4 border-accent pl-4 italic text-muted"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className, ...props }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <code
            className={`block overflow-x-auto bg-surface-alt p-4 text-sm leading-6 text-foreground ${className || ""}`}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="bg-surface-alt px-1.5 py-0.5 text-sm text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre
        className="mb-4 overflow-x-auto border border-border bg-surface-alt p-0"
        {...props}
      >
        {children}
      </pre>
    ),
    table: ({ children, ...props }) => (
      <div className="mb-4 overflow-x-auto">
        <table
          className="w-full border-collapse border border-border text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border border-border bg-surface-alt px-4 py-2 text-left font-semibold text-foreground"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-4 py-2 text-foreground" {...props}>
        {children}
      </td>
    ),
    hr: (props) => <hr className="my-8 border-border" {...props} />,
    img: ({ src, alt, ...props }) => {
      const srcStr = typeof src === "string" ? src : "";
      const resolvedSrc =
        srcStr && !srcStr.startsWith("http")
          ? `${imageBaseUrl}/${srcStr}`
          : srcStr;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={alt || ""}
          className="my-4 max-w-full border border-border"
          loading="lazy"
          {...props}
        />
      );
    },
  };

  return (
    <div className="prose-archive max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeSlug, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

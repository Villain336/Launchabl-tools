"use client";

import { memo, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/primitives/CodeBlock";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function Pre({ children }: ComponentProps<"pre">) {
  // react-markdown wraps fenced code in <pre><code className="language-x">.
  const child = Array.isArray(children) ? children[0] : children;
  const props = (child && typeof child === "object" && "props" in child
    ? (child as { props: { className?: string; children?: ReactNode } }).props
    : {}) as { className?: string; children?: ReactNode };
  const lang = /language-([\w+-]+)/.exec(props.className ?? "")?.[1];
  const code = textOf(props.children).replace(/\n$/, "");
  return (
    <div className="my-3 not-prose">
      <CodeBlock lines={code.split("\n")} code={code} filename={lang ? `snippet.${lang}` : "snippet"} />
    </div>
  );
}

function Code({ className, children, ...rest }: ComponentProps<"code">) {
  if (className?.includes("language-")) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  }
  return (
    <code className="rounded-[4px] bg-field px-1 py-[1px] font-mono text-[0.9em] text-ink" {...rest}>
      {children}
    </code>
  );
}

function Anchor({ href, children }: ComponentProps<"a">) {
  const external = href?.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  );
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="chat-markdown text-[14px] leading-[1.6] text-ink [&>*+*]:mt-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: Pre,
          code: Code,
          a: Anchor,
          h1: ({ children }) => <h3 className="text-[16px] font-semibold text-ink">{children}</h3>,
          h2: ({ children }) => <h3 className="text-[15px] font-semibold text-ink">{children}</h3>,
          h3: ({ children }) => <h4 className="text-[14px] font-semibold text-ink">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-line pl-3 text-ink-2">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-line px-2 py-1.5 text-left font-semibold text-ink">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-line px-2 py-1.5 align-top text-ink-2">{children}</td>,
          hr: () => <hr className="border-line" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});

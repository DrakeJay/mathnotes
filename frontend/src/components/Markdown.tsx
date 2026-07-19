"use client";

import python from "highlight.js/lib/languages/python";
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import DemoBlock from "./demos/DemoBlock";

/* CommonMark treats `<demo …></demo>` as inline HTML, so react-markdown wraps
   it in a <p>. A <section> inside a <p> is invalid HTML — the browser
   reparents it and hydration fails — so paragraphs containing a demo are
   unwrapped. */
function containsDemo(node: ExtraProps["node"]): boolean {
  return Boolean(
    node?.children?.some((c) => c.type === "element" && c.tagName === "demo"),
  );
}

/* Lessons embed live demos with a custom tag: <demo name="gradient-descent"></demo>.
   rehype-raw parses it; the component map below renders it. In editor previews
   the demos are shown as placeholders so typing doesn't trigger API calls. */

export default function Markdown({
  content,
  demoMode = "live",
}: {
  content: string;
  demoMode?: "live" | "placeholder";
}) {
  const components = {
    demo: (props: { name?: string }) => (
      <DemoBlock name={props.name ?? ""} mode={demoMode} />
    ),
    p: ({ node, children }: React.ComponentProps<"p"> & ExtraProps) =>
      containsDemo(node) ? <>{children}</> : <p>{children}</p>,
  } as Components;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[
        rehypeRaw,
        rehypeKatex,
        // Only Python is registered — fence code blocks as ```python.
        [rehypeHighlight, { languages: { python }, detect: false }],
      ]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

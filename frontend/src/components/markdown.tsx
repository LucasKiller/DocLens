'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        // GFM: tabelas, checklists, ~~risco~~, etc.
        remarkPlugins={[remarkGfm]}
        // syntax highlight em ```code```
        rehypePlugins={[rehypeHighlight]}
        // Sem HTML bruto: mais seguro (não usamos rehype-raw)
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-indigo-300 underline" />
          ),
          code: (props: any) => {
            const { node, inline, className, children, ...rest } = props;
            // mantém <code> inline sem borda, e blocos com <pre><code>
            if (inline) {
              return <code className="px-1 rounded bg-white/10">{children}</code>;
            }
            return (
              <pre className="rounded-xl p-3 overflow-auto bg-black/40 border border-white/10">
                <code className={className} {...rest}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

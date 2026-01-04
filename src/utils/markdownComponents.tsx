import { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      className="font-bold mt-4 mb-2 text-gray-800"
      style={{ fontSize: "14px" }}
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="font-bold mt-3 mb-2 text-gray-800"
      style={{ fontSize: "13px" }}
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      className="font-semibold mt-3 mb-2 text-gray-800"
      style={{ fontSize: "16px" }}
      {...props}
    />
  ),
  h4: ({ node, ...props }) => (
    <h4
      className="font-semibold mt-2 mb-1 text-gray-800"
      style={{ fontSize: "11px" }}
      {...props}
    />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside my-2 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
  ),
  li: ({ node, ...props }) => <li className="ml-2" {...props} />,
  p: ({ node, ...props }) => <p className="my-2" {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-gray-800" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  code: ({ node, className, children, ...props }: any) => {
    const isInline = !className?.includes("language-");
    return isInline ? (
      <code
        className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono"
        style={{ fontSize: "11px" }}
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={`bg-slate-50 text-gray-800 font-mono ${className}`}
        style={{ fontSize: "11px" }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }) => (
    <div className="relative my-2">
      <pre
        className="bg-slate-50 border border-gray-200 rounded-lg overflow-x-auto p-3 max-w-full custom-scrollbar"
        {...props}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none rounded-r-lg"
        style={{
          background:
            "linear-gradient(to left, rgb(248 250 252) 0%, rgb(248 250 252) 30%, transparent 100%)",
        }}
      />
    </div>
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600"
      {...props}
    />
  ),
  a: ({ node, ...props }) => (
    <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-4 border-gray-300" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="relative my-2 max-w-full">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border border-gray-300" {...props} />
      </div>
      <div
        className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, white 0%, white 30%, transparent 100%)",
        }}
      />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
  th: ({ node, ...props }) => (
    <th
      className="border border-gray-300 px-3 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-gray-300 px-3 py-2" {...props} />
  ),
};

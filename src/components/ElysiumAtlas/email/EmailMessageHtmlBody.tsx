"use client";

import { useEffect, useRef } from "react";

interface EmailMessageHtmlBodyProps {
  html: string;
  className?: string;
}

function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/<base[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

const SHADOW_STYLES = `
  :host {
    display: block;
    width: 100%;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .email-root {
    max-width: 100%;
  }

  .email-root img {
    max-width: 100%;
    height: auto;
  }

  .email-root table {
    max-width: 100%;
  }

  .email-root a {
    color: #1a73e8;
  }

  .email-root blockquote {
    border-left: 2px solid #d1d5db;
    margin: 0;
    padding-left: 12px;
    color: #4b5563;
  }
`;

export default function EmailMessageHtmlBody({
  html,
  className = "",
}: EmailMessageHtmlBodyProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const shadowRoot =
      host.shadowRoot ?? host.attachShadow({ mode: "open" });
    const safeHtml = sanitizeEmailHtml(html);

    shadowRoot.innerHTML = `
      <style>${SHADOW_STYLES}</style>
      <div class="email-root">${safeHtml}</div>
    `;

    shadowRoot.querySelectorAll("a").forEach((anchor) => {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    });
  }, [html]);

  return (
    <div
      className={`min-w-0 max-w-full overflow-x-auto bg-white px-3 py-3 isolate ${className}`}
    >
      <div ref={hostRef} className="block w-full" />
    </div>
  );
}

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple check if content has code blocks
  if (!content) return null;

  // Let's parse code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body text-[14px] sm:text-[15px] leading-relaxed break-words space-y-3">
      {parts.map((part, index) => {
        // Code Block case
        if (part.startsWith("```") && part.endsWith("```")) {
          const rawBlock = part.slice(3, -3);
          const firstNewLineIndex = rawBlock.indexOf("\n");
          let language = "code";
          let code = rawBlock;

          if (firstNewLineIndex !== -1) {
            const possibleLanguage = rawBlock.substring(0, firstNewLineIndex).trim();
            if (possibleLanguage && possibleLanguage.length < 15) {
              language = possibleLanguage;
              code = rawBlock.substring(firstNewLineIndex + 1);
            }
          }

          return (
            <div key={index}>
              <CodeBlock code={code.trim()} language={language} />
            </div>
          );
        }

        // Inline formatting case
        return (
          <div key={index}>
            <FormattedText text={part} />
          </div>
        );
      })}
    </div>
  );
}

// Interactive Code Block with copy functionality
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between bg-zinc-850 px-4 py-2 text-zinc-400 border-b border-zinc-800">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all active:scale-95 cursor-pointer"
          title="Copy to clipboard"
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 select-text">
        <code className="text-zinc-100 whitespace-pre text-[13px] block leading-relaxed float-none">
          {code}
        </code>
      </div>
    </div>
  );
}

// Multi-line and Inline text formatter helper
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, groupIdx) => {
        const trimmed = line.trim();

        // 1. Headers Check
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={groupIdx} className="text-sm sm:text-base font-bold font-serif text-white pt-2 tracking-tight">
              {parseInlineStyles(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={groupIdx} className="text-base sm:text-lg font-bold font-serif text-white pt-3 border-b border-white/5 pb-1 tracking-tight">
              {parseInlineStyles(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={groupIdx} className="text-lg sm:text-xl font-extrabold font-serif text-[#D4AF37] pt-4 border-b border-white/10 pb-1.5 tracking-tight">
              {parseInlineStyles(trimmed.slice(2))}
            </h1>
          );
        }

        // 2. Bullet List Check
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <div key={groupIdx} className="flex gap-2.5 items-start pl-2 py-0.5 text-zinc-300">
              <span className="text-[#D4AF37] mt-1.5 text-[8px]">•</span>
              <span className="text-[14px] sm:text-[15px]">{parseInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }

        // 3. Numbered List Check (e.g. "1. Hello")
        const numberedListRegex = /^(\d+)\.\s+(.*)$/;
        const listMatch = trimmed.match(numberedListRegex);
        if (listMatch) {
          const num = listMatch[1];
          const textContent = listMatch[2];
          return (
            <div key={groupIdx} className="flex gap-2.5 items-start pl-2 py-0.5 text-zinc-300">
              <span className="font-mono font-bold text-[#D4AF37] text-xs mt-0.5">{num}.</span>
              <span className="text-[14px] sm:text-[15px]">{parseInlineStyles(textContent)}</span>
            </div>
          );
        }

        // 4. Regular Paragraph case (preserving whitespace or rendering empty lines as small gaps)
        if (trimmed === "") {
          return <div key={groupIdx} className="h-1" />;
        }

        return (
          <p key={groupIdx} className="text-zinc-300 leading-relaxed text-[14px] sm:text-[15px]">
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

// Parse inline styles: bold (**text**), code (`code`)
function parseInlineStyles(text: string): React.ReactNode {
  if (!text) return "";

  // Splitting by bold separators (**text**) and coding accents (`code`)
  // Regex matches `text` or **text**
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <>
      {tokens.map((token, k) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={k} className="font-bold text-white">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith("`") && token.endsWith("`")) {
          return (
            <code key={k} className="font-mono text-zinc-100 bg-white/10 border border-white/5 px-1 py-0.2 rounded text-[12px] font-medium mx-0.5">
              {token.slice(1, -1)}
            </code>
          );
        }
        return token;
      })}
    </>
  );
}

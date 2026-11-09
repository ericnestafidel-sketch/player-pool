import Link from "next/link";
import type { ReactNode } from "react";
import { supportEmail } from "@/lib/legal";

export function LegalDocument({ source, versionLabel }: { source: string; versionLabel: string }) {
  const email = supportEmail();
  return (
    <main className="legal">
      {renderBlocks(source, email)}
      <p className="meta">{versionLabel}</p>
    </main>
  );
}

function renderBlocks(source: string, email: string | null): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) blocks.push(<p key={`p-${index}-${blocks.length}`}>{inline(text, email)}</p>);
  };
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }
    if (line.trim() === "---") {
      flushParagraph();
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1]?.length ?? 1;
      const raw = heading[2] ?? "";
      const anchor = /\{#([a-z0-9-]+)\}$/.exec(raw);
      const title = raw.replace(/\s*\{#[a-z0-9-]+\}$/, "");
      const id = anchor?.[1];
      const content = inline(title, email);
      if (level === 1) blocks.push(<h1 key={`h-${index}`} id={id}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={`h-${index}`} id={id}>{content}</h2>);
      else blocks.push(<h3 key={`h-${index}`} id={id}>{content}</h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("|")) {
      flushParagraph();
      const table: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("|")) {
        table.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push(<LegalTable key={`t-${index}`} rows={table} email={email} />);
      continue;
    }
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = (lines[index] ?? "").trim();
        const matches = ordered ? /^\d+\.\s+/.test(candidate) : /^[-*]\s+/.test(candidate);
        if (!matches) break;
        items.push(candidate.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
        index += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={`l-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item, email)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }
    paragraph.push(line.trim());
    index += 1;
  }
  flushParagraph();
  return blocks;
}

function LegalTable({ rows, email }: { rows: string[]; email: string | null }) {
  const parsed = rows
    .map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length && !cells.every((cell) => /^:?-+:?$/.test(cell)));
  const [head, ...body] = parsed;
  if (!head) return null;
  return (
    <table>
      <thead>
        <tr>
          {head.map((cell, cellIndex) => (
            <th key={cellIndex}>{inline(cell, email)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((cells, rowIndex) => (
          <tr key={rowIndex}>
            {cells.map((cell, cellIndex) => (
              <td key={cellIndex}>{inline(cell, email)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function inline(text: string, email: string | null): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\{\{SUPPORT_EMAIL\}\})/g;
  const parts = text.split(pattern).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    if (part === "{{SUPPORT_EMAIL}}") {
      if (!email) return <span key={index}>coming soon</span>;
      return (
        <a key={index} href={`mailto:${email}`}>
          {email}
        </a>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = link[2] ?? "";
      const label = link[1] ?? href;
      if (href.startsWith("/")) return <Link key={index} href={href}>{label}</Link>;
      return (
        <a key={index} href={href}>
          {label}
        </a>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

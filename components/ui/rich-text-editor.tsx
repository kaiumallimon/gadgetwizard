"use client";

import { useEffect } from "react";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write product details...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-64 w-full rounded-b-md bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none",
      },
    },
    onUpdate({ editor: nextEditor }) {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="h-72 w-full animate-pulse rounded-md border border-zinc-200 bg-zinc-100" />;
  }

  function setLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-zinc-200", className)}>
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
        <Button type="button" variant={editor.isActive("bold") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("underline") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("highlight") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("bulletList") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("orderedList") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("blockquote") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("codeBlock") ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"} size="icon" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("link") ? "secondary" : "ghost"} size="icon" onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
      {!editor.getText().trim() && <p className="-mt-64 px-4 py-3 text-sm text-zinc-400">{placeholder}</p>}
    </div>
  );
}

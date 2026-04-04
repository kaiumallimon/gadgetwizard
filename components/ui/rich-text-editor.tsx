"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
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
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImagePlus,
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
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder = "Write product details...",
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Image,
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
        class: "tiptap-content min-h-64 w-full rounded-b-md bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none",
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

  const activeEditor = editor;

  function setLink() {
    const previousUrl = activeEditor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function onSelectImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!file || !onImageUpload) {
      return;
    }

    try {
      setImageUploadError(null);
      setUploadingImage(true);
      const uploadedUrl = await onImageUpload(file);
      activeEditor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run();
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function insertImage() {
    if (onImageUpload) {
      fileInputRef.current?.click();
      return;
    }

    const url = window.prompt("Image URL", "https://");
    if (!url || !url.trim()) {
      return;
    }

    activeEditor.chain().focus().setImage({ src: url.trim() }).run();
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-zinc-200", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelectImageFile}
      />

      <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
        <Button type="button" variant={activeEditor.isActive("bold") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("italic") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("underline") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("highlight") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleHighlight().run()}>
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("heading", { level: 4 }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 4 }).run()}>
          <Heading4 className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("bulletList") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("orderedList") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("blockquote") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("codeBlock") ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"} size="icon" onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant={activeEditor.isActive("link") ? "secondary" : "ghost"} size="icon" onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeEditor.isActive("image") ? "secondary" : "ghost"}
          size="icon"
          onClick={insertImage}
          disabled={uploadingImage}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => activeEditor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => activeEditor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={activeEditor} />
      {!activeEditor.getText().trim() && <p className="-mt-64 px-4 py-3 text-sm text-zinc-400">{placeholder}</p>}
      {imageUploadError && <p className="border-t border-zinc-200 px-4 py-2 text-xs text-red-600">{imageUploadError}</p>}
    </div>
  );
}

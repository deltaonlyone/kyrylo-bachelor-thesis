import { Box, Button, Stack } from '@mui/material'
import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'

type Props = {
  value: string
  onChange: (value: string) => void
  onUploadImage?: () => Promise<string | null>
}

export function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, Highlight, Image],
    content: value || '<p></p>',
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const next = value || '<p></p>'
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button size="small" onClick={() => editor.chain().focus().toggleBold().run()}>B</Button>
        <Button size="small" onClick={() => editor.chain().focus().toggleItalic().run()}>I</Button>
        <Button size="small" onClick={() => editor.chain().focus().toggleBulletList().run()}>List</Button>
        <Button size="small" onClick={() => editor.chain().focus().setColor('#2563eb').run()}>Blue</Button>
        <Button size="small" onClick={() => editor.chain().focus().toggleHighlight().run()}>Mark</Button>
        {onUploadImage ? (
          <Button
            size="small"
            onClick={async () => {
              const imageUrl = await onUploadImage()
              if (imageUrl) {
                editor.chain().focus().setImage({ src: imageUrl }).run()
              }
            }}
          >
            Image
          </Button>
        ) : null}
      </Stack>
      <EditorContent editor={editor} />
    </Box>
  )
}

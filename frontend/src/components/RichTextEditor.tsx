import {
  Box,
  Divider,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'

/* ─── Icons (inline SVG to avoid extra deps) ─── */

const icon = (d: string, vb = '0 0 24 24') => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox={vb} fill="currentColor">
    <path d={d} />
  </svg>
)

const icons = {
  undo: icon('M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z'),
  redo: icon('M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z'),
  bold: icon('M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z'),
  italic: icon('M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z'),
  underline: icon('M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z'),
  strike: icon('M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z'),
  code: icon('M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'),
  subscript: icon('M22 18h-2v1h3v1h-4v-2.5a.5.5 0 0 1 .5-.5h2v-1h-3v-1h2.5a.5.5 0 0 1 .5.5V18zM5.67 8 2 4.33l1.41-1.41L7.09 6.5 10.67 2.92l1.41 1.41L5.67 8zM12.82 18H15L9.02 4H6.84l-5.98 14H3.04l1.56-4h6.66l1.56 4zM5.36 12 8 5.53 10.64 12H5.36z'),
  superscript: icon('M22 7h-2v1h3v1h-4V6.5a.5.5 0 0 1 .5-.5h2V5h-3V4h2.5a.5.5 0 0 1 .5.5V7zM5.67 20 2 16.33l1.41-1.41 3.67 3.58 3.58-3.58 1.41 1.41L5.67 20zM12.82 18H15L9.02 4H6.84l-5.98 14H3.04l1.56-4h6.66l1.56 4zM5.36 12 8 5.53 10.64 12H5.36z'),
  image: icon('M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'),
  link: icon('M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'),
  hr: icon('M2 12h20v2H2z', '0 0 24 24'),
  table: icon('M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm8-8h-6V5h6v6z', '0 0 24 24'),
  blockquote: icon('M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z'),
  codeBlock: icon('M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'),
  alignLeft: icon('M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z'),
  alignCenter: icon('M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z'),
  alignRight: icon('M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z'),
  bulletList: icon('M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z'),
  orderedList: icon('M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z'),
  h1: icon('M5 4v3h5.5v12h3V7H19V4H5z'),
  h2: icon('M5 4v3h5.5v12h3V7H19V4H5z'),
}

/* ─── Component ─── */

type Props = {
  value: string
  onChange: (value: string) => void
  onUploadImage?: () => Promise<string | null>
}

export function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const theme = useTheme()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Почніть вводити текст…' }),
    ],
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

  const handleInsertImage = useCallback(async () => {
    if (!editor || !onUploadImage) return
    const imageUrl = await onUploadImage()
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
    }
  }, [editor, onUploadImage])

  const handleInsertLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Введіть URL посилання:', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  const handleInsertTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  const isActive = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs)

  const tbSx = {
    minWidth: 32,
    height: 32,
    color: 'text.secondary',
    '&.Mui-selected, &.Mui-selected:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.15),
      color: 'primary.main',
    },
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      {/* ─── Toolbar ─── */}
      <Paper
        elevation={0}
        square
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.25,
          px: 0.75,
          py: 0.5,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* Undo / Redo */}
        <Tooltip title="Скасувати"><span>
          <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} sx={tbSx}>
            {icons.undo}
          </IconButton>
        </span></Tooltip>
        <Tooltip title="Повторити"><span>
          <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} sx={tbSx}>
            {icons.redo}
          </IconButton>
        </span></Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Headings */}
        <ToggleButtonGroup size="small" exclusive value={
          isActive('heading', { level: 1 }) ? 'h1'
          : isActive('heading', { level: 2 }) ? 'h2'
          : isActive('heading', { level: 3 }) ? 'h3'
          : 'p'
        } onChange={(_, v) => {
          if (!v || v === 'p') {
            editor.chain().focus().setParagraph().run()
          } else {
            const lvl = Number(v[1]) as 1 | 2 | 3
            editor.chain().focus().toggleHeading({ level: lvl }).run()
          }
        }}>
          <ToggleButton value="p" sx={tbSx}>¶</ToggleButton>
          <ToggleButton value="h1" sx={tbSx}>H1</ToggleButton>
          <ToggleButton value="h2" sx={tbSx}>H2</ToggleButton>
          <ToggleButton value="h3" sx={tbSx}>H3</ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Text formatting */}
        <Tooltip title="Жирний (Ctrl+B)">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={{ ...tbSx, ...(isActive('bold') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.bold}
          </IconButton>
        </Tooltip>
        <Tooltip title="Курсив (Ctrl+I)">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={{ ...tbSx, ...(isActive('italic') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.italic}
          </IconButton>
        </Tooltip>
        <Tooltip title="Підкреслення (Ctrl+U)">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} sx={{ ...tbSx, ...(isActive('underline') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.underline}
          </IconButton>
        </Tooltip>
        <Tooltip title="Закреслення">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleStrike().run()} sx={{ ...tbSx, ...(isActive('strike') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.strike}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Code / Sub / Super */}
        <Tooltip title="Код">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleCode().run()} sx={{ ...tbSx, ...(isActive('code') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.code}
          </IconButton>
        </Tooltip>
        <Tooltip title="Нижній індекс">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleSubscript().run()} sx={{ ...tbSx, ...(isActive('subscript') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.subscript}
          </IconButton>
        </Tooltip>
        <Tooltip title="Верхній індекс">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleSuperscript().run()} sx={{ ...tbSx, ...(isActive('superscript') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.superscript}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Insert */}
        {onUploadImage && (
          <Tooltip title="Зображення">
            <IconButton size="small" onClick={() => void handleInsertImage()} sx={tbSx}>
              {icons.image}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Посилання">
          <IconButton size="small" onClick={handleInsertLink} sx={{ ...tbSx, ...(isActive('link') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.link}
          </IconButton>
        </Tooltip>
        <Tooltip title="Горизонтальна лінія">
          <IconButton size="small" onClick={() => editor.chain().focus().setHorizontalRule().run()} sx={tbSx}>
            {icons.hr}
          </IconButton>
        </Tooltip>
        <Tooltip title="Таблиця">
          <IconButton size="small" onClick={handleInsertTable} sx={tbSx}>
            {icons.table}
          </IconButton>
        </Tooltip>
        <Tooltip title="Блок-цитата">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBlockquote().run()} sx={{ ...tbSx, ...(isActive('blockquote') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.blockquote}
          </IconButton>
        </Tooltip>
        <Tooltip title="Блок коду">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleCodeBlock().run()} sx={{ ...tbSx, ...(isActive('codeBlock') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.codeBlock}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Alignment */}
        <ToggleButtonGroup size="small" exclusive value={
          editor.isActive({ textAlign: 'center' }) ? 'center'
          : editor.isActive({ textAlign: 'right' }) ? 'right'
          : 'left'
        } onChange={(_, v) => {
          editor.chain().focus().setTextAlign(v ?? 'left').run()
        }}>
          <ToggleButton value="left" sx={tbSx}>
            <Tooltip title="По лівому краю">{icons.alignLeft}</Tooltip>
          </ToggleButton>
          <ToggleButton value="center" sx={tbSx}>
            <Tooltip title="По центру">{icons.alignCenter}</Tooltip>
          </ToggleButton>
          <ToggleButton value="right" sx={tbSx}>
            <Tooltip title="По правому краю">{icons.alignRight}</Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Маркований список">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={{ ...tbSx, ...(isActive('bulletList') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.bulletList}
          </IconButton>
        </Tooltip>
        <Tooltip title="Нумерований список">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={{ ...tbSx, ...(isActive('orderedList') && { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }) }}>
            {icons.orderedList}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Highlight */}
        <Tooltip title="Виділити текст">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleHighlight().run()} sx={{ ...tbSx, ...(isActive('highlight') && { bgcolor: alpha(theme.palette.warning.main, 0.2), color: 'warning.main' }) }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 14V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v8l-2 3v1h16v-1l-2-3zM6 19h12v2H6v-2z" />
            </svg>
          </IconButton>
        </Tooltip>
      </Paper>

      {/* ─── Editor ─── */}
      <Box
        sx={{
          p: 1.5,
          minHeight: 200,
          '& .tiptap': {
            outline: 'none',
            minHeight: 180,
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'text.primary',
          },
          '& .tiptap p.is-editor-empty:first-child::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: 'text.disabled',
            pointerEvents: 'none',
            height: 0,
          },
          '& .tiptap h1': { fontSize: '1.75rem', fontWeight: 700, mt: 2, mb: 1 },
          '& .tiptap h2': { fontSize: '1.4rem', fontWeight: 700, mt: 1.5, mb: 0.75 },
          '& .tiptap h3': { fontSize: '1.15rem', fontWeight: 600, mt: 1, mb: 0.5 },
          '& .tiptap ul, & .tiptap ol': { pl: 3 },
          '& .tiptap blockquote': {
            borderLeft: 4,
            borderColor: 'primary.main',
            pl: 2,
            ml: 0,
            mr: 0,
            fontStyle: 'italic',
            color: 'text.secondary',
          },
          '& .tiptap pre': {
            bgcolor: alpha(theme.palette.common.black, 0.05),
            borderRadius: 1,
            p: 1.5,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            overflow: 'auto',
          },
          '& .tiptap code': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25,
            fontFamily: 'monospace',
            fontSize: '0.85em',
          },
          '& .tiptap pre code': {
            bgcolor: 'transparent',
            borderRadius: 0,
            p: 0,
          },
          '& .tiptap img': {
            maxWidth: '100%',
            borderRadius: 1,
            my: 1,
          },
          '& .tiptap a': {
            color: 'primary.main',
            textDecoration: 'underline',
            cursor: 'pointer',
          },
          '& .tiptap hr': {
            border: 'none',
            borderTop: 2,
            borderColor: 'divider',
            my: 2,
          },
          '& .tiptap table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 1,
          },
          '& .tiptap td, & .tiptap th': {
            border: 1,
            borderColor: 'divider',
            p: 1,
            minWidth: 80,
          },
          '& .tiptap th': {
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            fontWeight: 600,
          },
          '& .tiptap mark': {
            bgcolor: alpha(theme.palette.warning.main, 0.3),
            borderRadius: 0.5,
            px: 0.25,
          },
          '& .tiptap sub': { fontSize: '0.75em' },
          '& .tiptap sup': { fontSize: '0.75em' },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  )
}

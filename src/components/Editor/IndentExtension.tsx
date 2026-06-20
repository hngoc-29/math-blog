import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
    }
  }
}

const MAX_INDENT = 8
const INDENT_STEP_REM = 1.5

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const raw = parseFloat(element.style.marginLeft || '0')
              if (Number.isNaN(raw) || raw <= 0) return 0
              return Math.max(0, Math.min(MAX_INDENT, Math.round(raw / INDENT_STEP_REM)))
            },
            renderHTML: attributes => {
              const level = Math.max(0, Math.min(MAX_INDENT, attributes.indent || 0))
              if (!level) return {}
              return { style: `margin-left: ${level * INDENT_STEP_REM}rem` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ state, tr, dispatch }) => {
          const { $from } = state.selection
          const node = $from.node()
          if (!this.options.types.includes(node.type.name)) return false
          const current: number = node.attrs.indent || 0
          if (current >= MAX_INDENT) return false
          if (dispatch) {
            const pos = $from.before($from.depth)
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current + 1 })
            dispatch(tr)
          }
          return true
        },
      decreaseIndent:
        () =>
        ({ state, tr, dispatch }) => {
          const { $from } = state.selection
          const node = $from.node()
          if (!this.options.types.includes(node.type.name)) return false
          const current: number = node.attrs.indent || 0
          if (current <= 0) return false
          if (dispatch) {
            const pos = $from.before($from.depth)
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current - 1 })
            dispatch(tr)
          }
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive('taskItem')) {
          return this.editor.commands.sinkListItem('taskItem')
        }
        if (this.editor.isActive('listItem')) {
          return this.editor.commands.sinkListItem('listItem')
        }
        if (this.editor.isActive('codeBlock')) {
          return this.editor.commands.insertContent('\t')
        }
        return this.editor.commands.increaseIndent()
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('taskItem')) {
          return this.editor.commands.liftListItem('taskItem')
        }
        if (this.editor.isActive('listItem')) {
          return this.editor.commands.liftListItem('listItem')
        }
        return this.editor.commands.decreaseIndent()
      },
    }
  },
})

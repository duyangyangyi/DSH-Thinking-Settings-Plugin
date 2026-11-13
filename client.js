window.__ModuleLoader__.load({
  id: 'dsh-thinking-language',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const OPTIONS = [
      { value: 'en', label: 'English' },
      { value: 'zh', label: '简体中文' },
    ]
    const rowStyle = {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '10px 0',
    }
    const textStyle = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }
    const titleStyle = { fontSize: 13, fontWeight: 600 }
    const descStyle = { fontSize: 12, opacity: 0.7, lineHeight: 1.4 }
    const groupStyle = { display: 'flex', gap: 6, flex: '0 0 auto' }

    function buttonStyle(active, disabled) {
      return {
        padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        border: '1px solid ' + (active ? 'var(--dsh-accent-color, #4d6bfe)' : 'rgba(127,127,127,0.35)'),
        background: active ? 'var(--dsh-accent-color, #4d6bfe)' : 'transparent',
        color: active ? '#fff' : 'inherit',
        opacity: disabled ? 0.6 : 1,
      }
    }

    function ThinkingLanguageRow(props) {
      const snapshot = props.useLanguage(s => s)
      const value = (snapshot && snapshot.value && snapshot.value.language) || 'en'
      const [busy, setBusy] = React.useState(false)
      const choose = (next) => {
        if (next === value || busy) return
        setBusy(true)
        Promise.resolve(props.setLanguage(next)).catch(() => {}).then(() => setBusy(false))
      }
      return h('div', { style: rowStyle },
        h('div', { style: textStyle },
          h('div', { style: titleStyle }, '思考语言'),
          h('div', { style: descStyle }, '模型内部推理使用的语言。回复语言仍跟随提问；代码、路径、命令保持原文。'),
        ),
        h('div', { style: groupStyle, role: 'group', 'aria-label': '思考语言' },
          OPTIONS.map((opt) => h('button', {
            key: opt.value,
            type: 'button',
            style: buttonStyle(opt.value === value, busy),
            'aria-pressed': opt.value === value ? 'true' : 'false',
            disabled: busy,
            onClick: () => choose(opt.value),
          }, opt.label)),
        ),
      )
    }

    return {
      inject: ['slots', 'configForms'],
      apply(ctx) {
        const form = ctx.configForms.get('thinking-language')
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'thinking-language',
          order: 20,
          inject: () => ({
            hooks: { language: form },
            setLanguage: (next) => form.set('language', next),
          }),
        }, ThinkingLanguageRow))
      },
    }
  },
})

window.__ModuleLoader__.load({
  id: 'dsh-thinking-language',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    let primitives = {}
    try { primitives = require('@deepseek-ai/dsh-client-ui-primitives') || {} } catch (error) { primitives = {} }
    const Menu = primitives.Menu
    const IconChevronDownOutlineRegular = primitives.IconChevronDownOutlineRegular

    const FOLD_OPTIONS = [
      { value: 'always', label: '折叠' },
      { value: 'on-complete', label: '思考完成折叠' },
      { value: 'never', label: '不折叠' },
    ]
    const LANGUAGE_OPTIONS = [
      { value: 'en', label: 'English' },
      { value: 'zh', label: '简体中文' },
    ]

    const styles = {
      row: {
        display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0',
        borderBottom: '0.5px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.25))',
        cursor: 'pointer', userSelect: 'none',
      },
      headerText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 48 },
      title: { fontSize: 14, fontWeight: 400, lineHeight: '22px', color: 'var(--dsw-alias-label-primary, inherit)' },
      description: { fontSize: 12, fontWeight: 400, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.9))' },
      summary: { display: 'inline-flex', alignItems: 'center', gap: 8, flex: '0 0 auto', fontSize: 13, color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.9))' },
      chevron: { transition: 'transform 150ms ease' },
      body: { display: 'flex', flexDirection: 'column', paddingBottom: 8 },
      line: { display: 'flex', alignItems: 'center', gap: 24, padding: '12px 0' },
      lineText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 },
      lineTitle: { fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-primary, inherit)' },
      lineDesc: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary, rgba(127,127,127,0.9))' },
      selector: {
        display: 'inline-flex', alignItems: 'center', gap: 12, height: 36, padding: '0 14px',
        border: 'none', borderRadius: 'var(--dsw-radius-md, 8px)',
        background: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,0.12))',
        font: 'inherit', fontSize: 14, lineHeight: '22px',
        color: 'var(--dsw-alias-label-primary, inherit)', cursor: 'pointer',
      },
      nativeSelect: {
        height: 36, padding: '0 10px', borderRadius: 'var(--dsw-radius-md, 8px)',
        border: '0.5px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
        background: 'var(--dsw-alias-bg-module-platform, transparent)', color: 'inherit', font: 'inherit',
      },
    }

    function SelectLine({ label, description, value, options, disabled, onSelect }) {
      const [open, setOpen] = React.useState(false)
      const current = options.find((option) => option.value === value) || options[0]
      const trigger = h('button', {
        type: 'button', style: styles.selector, disabled,
        'aria-haspopup': Menu ? 'menu' : undefined,
        'aria-expanded': Menu ? open : undefined,
        'aria-label': label,
        onClick: (event) => {
          event.stopPropagation()
          if (!Menu) return
          setOpen((previous) => !previous)
        },
      }, current.label, IconChevronDownOutlineRegular
        ? h(IconChevronDownOutlineRegular, { style: { flex: 'none' } })
        : null)

      return h('div', { style: styles.line },
        h('div', { style: styles.lineText },
          h('div', { style: styles.lineTitle }, label),
          description ? h('div', { style: styles.lineDesc }, description) : null,
        ),
        Menu
          ? h(Menu, {
            open, onClose: () => setOpen(false), portal: true, align: 'end', selectedId: current.value,
            items: options.map((option) => ({ id: option.value, label: option.label })),
            onSelect: (id) => { setOpen(false); onSelect(id) },
            anchor: trigger,
          })
          : h('select', {
            style: styles.nativeSelect, value, disabled, 'aria-label': label,
            onChange: (event) => onSelect(event.target.value),
            onClick: (event) => event.stopPropagation(),
          }, options.map((option) => h('option', { key: option.value, value: option.value }, option.label))),
      )
    }

    function ThinkingSettings(props) {
      const snapshot = props.useLanguage((value) => value)
      const config = (snapshot && snapshot.value) || {}
      const language = config.language === 'zh' ? 'zh' : 'en'
      const fold = config.fold === 'on-complete' || config.fold === 'never' ? config.fold : 'always'
      const [open, setOpen] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const set = (field, next) => {
        if (busy) return
        setBusy(true)
        Promise.resolve(props.setField(field, next)).catch(() => {}).then(() => setBusy(false))
      }
      const foldLabel = (FOLD_OPTIONS.find((option) => option.value === fold) || FOLD_OPTIONS[0]).label
      const languageLabel = (LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[1]).label
      return h('div', null,
        h('div', {
          style: styles.row, role: 'button', tabIndex: 0,
          'aria-expanded': open,
          onClick: () => setOpen((previous) => !previous),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen((previous) => !previous) }
          },
        },
          h('div', { style: styles.headerText },
            h('div', { style: styles.title }, '思考设置'),
            h('div', { style: styles.description }, '推理的展开方式与语言；回复语言仍跟随提问。'),
          ),
          h('span', { style: styles.summary }, languageLabel + ' · ' + foldLabel,
            IconChevronDownOutlineRegular ? h(IconChevronDownOutlineRegular, {
              style: { ...styles.chevron, transform: open ? 'rotate(180deg)' : 'none' },
            }) : null),
        ),
        open ? h('div', { style: styles.body },
          h(SelectLine, {
            label: '思考折叠',
            description: '折叠：保持收起，点开才看；思考完成折叠：边想边展开，这段思考结束就收起；不折叠：始终展开。',
            value: fold, options: FOLD_OPTIONS, disabled: busy,
            onSelect: (next) => set('fold', next),
          }),
          h(SelectLine, {
            label: '思考语言',
            description: '模型内部推理使用的语言。代码、标识符、路径、命令保持原文，不翻译。',
            value: language, options: LANGUAGE_OPTIONS, disabled: busy,
            onSelect: (next) => set('language', next),
          }),
        ) : null,
      )
    }

    // ---- reasoning folding engine -------------------------------------------
    const rows = new WeakMap()
    let currentFold = 'always'
    let timer = 0

    function stateOf(row) {
      let state = rows.get(row)
      if (!state) {
        state = { auto: false, tries: 0, wasOpen: false, userClosed: false }
        rows.set(row, state)
      }
      return state
    }
    function trigger(row) {
      return row.querySelector('[aria-expanded]') || row.querySelector('button, [role="button"]')
    }
    function isRunning(row) { return row.getAttribute('data-state') === 'running' }
    function isOpen(row) { return row.hasAttribute('data-expanded') }
    function hasResponseAfter(row) {
      const wrap = row.parentElement
      if (!wrap) return false
      let element = wrap.nextElementSibling
      while (element) {
        if (element.querySelector && element.querySelector('[data-variant="think"]')) return false
        if ((element.textContent || '').trim().length > 0) return true
        element = element.nextElementSibling
      }
      return false
    }
    function click(row) {
      const element = trigger(row)
      if (!element) return false
      try { element.click() } catch (error) { return false }
      return true
    }
    function sync() {
      const list = document.querySelectorAll('[data-variant="think"]')
      for (const row of list) {
        const state = stateOf(row)
        const running = isRunning(row)
        const open = isOpen(row)
        if (open) state.wasOpen = true
        if (!open && state.auto && state.wasOpen) { state.userClosed = true; state.auto = false }
        if (currentFold === 'always') {
          if (open && state.auto) { if (click(row)) state.auto = false }
          continue
        }
        if (currentFold === 'never') {
          if (!open && !state.userClosed) { if (click(row)) { state.auto = true; state.tries += 1 } }
          continue
        }
        if (running && !open && !state.auto && !state.userClosed && state.tries < 3) {
          if (click(row)) { state.auto = true; state.tries += 1 }
        } else if (open && state.auto && (!running || hasResponseAfter(row))) {
          if (click(row)) { state.auto = false; state.tries = 0 }
        } else if (!running && !open) {
          state.auto = false
        }
      }
    }
    function schedule() {
      if (timer) return
      timer = setTimeout(() => { timer = 0; sync() }, 80)
    }
    function setMode(mode) {
      if (mode === currentFold) return
      currentFold = mode
      for (const row of document.querySelectorAll('[data-variant="think"]')) {
        rows.set(row, { auto: false, tries: 0, wasOpen: isOpen(row), userClosed: false })
      }
      schedule()
    }
    function startEngine(ctx) {
      const observer = new MutationObserver(schedule)
      try {
        observer.observe(document.body, {
          subtree: true, childList: true, characterData: true,
          attributes: true, attributeFilter: ['data-state', 'data-expanded'],
        })
      } catch (error) {}
      schedule()
      if (typeof ctx.effect === 'function') {
        try {
          ctx.effect(() => () => {
            try { observer.disconnect() } catch (error) {}
            if (timer) { clearTimeout(timer); timer = 0 }
          })
        } catch (error) {}
      }
    }

    return {
      inject: ['slots', 'configForms'],
      apply(ctx) {
        const form = ctx.configForms.get('thinking-language')
        const foldOf = (snapshot) => {
          const value = snapshot && snapshot.value && snapshot.value.fold
          return value === 'on-complete' || value === 'never' ? value : 'always'
        }
        currentFold = foldOf(form.getSnapshot())
        form.subscribe(() => setMode(foldOf(form.getSnapshot())))
        startEngine(ctx)

        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'thinking-settings',
          order: 20,
          inject: () => ({
            hooks: { language: form },
            setField: (field, value) => form.set(field, value),
          }),
        }, ThinkingSettings))
      },
    }
  },
})

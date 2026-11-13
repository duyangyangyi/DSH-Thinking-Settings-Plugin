window.__ModuleLoader__.load({
  id: 'dsh-thinking-language',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const FOLD_OPTIONS = [
      { value: 'always', label: '折叠' },
      { value: 'on-complete', label: '思考完成折叠' },
      { value: 'never', label: '不折叠' },
    ]
    const LANGUAGE_OPTIONS = [
      { value: 'en', label: 'English' },
      { value: 'zh', label: '简体中文' },
    ]

    const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }
    const titleStyle = { fontSize: 13, fontWeight: 600 }
    const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }
    const labelStyle = { fontSize: 12, opacity: 0.85 }
    const selectStyle = {
      minWidth: 140, padding: '4px 8px', fontSize: 12, borderRadius: 6,
      border: '1px solid rgba(127,127,127,0.35)', background: 'transparent', color: 'inherit',
    }

    function SettingRow({ label, value, options, disabled, onChange }) {
      return h('div', { style: rowStyle },
        h('span', { style: labelStyle }, label),
        h('select', {
          style: selectStyle,
          value,
          disabled,
          onChange: (event) => onChange(event.target.value),
          'aria-label': label,
        }, options.map((option) => h('option', { key: option.value, value: option.value }, option.label))),
      )
    }

    function ThinkingSettings(props) {
      const snapshot = props.useLanguage((value) => value)
      const config = (snapshot && snapshot.value) || {}
      const language = config.language === 'zh' ? 'zh' : 'en'
      const fold = config.fold === 'on-complete' || config.fold === 'never' ? config.fold : 'always'
      const [busy, setBusy] = React.useState(false)
      const set = (field, next) => {
        if (busy) return
        setBusy(true)
        Promise.resolve(props.setField(field, next)).catch(() => {}).then(() => setBusy(false))
      }
      return h('div', { style: sectionStyle },
        h('div', { style: titleStyle }, '思考设置'),
        h(SettingRow, {
          label: '思考折叠', value: fold, options: FOLD_OPTIONS, disabled: busy,
          onChange: (next) => set('fold', next),
        }),
        h(SettingRow, {
          label: '思考语言', value: language, options: LANGUAGE_OPTIONS, disabled: busy,
          onChange: (next) => set('language', next),
        }),
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
        if (!open && state.auto && state.wasOpen) {
          state.userClosed = true
          state.auto = false
        }
        if (currentFold === 'always') {
          if (open && state.auto) { if (click(row)) state.auto = false }
          continue
        }
        if (currentFold === 'never') {
          if (!open && !state.userClosed) { if (click(row)) { state.auto = true; state.tries += 1 } }
          continue
        }
        // on-complete: open while streaming, close when the thought finishes
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

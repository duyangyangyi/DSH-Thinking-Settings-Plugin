import { randomUUID } from 'node:crypto'
import z from '@deepseek-ai/schemastery'

export const name = 'thinking-language'

export const Config = z.object({
  // `volatile()` keeps the value editable from Settings without restarting the
  // plugin; the applied Config holds a live reference, so the resolved string is
  // read from the settings descriptor instead of the raw object.
  language: z.string().default('en').volatile(),
})

const ENGLISH = [
  '## Reasoning language',
  '',
  'Think and reason in English. This applies to your internal reasoning regardless of the language the user writes in.',
  'Write the visible reply in the language of the user\'s latest message.',
  'Keep code, identifiers, file paths, commands, configuration keys, and API names exactly as written; never translate them.',
  'This setting supersedes any earlier instruction about the language of your reasoning.',
].join('\n')

const CHINESE = [
  '## 思考语言',
  '',
  '内部推理（reasoning）一律使用简体中文，无论用户使用什么语言书写。',
  '即使上下文里大量出现英文、即使你前几段用英文推理过，也要立即切换成简体中文继续推理。',
  '可见回复的语言跟随用户最新一条消息的语言。',
  '代码、标识符、文件路径、命令、配置键、API 名称保持原文，不要翻译。',
  '本设置优先于此前任何关于思考语言的指令。',
].join('\n')

const REMINDER_EN = '(system reminder) Reason in English for this turn.'
const REMINDER_ZH = '（系统提醒）这一轮请用简体中文思考。'

function pick(value) {
  return value === 'zh' ? 'zh' : value === 'en' ? 'en' : null
}

/** Resolve the live choice; the applied Config references a mutable slot, not a string. */
function liveLanguage(ctx, config) {
  try {
    const service = typeof ctx.get === 'function' ? ctx.get('settings') : undefined
    if (service && typeof service.describe === 'function') {
      const row = service.describe().find((item) => item.ns === 'thinking-language')
      const picked = pick(row && row.value && row.value.language)
      if (picked !== null) return picked
    }
  } catch {}
  return pick(config && config.language) || 'en'
}

function reminderMessage(text) {
  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'thinking-language' },
  }
}

export function apply(ctx, config) {
  const text = () => (liveLanguage(ctx, config) === 'zh' ? CHINESE : ENGLISH)
  ctx.inject(['systemPrompt'], (child) => {
    child.effect(() => child.systemPrompt.section({
      name: 'thinking-language',
      order: 9000,
      text,
      interpolate: false,
    }))
  })

  // A system-prompt section alone is easy to drift away from mid-conversation, so
  // put a short reminder next to the user's message at the start of each turn.
  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    if (!decision || decision.kind !== 'enter' || payload.step !== 1) return decision
    const text = liveLanguage(ctx, config) === 'zh' ? REMINDER_ZH : REMINDER_EN
    return { ...decision, messages: [...decision.messages, reminderMessage(text)] }
  })
}

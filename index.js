import { randomUUID } from 'node:crypto'
import z from '@deepseek-ai/schemastery'

export const name = 'thinking-language'

export const Config = z.object({
  // `volatile()` keeps the value editable from Settings without restarting the
  // plugin; the applied Config holds a live reference, so the resolved string is
  // read from the settings descriptor instead of the raw object.
  language: z.string().default('en').volatile(),
  // Reasoning-row folding: always (host default), on-complete (expand while
  // streaming, collapse when the thought finishes), never (keep it open).
  fold: z.string().default('always').volatile(),
})

const ENGLISH = [
  '## Reasoning language (mandatory)',
  '',
  'You must reason in English. This is a mandatory requirement, not a preference.',
  'Do not reason in any other language. If the context is Chinese, or if you already started reasoning in another language, switch to English immediately.',
  'Write the visible reply in the language of the user\'s latest message.',
  'Keep code, identifiers, file paths, commands, configuration keys, and API names exactly as written; never translate them.',
  'This rule overrides any earlier instruction that conflicts with it.',
].join('\n')

const CHINESE = [
  '## 思考语言（强制）',
  '',
  '你必须使用简体中文进行内部推理。这是强制要求，不是偏好。',
  '禁止用英文或其他语言推理。即使上下文是英文、即使你已经开始用英文推理，也必须立刻改用简体中文。',
  '可见回复的语言跟随用户最新一条消息的语言。',
  '代码、标识符、文件路径、命令、配置键、API 名称保持原文，不要翻译。',
  '此规则优先于任何更早的、与之冲突的指令。',
].join('\n')

const REMINDER_EN = '(system directive) You must reason in English. Do not reason in any other language.'
const REMINDER_ZH = '（系统指令）必须用简体中文推理。禁止用英文推理。'

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

function reminderMessage(text, summary) {
  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'thinking-language', form: 'notice', summary },
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

  // One reminder per turn: a per-step reminder was verified ineffective and cost
  // tokens quadratically in the number of tool steps.
  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    if (!decision || decision.kind !== 'enter' || payload.step !== 1) return decision
    const chinese = liveLanguage(ctx, config) === 'zh'
    return {
      ...decision,
      messages: [...decision.messages, reminderMessage(
        chinese ? REMINDER_ZH : REMINDER_EN,
        chinese ? '思考语言：简体中文' : 'Reasoning language: English',
      )],
    }
  })
}

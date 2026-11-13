import z from '@deepseek-ai/schemastery'

export const name = 'thinking-language'

export const Config = z.object({
  language: z.string().default('en').volatile(),
})

const ENGLISH = [
  '## Reasoning language',
  '',
  'Think and reason in English. This applies to your internal reasoning regardless of the language the user writes in.',
  'Write the visible reply in the language of the user\'s latest message.',
  'Keep code, identifiers, file paths, commands, configuration keys, and API names exactly as written; never translate them.',
].join('\n')

const CHINESE = [
  '## 思考语言',
  '',
  '内部推理（reasoning）一律使用简体中文，无论用户使用什么语言书写。',
  '可见回复的语言跟随用户最新一条消息的语言。',
  '代码、标识符、文件路径、命令、配置键、API 名称保持原文，不要翻译。',
].join('\n')

export function apply(ctx, config) {
  const text = () => (config && config.language === 'zh' ? CHINESE : ENGLISH)
  ctx.inject(['systemPrompt'], (child) => {
    child.effect(() => child.systemPrompt.section({
      name: 'thinking-language',
      order: 9000,
      text,
      interpolate: false,
    }))
  })
}

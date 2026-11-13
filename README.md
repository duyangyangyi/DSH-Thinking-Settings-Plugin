# DSH Thinking Language Plugin

给 DeepSeek Harness 加一个开关：**锁定模型思考（reasoning）使用的语言**，在 **设置 → 通用设置 →「思考语言」** 里随时切换 **English / 简体中文**（默认 English）。

回复语言仍然跟随提问语言；代码、标识符、文件路径、命令、配置键、API 名称保持原文，不翻译。

## 安装

在 DSH 里：**设置 → 插件 → 安装**，填本地目录或仓库地址；或命令行：

```bash
dsh plugin --profile desktop add /path/to/dsh-thinking-language
```

如果从 GitHub 安装，可以用 tarball 直链：

```bash
dsh plugin --profile desktop add https://codeload.github.com/duyangyangyi/DSH-Tinking-Language-Plugin/tar.gz/refs/heads/main
```

装完刷新一次页面（客户端设置项在页面加载时注册）。

## 它怎么工作

- **Host 端**（`index.js`）向 `systemPrompt` 注册一个 section，文本函数每次组装提示时读取当前档位，因此切换后 **下一轮请求** 即生效，无需重启。
- 每轮第一步额外注入一条 `notice` 形式的强制提醒（每轮一条，不是每步一条）。
- **Client 端**（`client.js`）在通用设置的 `settings.general.item` 插槽注册一行「思考语言」，读写 `thinking-language` 配置项的 `language` 字段（`en` / `zh`）。
- 配置写入 profile 的配置文档，属于 DSH 的 settings 表单（volatile 字段）。

## 结构

```
index.js           Host 插件：注入系统提示 section
client.js          Client 插件：通用设置里的「思考语言」一行
cordis.patch.yml   bundle 补丁：插入一行插件
package.json       包含 dsh.bundle 与 dsh.client 声明
```

## 限制

- 这是**提示词级**的约束，不是 API 强制参数。DeepSeek 接口没有「思考语言」选项，插件能做的是在系统提示里明确要求；模型通常遵守，但不保证 100%。
- 切换只影响之后的请求，已经生成的思考不会重写。

## 兼容性

在 DSH 0.2.2-rc.2（Desktop）上验证通过。

## License

未指定。使用前请与作者确认。

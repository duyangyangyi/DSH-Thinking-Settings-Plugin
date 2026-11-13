# DSH Thinking Settings

给 DeepSeek Harness 的通用设置加一个可折叠的「思考设置」，展开后是两个并列的下拉（与通用设置其他项一致的下拉样式）：

| 设置 | 取值 | 说明 |
| --- | --- | --- |
| **思考折叠** | 折叠 / 思考完成折叠 / 不折叠 | 推理行的展开策略 |
| **思考语言** | English / 简体中文（默认 English） | 锁定模型推理使用的语言 |

回复语言跟随提问语言；代码、标识符、文件路径、命令、配置键、API 名称保持原文，不翻译。

## 思考折叠的三种模式

- **折叠**：保持 DSH 原生行为，推理行始终收起，点一下才展开。
- **思考完成折叠**：思考进行中自动展开、跟随流式输出；这段思考结束（开始输出正文，或该步结束）后自动收起。
- **不折叠**：推理行保持展开；你手动收起后不再强行打开。

## 思考语言

在系统提示中注入强制性的语言要求，并在每轮第一步注入一条简短的 `notice` 提醒（每轮一条，不是每步一条）。这是提示词级别的约束，不是接口参数——模型通常遵守，但不保证 100%。

## 安装

在 DSH 里：**设置 → 插件 → 安装**，填本地目录或仓库地址；或命令行：

```bash
dsh plugin --profile desktop add /path/to/dsh-thinking-language
```

从 GitHub 安装可以用 tarball 直链：

```bash
dsh plugin --profile desktop add https://codeload.github.com/duyangyangyi/DSH-Thinking-Settings-Plugin/tar.gz/refs/heads/main
```

装完刷新一次页面（客户端设置项与折叠引擎在页面加载时注册）。

## 结构

```
index.js           Host 插件：Config（language / fold）与系统提示 section、每轮提醒
client.js          Client 插件：通用设置的两个下拉 + 推理行折叠引擎
cordis.patch.yml   bundle 补丁
package.json       包含 dsh.bundle 与 dsh.client 声明
```

## 兼容性

在 DSH 0.2.2-rc.2（Desktop）上验证。

## License

未指定。使用前请与作者确认。

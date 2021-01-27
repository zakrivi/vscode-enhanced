# Enhanced for Visual Studio Code

基于 vscode 已有功能的基础上，作一些功能上的补充

## Extension Settings

### 路径别名智能跳转

- 基于项目根目录的 jsconfig.json 已配置的前提下

```jsonc
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@m/*": ["src/pages/mobile/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

- 路径别名智能跳转配置(default)

```jsonc
{
  "enhanced.alias": {
    "@": "src",
    "@m": "src/pages/mobile"
  },
  "enhanced.languages": ["javascript", "typescript", "vue", "scss"] // 可支持的所有文件类型
}
```

| Key                | Example        | Default                                     |
| ------------------ | -------------- | ------------------------------------------- |
| enhanced.alias     | { "@": "src" } | {}                |
| enhanced.languages | ["javascript"] | ["javascript", "typescript", "vue", "scss"] |

## 注意事项

- 一般可通过ctrl+click的方式进行跳转，但也有特殊情况，例如scss文件中引用的其他scss文件（有别名和文件后缀），只能通过f12进行跳转,而ctrl+click可能会报错
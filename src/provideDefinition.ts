import { CancellationToken, DefinitionProvider, Position, Range, TextDocument, Uri, workspace } from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { scssPath } from './utils/languages/scss'
import { vuePath } from './utils/languages/vue'
import { javascriptPath } from './utils/languages/javascript'

interface IgetDefinition {
    document: TextDocument,
    position: Position
}

const jsImportReg = /import\s+(?:(.+)\s+from\s+)?['"](.+)['"]/
const scssImport = /@import\s+['"]{1}([^"']+)['"];?$/

export default class GotoDefinition implements DefinitionProvider {
    alias: object = {}
    languages: string[] = []

    provideDefinition(document: TextDocument, position: Position, token: CancellationToken) {
        this.alias = this.configuration.get('alias') || {}
        this.languages = this.configuration.get('languages') || []

        if (!this.isValid({ document, position })) {
            return undefined
        }

        return this.getDefinition({ document, position })
    }

    get configuration() {
        return workspace.getConfiguration('enhanced')
    }

    isValid(options: { document: TextDocument, position: Position }) {
        const { document, position } = options
        if (!this.languages.includes(document.languageId)) {
            return false
        }
        const lineText = document.lineAt(position).text // 鼠标选中的行字符串
        if (!(lineText.includes('import') || lineText.includes('url('))) {
            return false
        }
        return true
    }

    async getDefinition({ document, position }: IgetDefinition) {
        const workspaceFolder = (workspace.workspaceFolders || [])[0] // 当前工作区信息
        const workspacePath = workspaceFolder.uri.fsPath// 工作区绝对路径
        const hoverPath = path.dirname(document.fileName) // 正在操作的文件所在的文件夹绝对路径
        const lineText = document.lineAt(position).text.trim() // 鼠标选中的行字符串

        console.log(lineText)
        let targetPath: string | undefined = ''
        switch (document.languageId) {
            case 'scss': {
                targetPath = scssPath(lineText, { alias: this.alias, workspacePath })
                break
            }
            case 'vue': {
                targetPath = scssPath(lineText, { alias: this.alias, workspacePath })
                if (!targetPath) {
                    targetPath = vuePath(lineText, { alias: this.alias, workspacePath, hoverPath })
                }
                break
            }
            case 'typescript':
            case 'javascript': {
                targetPath = javascriptPath(lineText, { alias: this.alias, workspacePath, hoverPath })
                if (!targetPath) {
                    targetPath = vuePath(lineText, { alias: this.alias, workspacePath, hoverPath })
                }
                break
            }
        }

        if (targetPath) {
            console.log('返回文件: ', targetPath)
            const originSelectionRange = document.lineAt(position).range
            const targetUri = Uri.file(targetPath || '')
            const targetRange = new Range(0, 0, 100, 0)
            return [{
                originSelectionRange,
                targetUri,
                targetRange,
            }]
        } else {
            return undefined
        }
    }
}
import { CancellationToken, DefinitionProvider, Position, Range, TextDocument, Uri, workspace } from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

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
        return workspace.getConfiguration('my-ext')
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
        const workspaceName = workspaceFolder.name // 工作区名称
        const workspacePath = workspaceFolder.uri.fsPath// 工作区绝对路径
        const hoverPath = path.dirname(document.fileName) // 正在操作的文件所在的文件夹绝对路径
        const lineText = document.lineAt(position).text.trim() // 鼠标选中的行字符串
        const aliasKey = Object.keys(this.alias).sort((a, b) => b.length - a.length).join('|')
        const aliasReg = new RegExp('^' + `(${aliasKey})`)

        console.log(lineText)
        let targetPath: string = ''
        switch (document.languageId) {
            case 'scss': {
                const match = lineText.match(scssImport)
                if (!match) {
                    return undefined
                }
                let matchPath = ''
                if (path.isAbsolute(match[1])) {
                    targetPath = workspacePath
                } else {
                    if (aliasReg.test(match[1])) {
                        const matchPath = match[1].replace(aliasReg, key => (<any>this.alias)?.[key])
                        targetPath = path.join(workspacePath, matchPath)
                    } else {
                        targetPath = path.resolve(hoverPath, match[1])
                    }
                }


                break
            }

            case 'vue': {
                const match = lineText.match(jsImportReg)
                if (!match) {
                    return undefined
                }
                const pathStr = match[match.length - 1]
                if (path.extname(pathStr)) {
                    console.log('有后缀')
                    // 有后缀
                    return undefined
                } else {
                    // 无后缀
                    if (aliasReg.test(pathStr)) {
                        // 有别名
                        const matchPath = pathStr.replace(aliasReg, key => (<any>this.alias)?.[key])
                        targetPath = path.join(workspacePath, matchPath)
                    } else {
                        targetPath = path.resolve(hoverPath, pathStr)
                    }

                    if (fs.existsSync(targetPath + '.js') || fs.existsSync(targetPath + path.sep + 'index.js')) {
                        console.log('已经存在js文件')
                        return undefined
                    }
                    
                    console.log('找不到默认js文件')
                    const suffix = ['.vue', path.sep + 'index.vue'].find(ext => {
                        return fs.existsSync(targetPath + ext)
                    })
                    if (suffix) {
                        targetPath += suffix
                    } else {
                        return undefined
                    }
                }

                break
            }

            case 'javascript': {
                const match = lineText.match(jsImportReg)
                if (!match) {
                    return undefined
                }
                const pathStr = match[match.length - 1]
                if (path.extname(pathStr)) {
                    // 有后缀
                    if (path.extname(pathStr) === 'js') {
                        return undefined
                    } else {
                        if (aliasReg.test(pathStr)) {
                            // 有别名
                            const matchPath = pathStr.replace(aliasReg, key => (<any>this.alias)?.[key])
                            targetPath = path.join(workspacePath, matchPath)
                        } else {
                            targetPath = path.resolve(hoverPath, pathStr)
                        }
                    }
                } else {
                    // 无后缀
                    if (aliasReg.test(pathStr)) {
                        // 有别名
                        const matchPath = pathStr.replace(aliasReg, key => (<any>this.alias)?.[key])
                        targetPath = path.join(workspacePath, matchPath)
                    } else {
                        targetPath = path.resolve(hoverPath, pathStr)
                    }

                    const suffix = ['.vue', path.sep + 'index.vue'].find(ext => {
                        return fs.existsSync(targetPath + ext)
                    })
                    if (suffix) {
                        targetPath += suffix
                    } else {
                        return undefined
                    }
                }
                break
            }
        }


        console.log('targetPath: ', targetPath)
        if (!targetPath) {
            return undefined
        }

        const originSelectionRange = document.lineAt(position).range
        const targetUri = Uri.file(targetPath || '')
        const targetRange = new Range(0, 0, 10, 0)
        // const targetSelectionRange = new Range(0, 0, 3, 0)
        return [{
            originSelectionRange,
            targetUri,
            targetRange,
            // targetSelectionRange
        }]
    }
}
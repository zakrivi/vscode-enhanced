import * as path from 'path'
import * as fs from 'fs'

const jsImportReg = /import\s+(?:(.+)\s+from\s+)?['"](.+)['"]/
const otherFileType = ['.vue', path.sep + 'index.vue', '.scss', path.sep + 'index.scss']

interface Iconfig {
    alias: any,
    workspacePath: string,
    hoverPath: string
}

// 仅考虑无后缀名的情况
export function vuePath(text: string, config: Iconfig) {
    const { alias, workspacePath, hoverPath } = config
    const aliasKey = Object.keys(alias).sort((a, b) => b.length - a.length).join('|')
    const aliasReg = new RegExp('^' + `(${aliasKey})`)
    const match = text.match(jsImportReg)
    let targetPath: string | undefined = undefined

    if (match) {
        const pathStr = match[match.length - 1]
        if (!path.extname(pathStr)) {
            // 无后缀
            if (aliasReg.test(pathStr)) {
                // 有别名
                const matchPath = pathStr.replace(aliasReg, key => alias[key])
                targetPath = path.join(workspacePath, matchPath)
            } else {
                targetPath = path.resolve(hoverPath, pathStr)
            }

            if (fs.existsSync(targetPath + '.js') || fs.existsSync(targetPath + path.sep + 'index.js')) {
                targetPath = undefined
            } else {
                const suffix = otherFileType.find(ext => {
                    return fs.existsSync(targetPath + ext)
                })
                if (suffix) {
                    targetPath += suffix
                } else {
                    targetPath = undefined
                }
            }
        }
    }

    return targetPath
}
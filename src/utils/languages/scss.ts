import * as path from 'path'
import * as fs from 'fs'

const scssImport = /^@?import\s+['"]{1}([^"']+)['"];?$/
const otherFileType = ['.scss', path.sep + 'index.scss']

interface Iconfig {
    alias: any,
    workspacePath: string
}

// 仅需支持存在别名的情况
export function scssPath(text: string, config: Iconfig) {
    const { alias, workspacePath } = config
    const aliasKey = Object.keys(alias).sort((a, b) => b.length - a.length).join('|')
    const match = text.match(scssImport)
    let targetPath: string | undefined = undefined

    if (match) {
        const aliasReg = new RegExp('^~?' + `(${aliasKey})`)
        if (aliasReg.test(match[1])) {
            const matchPath = match[1].replace(aliasReg, (match, key) => alias[key])
            targetPath = path.join(workspacePath, matchPath)
        }


        if (targetPath && !path.extname(targetPath)) {
            // 无后缀名
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

    return targetPath
}
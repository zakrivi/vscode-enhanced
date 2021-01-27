import * as path from 'path'

const jsImportReg = /import\s+(?:(.+)\s+from\s+)?['"](.+)['"]/

interface Iconfig {
    alias: any,
    workspacePath: string,
    hoverPath: string
}

export function javascriptPath(text: string, config: Iconfig) {
    const { alias, workspacePath, hoverPath } = config
    const aliasKey = Object.keys(alias).sort((a, b) => b.length - a.length).join('|')
    const aliasReg = new RegExp('^' + `(${aliasKey})`)
    let targetPath: string | undefined = undefined
    const match = text.match(jsImportReg)
    if (match) {
        const pathStr = match[match.length - 1]
        if (path.extname(pathStr)) {
            // 有后缀
            if (path.extname(pathStr) !== 'js') {
                if (aliasReg.test(pathStr)) {
                    // 有别名
                    const matchPath = pathStr.replace(aliasReg, key => alias[key])
                    targetPath = path.join(workspacePath, matchPath)
                } else {
                    targetPath = path.resolve(hoverPath, pathStr)
                }
            }
        }
    }

    return targetPath
}
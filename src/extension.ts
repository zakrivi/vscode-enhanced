import * as vscode from 'vscode'
import GotoDefinition from './provideDefinition'
const path = require('path')


const aliasMap:any = {
	'~@m': 'src/pages/mobile'
}


export function activate(context: vscode.ExtensionContext) {
	const hoverHander = vscode.languages.registerDefinitionProvider([
		{scheme: 'file', pattern: '**/*.{js,jsx,ts,tsx,vue,scss}'},
	],new GotoDefinition())

	context.subscriptions.push(hoverHander)
}

export function deactivate() {}

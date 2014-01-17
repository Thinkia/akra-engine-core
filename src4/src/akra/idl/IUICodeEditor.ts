// IUICodeEditor export interface
// [write description here...]

/// <reference path="IUIComponent.ts" />

module akra {
export interface IUICodeEditorOptions extends IUIComponentOptions {
	code?: string;
}
export interface IUICodeEditor extends IUIComponent {
	/** readonly */ codemirror: CodeMirrorEditor;

	value: string;
}
}

#endif

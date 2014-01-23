// IUIPanel export interface
// [write description here...]

/// <reference path="IUIComponent.ts" />

module akra {

	export interface IUIPanelOptions extends IUIComponentOptions {
		title?: string;
	}

	export interface IUIPanel extends IUIComponent {
		title: string;
		index: int;
		collapsed: boolean;


		collapse(bValue?: boolean): void;
		isCollapsible(): boolean;
		setCollapsible(bValue?: boolean): void;

		titleUpdated: ISignal<{ (pPabel: IUIPanel, sTitle: string): void; }>;
		selected: ISignal<{ (pPabel: IUIPanel): void; }>;
	}
}


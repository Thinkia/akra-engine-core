#ifndef IUITABS_TS
#define IUITABS_TS

#include "IUIComponent.ts"

module akra {
	IFACE(IUIPanel);

	export interface IUITabs extends IUIComponent {
		active: IUIPanel;

		select(i: uint);
		select(pPanel: IUIPanel);

		tabIndex(pPanel: IUIPanel): uint;
	}
}

#endif
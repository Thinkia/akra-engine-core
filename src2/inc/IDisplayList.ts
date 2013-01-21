#ifndef IDISPLAYLIST_TS
#define IDISPLAYLIST_TS

module akra {
	export interface IDisplayList extends IEventProvider {
		readonly name: string;
		//если используется <quick search>, то в случае если узлы сцены не были изменены, выдается null.
		_findObjects(pCamera: ICamera, bQuickSearch?: bool): ISceneObject[];
		_setup(pScene: IScene3d): void;
	}
}

#endif

import React from "react";
import { AnContext, SysComp } from "@anclient/anreact";
import { QueryConditions, Semantier } from "@anclient/semantier-st";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";

/**TODO move to @anclient/anreact */
export interface FieldMeta {
	field: string;
	label?: string;
	disabled?: boolean;
}

/** App North's props */
export interface Northprops {
    iportal?: string;
    servId: string;
    servs?: object;

    iwindow?: typeof window;
    iparent?: typeof parent;
    ilocation?: string;
}

export interface Comprops {
    /**Component uri usually comes from function configuration (set by SysComp.extendLinks) */
	uri: string;
    /**The matching url in React.Route */
	match?: {path: string};

	u?: boolean;
	c?: boolean;
    readonly tier: any;
    readonly crud?: string;
    readonly width?: Breakpoint;
};

// export type WelcomeProp = Readonly<{ classes: {board: any}; sys: typeof SysComp } extends Comprops>;
export interface WelcomeProp extends Comprops {
    readonly classes: { board: any }
    readonly sys: typeof SysComp
};

/**PropType of Poll's Form. */
export interface FormProp extends Comprops {
	/**Fields met for expanding by form, e.g. TRecordForm or CardForm. */
	readonly fields?: Array<{}>;
	readonly dense?: boolean;
    readonly classes: {
		root?: string; dialogPaper?: string; smalltip?: string;
        content?: string; buttons?: string;
		button?: string, card?: string;
		[x: string]: any
	};
    onClose?: (event: React.UIEvent) => void;
};

/**Query condition item, used by AnQueryForm.  */
export interface PollQueryCondt extends QueryConditions {
	pollIds?: Array<string>;
	states?: string;
}

export class Anform extends React.Component<FormProp, any, any> {
}

/**
 * Replacing @anclient/semantier/curd/CrudCompW
 */
export class CrudCompW<T extends Comprops> extends React.Component<T, any, any> {
    public media: {
        isLg?: boolean;
        isMd?: boolean;
		isSm?: boolean;
		isXl?: boolean;
		isXs?: boolean;
    };
    public uri: string;

	constructor(props: Readonly<T>) {
		super(props);

		this.uri = props.match && props.match.path || props.uri;
		if (!this.uri) 
			throw Error("Anreact CRUD component must set a URI path. (Component not created with SysComp & React Router 5.2 ?)");


		let {width} = props;
		CrudCompW.prototype.media = CrudCompW.setWidth(width);
	}

	static setWidth(width: string) {
		let media;

		if (width === 'lg') {
            media = {
			    isLg: true,
			    isMd: true,
			    isSm: true,
			    isXs: true
            }
		}
		else if (width === 'xl') {
			media = {
                isXl: true,
			    isLg: true,
			    isMd: true,
			    isSm: true,
			    isXs: true
            }
		}
		else if (width === 'sm') {
			media = {
                isSm: true,
			    isXs: true
            }
		}
		else if (width === 'xs')
			media = {isXs: true }
		else {
			media = {
                isMd: true,
			    isSm: true,
		    	isXs: true,
            }
		}

		return media;
	}
}
CrudCompW.contextType = AnContext;

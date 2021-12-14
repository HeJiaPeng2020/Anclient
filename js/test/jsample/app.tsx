
import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';

import { Protocol, SessionClient, ErrorCtx, SessionInf, AnsonMsg, AnsonResp
} from '@anclient/semantier-st';

import { L, Langstrs } from '../../anreact/src/utils/langstr';
import { AnContext } from '../../anreact/src/react/reactext';
import { AnReact, AnReactExt, AnreactAppOptions } from '../../anreact/src/react/anreact';
import { AnError } from '../../anreact/src/react/widgets/messagebox';
import { Sys, SysComp } from '../../anreact/src/react/sys';
import { Userst } from '../../anreact/src/jsample/views/users';
import { Domain } from '../../anreact/src/jsample/views/domain';
import { Roles } from '../../anreact/src/jsample/views/roles';
import { Orgs } from '../../anreact/src/jsample/views/orgs';

import { StandardProps } from '@material-ui/core';
import { JsampleTheme } from '../../anreact/src/jsample/styles';
import { MyInfCard } from '../../anreact/src/jsample/views/my-infcard';
import { MyPswd } from '../../anreact/src/jsample/views/my-pswdcard';


interface Approps extends StandardProps<any, string> {
	iwindow: Window;
	servs: {[h: string]: string};
	servId: string;
};

/** The application main, context singleton and error handler */
class App extends React.Component<Approps> {
	state = {
		servId: 'host',
		anClient: undefined as SessionClient, // SessionClient
		anReact: undefined as AnReact,  // helper for React
		hasError: false,
		iportal: 'portal.html',
	};

	// FIXME in this pattern, no need to use an object for error handling - callback is enough
	errCtx = {msg: undefined, onError: this.onError} as ErrorCtx;

	errorMsgbox: JSX.Element;

	/**Restore session from window.localStorage
	 * 
	 * @param props 
	 */
	constructor(props: Approps) {
		super(props);

		this.state.iportal = this.props.iportal;

		// this.onError = this.onError.bind(this);
		this.errCtx.onError = this.errCtx.onError.bind(this);
		this.onErrorClose = this.onErrorClose.bind(this);
		this.logout = this.logout.bind(this);

		// design: will load anclient from localStorage
		this.state.anClient = new SessionClient();

		// in case jserv config changed since last login
		if (props.servs)
			this.state.anClient.an.init(props.servs[props.servId || 'host']);

		// singleton error handler
		if (!this.state.anClient || !this.state.anClient.ssInf) {
			this.state = Object.assign(this.state, {
				nextAction: 're-login',
				hasError: true,
				msg: L('Setup session failed! Please re-login.')
			});
		}

		this.state.anReact = new AnReactExt(this.state.anClient, this.errCtx)
								.extendPorts({
									menu: "menu.serv",
									userstier: "users.tier",
									gpatier: "gpa.tier",
									mykidstier: "mykids.tier"
								});

		// loaded from dataset.xml
		this.state.anClient.getSks((sks) => {
			Object.assign(Protocol.sk, sks);
			console.log(sks);
		}, this.errCtx);
		Protocol.sk.xvec = 'x.cube.vec';
		Protocol.sk.cbbOrg = 'org.all';
		Protocol.sk.cbbRole = 'roles';
		Protocol.sk.cbbMyClass = 'north.my-class';
		console.log(Protocol.sk);

		// extending pages
		// Each Component is added as the route, with uri = path
		SysComp.extendLinks( [
			{path: '/sys/domain', comp: Domain},
			{path: '/sys/roles', comp: Roles},
			{path: '/sys/orgs', comp: Orgs},
			{path: '/sys/users', comp: Userst},
			{path: '/tier/users', comp: Userst},
		] );
	}

	onError(c: string, r: AnsonMsg<AnsonResp>) {
		console.error(c, r);

		this.errCtx.msg = r.Body().msg();
		this.errorMsgbox = <AnError onClose={() => this.onErrorClose(c)} fullScreen={false}
							title={L('Error')} msg={this.errCtx.msg as string} />
		this.setState({});
	}

	onErrorClose(code: string) {
		if (code === Protocol.MsgCode.exSession) {
			this.logout();
		}
		this.errorMsgbox = undefined;
		this.setState({});
	}

	/** For navigate to portal page
	 * FIXME this should be done in SysComp, while firing goLogoutPage() instead.
	 * */
	logout() {
		let that = this;
		// leaving
		try {
			this.state.anClient.logout(
				() => {
					if (this.props.iwindow)
						this.props.iwindow.location = this.state.iportal;
				},
				(c, e) => {
					// something wrong
					// console.warn('Logout failed', c, e)
					cleanup (that);
				});
		}
		catch(_) {
			cleanup (that);
		}
		finally {
			this.state.anClient = undefined;
		}

		function cleanup(app) {
			if (app.state.anClient)
				localStorage.setItem(SessionClient.ssInfo, null);
			if (app.props.iwindow)
				app.props.iwindow.location = app.state.iportal;
		}
	}

	render() {
	  let that = this;
	  return (
		<MuiThemeProvider theme={JsampleTheme}>
			<AnContext.Provider value={{
				ssInf: undefined as SessionInf,
				// FIXME we should use a better way
				// https://reactjs.org/docs/legacy-context.html#how-to-use-context
				// samports: this.state.samports, // FXIME or Protocol?
				anReact: this.state.anReact,
				pageOrigin: window ? window.origin : 'localhost',
				servId: this.state.servId,
				servs: this.props.servs,
				anClient: this.state.anClient, // as typeof SessionClient | Inseclient,
				hasError: this.state.hasError,
				iparent: this.props.iparent,
				ihome: this.props.iportal || 'portal.html',
				error: this.errCtx,
			}} >
				<Sys menu='sys.menu.jsample'
					sys='AnReact' menuTitle='Sys Menu'
					myInfo={myInfoPanels}
					onLogout={this.logout} />
				{this.errorMsgbox}
				{/* {this.state.hasError &&
					<AnError onClose={this.onErrorClose} fullScreen={false}
							title={L('Error')} msg={this.errCtx.msg as string} />} */}
			</AnContext.Provider>
		</MuiThemeProvider>);

		/**Create MyInfCard.
		 * To avoid create component before context avialable, this function need the caller' context as parameter.
		 * @param anContext
		 */
		function myInfoPanels(anContext: typeof AnContext) {
			return [
				{ title: L('Basic'),
				  panel: <MyInfCard
							uri={'/sys/session'} anContext={anContext}
							ssInf={that.state.anClient.ssInf} /> },
				{ title: L('Password'),
				  panel: <MyPswd
							uri={'/sys/session'} anContext={anContext}
							ssInf={that.state.anClient.ssInf} /> }
			  ];
		}
	}

	/**Try figure out serv root, then bind to html tag.
	 * First try ./private.host/<serv-id>,
	 * then  ./github.json/<serv-id>,
	 * where serv-id = this.context.servId || host
	 *
	 * For test, have elem = undefined
	 * @param elem html element id, null for test
	 * [opts.serv='host'] serv id
	 * [opts.iportal='index.html'] page showed after logout
	 */
	static bindHtml(elem: string, opts: {serv: string, portal?: string}) : void {
		let portal = opts.portal || 'index.html';
		try { Langstrs.load('/res-vol/lang.json'); } catch (e) {}
		AnReactExt.bindDom(elem, opts, onJsonServ);

		function onJsonServ(elem: string, opts: AnreactAppOptions, json: { [h: string]: string; }) {
			let dom = document.getElementById(elem);
			ReactDOM.render(<App servs={json} servId={opts.serv} iportal={portal} iwindow={window}/>, dom);
		}
	}

	static reportTranslation() {
		console.log(Langstrs.report());
	}
}

export {App};
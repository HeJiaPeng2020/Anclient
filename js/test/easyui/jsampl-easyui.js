////////////////////     jsample application common      ///////////////////////
// This frame include a project frame, like check-is-mobile(), and an API which
// is come from the lib of jclient.js.
// The following is the project adapter (common of engineering-costs).
////////////////////////////////////////////////////////////////////////////////
/** project utils
 * @module eng-cost/app */
const jconsts = {
	/**Warning log level, the higher value, the more verbose.<br>
	 * A coding convention of odys-z, nothing about the framework
	 * - feel free to ignore this.<br>
	 *
	 * 0: fatal error<br>
	 * 1: tolerable internal error<br>
	 * 2: design faults, or temporarily usable<br>
	 * 3: debug information that's essential to diagnose<br>
	 * 4+: additional debug information, etc.
	 */
	verbose: 5,
	/** if your tomcat server.xml is configured like:
	 * <Context docBase="jserv-sample" path="/jsample" reloadable="true"
	 * 		source="org.eclipse.jst.j2ee.server:jserv-sample"/></Host>
	 * you should get the engcosts/src/main/webapp/index.html
	 */
	serv: 'http://localhost:8080/jsample',
	/** connection Id used by this client */
	conn: 'local-sqlite',
	/**datas.xml/sk, sk for ir-combobox, ir-cbbtree shouldn't be here. */
	sk: {
		/**sk: system function menu dataset */
		menu: 'sys.menu.ez-test',
	},

	/**Application Message Strings, a callback called when jeasy-html.js is loaded.<br>
	 * These messages will override the default jeasy lib's messsges.<br>
	 * Putting all readable strings altoger in one place is also odysz's coding style,
	 * but have a look if your client is not an English speaker.
	 * @param {EzMsger} msger easyUI messager wrapper
	 */
	initMsg: function (msger) {
		msger.setM('saved', '保存成功!');
		msger.setM('deleted', '削除しました!');
	}
}

const samports = {
	/** see semantic.jserv/io.odysz.jsample.SysMenu */
	menu: "menu.serv",
	/** see semantic.jserv/io.odysz.jsample.cheap.CheapServ */
	cheapflow: "cheapflow.sample",

	/** views/Tool/project-toolBack-details.js */
	tools: "tools.serv",
}
/** Workflow Id*/
const workflowId = {
	/** change a form test flow 1 */
	flow01: 't01',

	/** change a form test flow 2 */
	flow02: 't02',
}

var J = jvue._J;
J.init(jconsts.serv, jconsts.conn);
window.J = J;

// otherwise jclient can't understand business defined ports.
J.understandPorts(samports);

/** Login Utility.<br>
 * requesting login.serv with login-obj: <br>
 * {a: "login/logout", uid: "user-id", pswd: "uid-cipher-by-pswd", iv: "session-iv"}
 * @param {string} userId user id in plain
 * @param {string} pswd password in plain
 * @param {function} onLogin callback on logged in
 * @param {string} home main page url. default = index.html
 * @param {function} robotOnFailed callback if logId == 'robot' and failed on pswd or uid
 */
function login(logId, pswd, onLogin, home, onError) {
    var checkEasyUI = false;
    checkEasyUI = checkDevice(navigator.userAgent||navigator.vendor||window.opera);
	if (checkLogInput(logId, pswd))
		return;
	logId = logId.trim();

	localStorage.setItem(ssk, null);
	$.cookie(ssk, null, {path: "/", expires: 3000});
	J.login(logId, pswd,
			function(client) {
				ssClient = client;
				if (typeof onLogin === "function") {
					// store session info temperary locally - window url will be changed
					// a more secure way is using a certification.
					var ss = JSON.stringify(client.ssInf);
					localStorage.setItem(ssk, ss);
					$.cookie(ssk, ss, {path: "/", expires: 10000});
					onLogin(client);
				}
				else {
					console.error("onLogin is not a function");
				}
			},
			typeof onError === "function" ? onError : EasyMsger.error);
}

/**Check user's input
 * @param {string} logId
 * @param {string} pswd
 * @return {boolean} true = error()
 */
function checkLogInput(logId, pswd) {
    var checkEasyUI = false;
    checkEasyUI = checkDevice(navigator.userAgent||navigator.vendor||window.opera);
	if (logId == null || typeof logId == "undefined" || $.trim(logId) == "") {
		if(checkEasyUI) alert('登录账号不能为空');
		else $.messager.alert('提示', '登录账号不能为空！', 'info');
		return true;
	} else if (pswd == null || typeof pswd == "undefined" || pswd == "") {
		if(checkEasyUI)
			alert('登录密码不能为空');
        else
			$.messager.alert('提示', '密码不能为空！', 'info');
		return true;
	}
}

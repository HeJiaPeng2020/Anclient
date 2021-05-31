import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import * as an from 'anclient'
/**
 * Anclinet logging-in component
 * @class
 */
export class Login extends React.Component {
	classes = makeStyles((theme) => ({
		root: {
		    '& > *': { margin: theme.spacing(1) }
		},
	}));

    state = {
		loggedin: false,
		pswd: '',
		userid: '',
    };

	/**
	 * initialize a instance of Anclient visition jserv service.
	 * @param {object} props
	 * @param {string} props.jserv="http://127.0.0.1:8080/jserv-sample"); url to service root.
	 * @constructor
	 */
	constructor(props) {
		super(props);

		this.an = an.an;
		this.an.init(props.jserv ? props.jserv : "http://127.0.0.1:8080/jserv-sample");

		this.onLogout = this.onLogout.bind(this);
		this.onLogin = this.onLogin.bind(this);
	}

	onLogin() {
		let that = this;
		if (!this.state.loggedin) {
			this.an.login(
				this.state.usrid,
				this.state.pswd,
				reload,
				onError
			);
		}
		else reload(this.ssClient);

		function reload (client) {
			that.ssClient = client;
			that.loggedin = true;
			if (typeof that.props.onLoginOk === 'function')
				that.props.onLoginOk(client);
			else console.log(client);
		}

		function onError (code, resp) {
			if (typeof that.props.onLoginErr === 'function')
				that.props.onLoginErr(code, resp);
			else if (code === an.Protocol.MsgCode.exIo)
				console.error('Network Failed!');
			else if (resp.body[0])
				console.error(code + ': ' + resp.body[0].m);
			else console.error(resp);
		}
	}

	onLogout() {
	}

	update(val) {
		setState(val);
	}

	render() {
      return (<div>
        <>
			<TextField required id="jserv"
					   label="Jserv URL" fullWidth={true}
					   defaultValue="http://localhost:8080/jserv-sample/" />
		</>
        <TextField required id="userid" label="Required"
                   defaultValue="User Id" />
        <TextField id="pswd" label="Password"
                    type="password"
                    autoComplete="new-password"
                    onChange={event => setState({pswd: event.target.value})} />
        <Button variant="contained" color="primary"
                onClick={this.onLogin} >Log in</Button>
        <Button variant="contained" color="primary"
                onClick={this.onLogout} >Log out</Button>
      </div>);
    }
}
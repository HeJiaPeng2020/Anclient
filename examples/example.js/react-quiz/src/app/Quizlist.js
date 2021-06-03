import React from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Add from '@material-ui/icons/Add';
import DraftsIcon from '@material-ui/icons/Drafts';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import SendIcon from '@material-ui/icons/Send';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import Sms from '@material-ui/icons/Sms';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

import {Jvector} from '../../../lib/jvector'
import {Login} from './Login.cmp.js'

class Quizlist extends React.Component {
	static getQx() { return ++quid; }

	classes = makeStyles({
		root: {
			width: '100%',
			maxWidth: 360,
		},
		nested: {
			'background-color': 'red'
		},
	});

    state = {
		userid: '',
		pswd: '',
		username: '',
        quizzes: [], // id, questions, answers, type, correct index
        currentqx: -1,
    };

	ssInf = undefined;
	ssClient = undefined;
	an = undefined;

	constructor(props = {}) {
		super(props);
		this.state.quizzes = props.quizzes || [];

		this.onSelect = this.onSelect.bind(this);
		this.onDetails = this.onDetails.bind(this);
		this.onFind = this.onFind.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onLogin = this.onLogin.bind(this);
		this.reload = this.reload.bind(this);
		this.alert = this.alert.bind(this);
	}

	onSelect(e) {
	  let qx = e.currentTarget.getAttribute('qx');
	  this.setState({currentqx: parseInt(qx)});
	};

	onDetails(e) {
	}

	onFind(e) {
		let quizzes = [{id: "todo 2"}];
		this.setState({quizzes});
	}

	onAdd(e) {
	}

	onLogin(client) {
		// console.log('Quizlist: loading with client:', client);
		this.ssClient = client;
		this.ssInf = client.ssInf;
		this.an = client.an;
		this.reload(client);
	}

	alert(resp) {
		console.error(resp);
	}

	reload (client) {
		let that = this;
		let jvector = new Jvector(client);
		jvector.query(onQuery);

		/**bind simple bars
		 * @param {jprotocol.AnsonResp} resp
		 */
		function onQuery(resp) {
			console.log(resp);

			resp = {
				count: 2, owener: 'admin',
				"quizzes": [
					{ "qx": 0,
					  "qtype": "multiple",
					  "title": "Quiz A",
					  "createdate": "1776-07-04",
					  "questions": 12,
					  "remarks": "Unicorn"
					},
					{ "qx": 1,
					  "qtype": "single",
					  "title": "Quiz B",
					  "createdate": "1911-10-10",
					  "questions": 5,
					  "remarks": "Pegasus"
					},
				]
			};
			that.setState({quizzes: resp.quizzes});
		}

		function onError (code, resp) {
			if (code === an.Protocol.MsgCode.exIo)
				that.alert('Network Failed!');
			else if (resp.body[0])
				// most likely MsgCode.exSession for password error
				that.alert(code + ': ' + resp.body[0].m);
			else console.error(resp);
		}
	}

	onLogout(e) { this.setState({userid: ''}); }

	items() {
		if (!this.state.quizzes)
			return;

		return this.state.quizzes.map( (q, x) => (
		  <div key={`${this.state.userid}.${this.state.quizzes[x]['qx']}`}>
			<ListItem button qx={x} onClick={this.onSelect} color='secondary'>
				<ListItemIcon><Sms /></ListItemIcon>
				<ListItemText primary={this.state.quizzes[x].title} />
				<ListItemText primary={this.state.quizzes[x].createdate}/>
			</ListItem>
			<Collapse in={this.state.currentqx == x} timeout="auto" >
				<TextField id="qtitle" label="Remarks"
				  variant="outlined" color="primary"
				  multiline fullWidth={true} value={this.state.quizzes[x].remarks}
				  onChange={this.onDetails} />
			</Collapse>
		  </div>)
		);
	}

	render() {
		return (<>
		  <Login onLoginOk={this.onLogin}/>
		  <List component="nav"
			aria-labelledby="nested-list-subheader"
			subheader={
				<ListSubheader component="div" id="quizzes-subheader">
				  { `User: ${this.state.username}` }
				</ListSubheader>
			}
			className={ this.classes.root } >

			{this.items()}
		  </List>
		</>);
	}

	bindQuizzes(elem) {
	    ReactDOM.render(<Quizlist />, document.getElementById(elem));
	}
}

export {Quizlist};

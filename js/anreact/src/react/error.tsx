/** This is the error page of CRUD, not the error message box (AnError). */
import $ from 'jquery';
import React from 'react';
	import ReactDOM from 'react-dom';
	import { withStyles } from "@material-ui/core/styles";
	import Button from '@material-ui/core/Button';

import { Comprops, CrudComp } from './crud';
import { AnContext, AnContextType } from './reactext';
import { TextField } from '@material-ui/core';
import { L } from '../utils/langstr';

const styles = (theme) => ( {
	root: {
		"& :hover": {
			backgroundColor: '#777'
		}
	}
} );

class ErrorComp extends CrudComp<Comprops> {
	// const { classes } = this.props;

	state = {
		details: '',
		info: '',
		desc: '',
		msg: undefined,
		sysName: '',
	};

	constructor(props) {
		super(props);
		this.state.sysName = props.sys || props.sysName || props.name;

		// this.onDetails = this.onDetails.bind(this);
	}

	/** A simulation of error triggering (used for error handling test). */
	toShowDetails() {
		const ctx = this.context as unknown as AnContextType;
		ctx.error.msg = this.state.msg;
		// if (typeof ctx.error.onError === 'function')
		// 	ctx.error.onError(this.state.msg, undefined);
		// TODO ...
	}

	toSubmit() {
		console.log('TODO');
	}

	render() {
		return (
		<>Error Page
			<TextField id="quizinfo" label={L('Error Description')}
				variant="outlined" color="secondary"
				multiline fullWidth={true}
				onChange={e => this.setState({desc: e.currentTarget.value})}
				value={this.state.desc} />
			<Button onClick={this.toShowDetails} color="secondary">
				{L('Details')}
			</Button>
			<Button onClick={this.toSubmit} color="primary">
				{L('Submit')}
			</Button>
		</>);
	}
}
ErrorComp.contextType = AnContext;

const Error = withStyles(styles)(ErrorComp);
export { Error, ErrorComp };


import React from 'react';
import { withStyles } from "@material-ui/core/styles";
import { Card, TextField, Typography } from '@material-ui/core';

import { L, Protocol, AnsonResp,
	AnConst, AnContext, AnError, CrudComp,
	AnTablist, AnQueryForm, AnTreegrid
} from 'anclient';

const styles = (theme) => ( {
	root: {
		"& :hover": {
			backgroundColor: '#777'
		}
	}
} );

class OrgsComp extends CrudComp {
	state = {
	};

	constructor(props) {
		super(props);

		this.toSearch = this.toSearch.bind(this);
	}

	componentDidMount() {
		let that = this;
	}

	toSearch(e, query) {
	}

	render() {
		let args = {};
		const { classes } = this.props;
		return ( <>
			<AnTreegrid className={classes.root}
				columns={[
					{ text: L('Domain ID'), field:"domainId", color: 'primary', className: 'bold' },
					{ text: L('Domain Name'), color: 'primary', field:"domainName"},
					{ text: L('parent'), color: 'primary',field:"parentId" }
				]}
				rows = {this.state.rows}
			/>
			<Card>
				<Typography variant="h6" gutterBottom>
					This page shows tree data to table binding
				</Typography>
			</Card>
		</>);
	}
}
OrgsComp.contextType = AnContext;

const Orgs = withStyles(styles)(OrgsComp);
export { Orgs, OrgsComp }

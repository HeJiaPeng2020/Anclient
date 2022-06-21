
import React from 'react';
import { Theme, withStyles } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';

import { Tierec } from '@anclient/semantier';

import { L } from '../../utils/langstr';
import { Comprops, CrudCompW } from '../../react/crud'
import { AnContext } from '../../react/reactext'
import { AnTreegrid } from '../../react/widgets/treegrid'

const styles = (_theme: Theme) => ( {
	root: {
		"& :hover": {
			backgroundColor: '#777'
		}
	}
} );

class OrgsComp extends CrudCompW<Comprops> {
	state = {
		rows: [] as Tierec[],
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
			<Card>
				<Typography variant="h6" gutterBottom>
					This page shows tree data to table binding
				</Typography>
			</Card>
			<AnTreegrid uri={this.uri}
				className={classes.root}
				columns={[
					{ text: L('Domain ID'), field:"domainId", color: 'primary', className: 'bold' },
					{ text: L('Domain Name'), color: 'primary', field:"domainName"},
					{ text: L('parent'), color: 'primary',field:"parentId" }
				]}
				rows = {this.state.rows}
			/>
		</>);
	}
}
OrgsComp.contextType = AnContext;

const Orgs = withWidth()(withStyles(styles)(OrgsComp));
export { Orgs, OrgsComp }

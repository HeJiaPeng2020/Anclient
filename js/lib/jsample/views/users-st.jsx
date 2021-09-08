import React from 'react';
import { withStyles } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import PropTypes from "prop-types";
import { TextField, Button, Grid, Card, Typography, Link } from '@material-ui/core';

import { L } from '../../utils/langstr';
	import { Protocol, UserReq } from '../../protocol';
	import { AnConst } from '../../utils/consts';
	import { CrudCompW } from '../../react/crud';
	import { AnContext, AnError } from '../../react/reactext';
	import { ConfirmDialog } from '../../react/widgets/messagebox.jsx'
	import { AnTablistLevelUp } from '../../react/widgets/table-list-lu';
	import { AnQueryForm } from '../../react/widgets/query-form';
	import { AnsonResp } from '../../protocol';
	import { JsampleIcons } from '../styles';

import { UserDetailst } from './user-details-st';

const { CRUD } = Protocol;

const styles = (theme) => ( {
	root: {
		// "& :hover": {
		// 	backgroundColor: '#ecf'
		// }
	},
	button: {
		marginLeft: theme.spacing(1)
	}
} );

class UserstComp extends CrudCompW {
	state = {
		buttons: { add: true, edit: false, del: false},
		pageInf: { page: 0, size: 10, total: 0 },
		selected: {},
	};

	tier = undefined;
	recHook = {collect: undefined};

	constructor(props) {
		super(props);

		this.tier = new UsersTier(this);

		this.closeDetails = this.closeDetails.bind(this);
		this.toSearch = this.toSearch.bind(this);

		this.toAdd = this.toAdd.bind(this);
		this.toEdit = this.toEdit.bind(this);
		this.onTableSelect = this.onTableSelect.bind(this);
	}

	componentDidMount() {
		this.tier.setContext(this.context);
	}

	toSearch(condts) {
		this.tier.records( condts,
			(cols, rows) => {
				this.setState(rows);
			} );
	}

	onTableSelect(rowIds) {
		this.setState( {
			buttons: {
				// is this als CRUD semantics?
				add: this.state.buttons.add,
				edit: rowIds && rowIds.size === 1,
				del: rowIds &&  rowIds.size >= 1,
			},
			selectedRecIds: rowIds
		} );
	}

	toDel(e, v) {
	}

	toAdd(e, v) {
		let that = this;
		this.recForm = (<UserDetailst crud={CRUD.c}
			uri={this.uri}
			tier={this.tier}
			onOk={(r) => that.toSearch(null, this.q)}
			onClose={this.closeDetails} />);
	}

	toEdit(e, v) {
		this.recForm = (<UserDetailst crud={CRUD.u}
			uri={this.uri}
			tier={this.tier}
			recId={this.state.selectedRecIds[0]}
			onOk={(r) => console.log(r)}
			onClose={this.closeDetails} />);
	}

	closeDetails() {
		this.recForm = undefined;
		this.setState({});
	}

	render() {
		const { classes } = this.props;
		let btn = this.state.buttons;
		let tier = this.tier || {};

		return (<div className={classes.root}>
			{this.props.funcName || this.props.title || 'Users of Jsample - semantically tiered'}

			<UsersQuery uri={this.uri} onQuery={this.toSearch} />

			<Grid container alignContent="flex-end" >
				<Button variant="contained" disabled={!btn.add}
					className={classes.button} onClick={this.toAdd}
					startIcon={<JsampleIcons.Add />}
				>{L('Add')}</Button>
				<Button variant="contained" disabled={!btn.del}
					className={classes.button} onClick={this.toDel}
					startIcon={<JsampleIcons.Delete />}
				>{L('Delete')}</Button>
				<Button variant="contained" disabled={!btn.edit}
					className={classes.button} onClick={this.toEdit}
					startIcon={<JsampleIcons.Edit />}
				>{L('Edit')}</Button>
			</Grid>

			<AnTablistLevelUp pk={tier.pk}
				className={classes.root} checkbox={tier.checkbox}
				stateHook={this.recHook}
				selectedIds={this.state.selected}
				columns={tier.columns()}
				rows={tier.rows}
				pageInf={this.pageInf}
				onPageInf={this.onPageInf}
				onSelectChange={this.onTableSelect}
			/>
			{this.recForm}
		</div>);
	}
}
UserstComp.contextType = AnContext;

const Userst = withWidth()(withStyles(styles)(UserstComp));
export { Userst, UserstComp }

class UsersQuery extends React.Component {
	conds = [
		{ name: 'userName', type: 'text', val: '', label: L('Student') },
		{ name: 'orgId',    type: 'cbb',  val: '', label: L('Class'),
		  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'} },
		{ name: 'roleId',   type: 'cbb',  val: '', label: L('Class'),
		  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'} },
	];

	constructor(props) {
		super(props);
		this.collect = this.collect.bind(this);
	}

	collect() {
		return {
			userName: this.conds[0].val ? this.conds[0].val : undefined,
			orgId   : this.conds[1].val ? this.conds[1].val.v : undefined,
			roleId  : this.conds[2].val ? this.conds[2].val.v : undefined };
	}

	/** Design Note:
	 * Problem: This way bound the query form, so no way to expose visual effects modification?
	 */
	render () {
		let that = this;
		return (
		<AnQueryForm {...this.props}
			conds={this.conds}
			query={ (q) => that.props.onQuery(that.collect()) }
			onSearch={this.props.onQuery}
			onDone={() => { that.props.onQuery(that.collect()); } }
		/> );
	}
}
UsersQuery.propTypes = {
	// seems no tier is needed?
	uri: PropTypes.string.isRequired,
	onQuery: PropTypes.func.isRequired
}

class UsersTier {
	port = 'userstier';
	pk = 'userId';
	checkbox = true;
	client = undefined;
	uri = undefined;
	rows = [];

	constructor(comp) {
		this.uri = comp.uri || comp.props.uri;
	}

	setContext(context) {
		this.client = context.anClient;
		this.errCtx = context.error;
	}

	columns() {
		return [
			{ text: L('Log Id'), field: 'userId', checked: true },
			{ text: L('User Name'), field: 'userName' },
			{ text: L('Organization'), field: 'orgName' },
			{ text: L('Role'), field: 'roleName' } ];
	}

	records(conds, onLoad) {
		if (!this.client) return;

		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, 'userstier',
					new UserstReq( this.uri, conds )
					.A(UserstReq.A.records) );

		// let reqBd = req.Body();

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				onLoad(cols, rows);
			},
			this.errCtx);
	}

	record(conds, onLoad) {
		if (!this.client) return;
		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, 'userstier',
					new UserstReq( this.uri, conds )
					.A(UserstReq.A.rec) );

		// let reqBd = req.Body();

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				onLoad(cols, rows);
			},
			this.errCtx);
	}

	saveRec(opts, onOk) {
		if (!this.client) return;
		let client = this.client;
		let that = this;
		let { uri, crud, record, relations } = opts;

		let req = this.client.userReq(uri, 'userstier',
			new UserstReq( uri, { record, relations } )
			.A(crud === Protocol.CRUD.c ? UserstReq.A.insert : UserstReq.A.update) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				onOk(cols, rows);
			},
			this.errCtx);
	}
}

class UserstReq extends UserReq {
	static type = 'io.odysz.jsample.semantier.UserstReq';
	static __init__ = function () {
		// Design Note:
		// can we use dynamic Protocol?
		Protocol.registerBody(UserstReq.type, (jsonBd) => {
			return new UserstReq(jsonBd);
		});
		return undefined;
	}();

	static A = {
		records: 'records',
		rec: 'rec',
		update: 'a-u',
		insert: 'a-c',
	}

	constructor (uri, args) {
		super();
		this.type = UserstReq.type;
		this.uri = uri;
		this.userId = args.userId;
		this.userName = args.userName;
		this.roleId = args.roleId;

		this.record = args.record;
		this.relations = args.relations;
	}
}

class Relations /* extends Anson */ {

	constructor() {
		this.type = "io.odysz.semantic.tier.Relations";
	}

	collectRelations(rtabl, checkTree) {
		if (!rtabl)
			throw Error("Type Relations stands for all relation records of one parent table. Relations already exits.");

		this.rtabl = rtabl;
		// TODO ...
		// TODO ...
		return this;
	}
}

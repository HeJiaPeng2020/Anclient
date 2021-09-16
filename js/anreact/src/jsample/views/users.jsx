import React from 'react';
import { withStyles } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import PropTypes from "prop-types";
import { TextField, Button, Grid, Card, Typography, Link } from '@material-ui/core';

import { Protocol, AnsonResp , UserReq } from '@anclient/semantier';

import { L } from '../../utils/langstr';
	// import { Protocol, AnsonResp , UserReq } from '../../../semantier/protocol';
	import { Semantier } from '@anclient/semantier';
	import { AnConst } from '../../utils/consts';
	import { CrudCompW } from '../../react/crud';
	import { AnContext, AnError } from '../../react/reactext';
	import { ConfirmDialog } from '../../react/widgets/messagebox.jsx'
	import { AnTablistLevelUp } from '../../react/widgets/table-list-lu';
	import { AnQueryst } from '../../react/widgets/query-form-st';
	import { JsampleIcons } from '../styles';

	import { UserDetailst } from './user-details';

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

	constructor(props) {
		super(props);

		this.state.selected.Ids = new Set();

		this.closeDetails = this.closeDetails.bind(this);
		this.toSearch = this.toSearch.bind(this);

		this.toAdd = this.toAdd.bind(this);
		this.toEdit = this.toEdit.bind(this);
		this.onTableSelect = this.onTableSelect.bind(this);
		this.toDel = this.toDel.bind(this);
		this.del = this.del.bind(this);
	}

	componentDidMount() {
		if (!this.tier) {
			this.getTier()
		}
	}

	getTier = () => {
		this.tier = new UsersTier(this);
		this.tier.setContext(this.context);
	}

	/** If condts is null, use the last condts to query.
	 * on succeed: set state.rows.
	 * @param {object} condts the query conditions collected from query form.
	 */
	toSearch(condts) {
		// querst.onLoad (query.componentDidMount) event can even early than componentDidMount.
		if (!this.tier) {
			this.getTier();
		}

		let that = this;
		this.q = condts || this.q;
		this.tier.records( this.q,
			(cols, rows) => {
				that.state.selected.Ids.clear();
				that.setState(rows);
			} );
	}

	onTableSelect(rowIds) {
		// this.state.selected.Ids = rowIds
		this.setState( {
			buttons: {
				// is this als CRUD semantics?
				add: this.state.buttons.add,
				edit: rowIds && rowIds.size === 1,
				del: rowIds &&  rowIds.size >= 1,
			},
		} );
	}

	toDel(e, v) {
		let that = this;
		this.confirm = (
			<ConfirmDialog title={L('Info')}
				ok={L('Ok')} cancel={true} open
				onOk={ that.del }
				onClose={() => {that.confirm = undefined;} }
				msg={L('{cnt} record(s) will be deleted, proceed?', {cnt: this.state.selected.Ids.size})} />);

		// that.state.selected.Ids.clear();
		// this.setState({});
	}

	del() {
		let that = this;
		this.tier.del({
				uri: this.uri,
				ids: this.state.selected.Ids },
			resp => {
				that.confirm = (
					<ConfirmDialog title={L('Info')}
						ok={L('Ok')} cancel={false} open
						onClose={() => {
							that.confirm = undefined;
							that.toSearch();
						} }
						msg={L('Deleting Succeed!')} />);
				// that.state.selected.Ids.clear();
				// that.setState({});
				that.toSearch();
			} );
	}

	toAdd(e, v) {
		let that = this;
		this.tier.pkval = undefined;
		this.tier.rec = {};

		this.recForm = (<UserDetailst crud={CRUD.c}
			uri={this.uri}
			tier={this.tier}
			onOk={(r) => that.toSearch()}
			onClose={this.closeDetails} />);
	}

	toEdit(e, v) {
		let that = this;
		let pkv = [...this.state.selected.Ids][0];
		this.tier.pkval = pkv;
		this.recForm = (<UserDetailst crud={CRUD.u}
			uri={this.uri}
			tier={this.tier}
			recId={pkv}
			onOk={(r) => that.toSearch()}
			onClose={this.closeDetails} />);
	}

	closeDetails() {
		this.recForm = undefined;
		this.setState({});
	}

	render() {
		const { classes } = this.props;
		let btn = this.state.buttons;
		let tier = this.tier;

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

			{tier && <AnTablistLevelUp pk={tier.pk}
				className={classes.root} checkbox={tier.checkbox}
				// stateHook={this.formHook}
				selectedIds={this.state.selected}
				columns={tier.columns()}
				rows={tier.rows}
				pageInf={this.pageInf}
				onPageInf={this.onPageInf}
				onSelectChange={this.onTableSelect}
			/>}
			{this.recForm}
			{this.confirm}
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
		{ name: 'roleId',   type: 'cbb',  val: '', label: L('Role'),
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
		// <AnQuery {...this.props}
		// 	conds={this.conds}
		// 	query={ (q) => that.props.onQuery(that.collect()) }
		// 	onSearch={this.props.onQuery}
		// 	onDone={() => { that.props.onQuery(that.collect()); } }
		// />
		<AnQueryst {...this.props}
			conds={this.conds}
			onSearch={() => this.props.onQuery(that.collect()) }
			onLoaded={() => that.props.onQuery(that.collect()) }
		/> );
	}
}
UsersQuery.propTypes = {
	// no tier is needed?
	uri: PropTypes.string.isRequired,
	onQuery: PropTypes.func.isRequired
}

export class UsersTier extends Semantier {
	mtabl = 'a_users';
	pk = 'userId';
	checkbox = true;
	client = undefined;
	uri = undefined;
	rows = [];
	pkval = undefined;
	rec = {}; // for leveling up record form, also called record

	constructor(comp) {
		super(comp.port || 'userstier');
		this.uri = comp.uri || comp.props.uri;
	}

	columns() {
		return [
			{ text: L('Log Id'), field: 'userId', checked: true },
			{ text: L('User Name'), field: 'userName' },
			{ text: L('Organization'), field: 'orgName',
			  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'} },
			{ text: L('Role'), field: 'roleName',
			  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'} }
			];
	}

	records(conds, onLoad) {
		if (!this.client) return;

		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, conds )
					.A(UserstReq.A.records) );

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

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, conds )
					.A(UserstReq.A.rec) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				// that.rows = rows;
				that.rec = rows && rows[0]; // in level-up, child form editing lost
				onLoad(cols, rows);
			},
			this.errCtx);
	}

	saveRec(opts, onOk) {
		if (!this.client) return;
		let client = this.client;
		let that = this;

		let { uri, crud } = opts;

		if (crud === Protocol.CRUD.u && !this.pkval)
			throw Error("Can't update with null ID.");

		let req = this.client.userReq(uri, this.port,
			new UserstReq( uri, { record: this.rec, relations: this.relations, pk: this.pkval } )
			.A(crud === Protocol.CRUD.c ? UserstReq.A.insert : UserstReq.A.update) );

		client.commit(req,
			(resp) => {
				let bd = resp.Body();
				if (crud === Protocol.CRUD.c)
					// NOTE:
					// resulving auto-k is a typicall semantic processing, don't expose this to caller
					that.pkval = bd.resulve(that.mtabl, that.pk, that.rec);
				onOk(resp);
			},
			this.errCtx);
	}

	/**
	 * @param {Set} ids record id
	 * @param {function} onOk: function(AnsonResp);
	 */
	del(opts, onOk) {
		if (!this.client) return;
		let client = this.client;
		let that = this;
		let { uri, ids } = opts;

		if (ids && ids.size > 0) {
			let req = this.client.userReq(uri, this.port,
				new UserstReq( uri, { deletings: [...ids] } )
				.A(UserstReq.A.del) );

			client.commit(req, onOk, this.errCtx);
		}
	}

	isReadonly(col) {
		return col.field === this.pk && !!this.pkval;
	}
}

export class UserstReq extends UserReq {
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
		update: 'u',
		insert: 'c',
		del: 'd',

		mykids: 'r/kids',
	}

	constructor (uri, args = {}) {
		super();
		this.type = UserstReq.type;
		this.uri = uri;
		this.userId = args.userId;
		this.userName = args.userName;
		this.orgId = args.orgId;
		this.roleId = args.roleId;

		/// case u
		this.pk = args.pk;
		this.record = args.record;
		this.relations = args.relations;

		// case d
		this.deletings = args.deletings;
	}
}

export class Relations /* extends Anson */ {

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
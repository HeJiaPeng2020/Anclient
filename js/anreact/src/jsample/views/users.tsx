import React from 'react';
import withStyles from "@material-ui/core/styles/withStyles";
import withWidth from "@material-ui/core/withWidth";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

import { Protocol, CRUD, AnsonResp , UserReq, QueryConditions, Tierec,
	OnCommitOk, Semantext, AnlistColAttrs, OnLoadOk, TierComboField, DbRelations, PageInf
} from '@anclient/semantier-st';

import { L } from '../../utils/langstr';
import { Semantier } from '@anclient/semantier-st';
import { Comprops, CrudCompW } from '../../react/crud';
import { AnContext } from '../../react/reactext';
import { ConfirmDialog } from '../../react/widgets/messagebox'
import { AnTablist } from '../../react/widgets/table-list';
import { AnQueryst } from '../../react/widgets/query-form-st';
import { JsampleIcons } from '../styles';

import { UserDetailst } from './user-details';
import { CompOpts } from '../../react/anreact';
import { toBool } from '@anclient/anreact/src/utils/helpers';
import { Theme } from '@material-ui/core/styles';

const styles = (theme: Theme) => ( {
	root: {
		backgroundColor: '#eef'
	},
	button: {
		marginLeft: theme.spacing(1)
	}
} );

class UserstComp extends CrudCompW<Comprops> {
	state = {
		buttons: { add: true, edit: false, del: false},
		pageInf: { page: 0, size: 10, total: 0 },
		selected: {ids: new Set<string>()},
	};

	tier = undefined as UsersTier;
	q: QueryConditions;
	confirm: JSX.Element;
	recForm: JSX.Element;
	pageInf: PageInf;
	onPageInf: (page: number) => void;

	constructor(props) {
		super(props);

		this.state.selected.ids = new Set();

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
		this.tier.setContext(this.context as any as Semantext);

		// FIXME for override port for sessionless mode
		// Once the uri & port been moved to semnantier, this section should be removed
		if (this.props.port)
			this.tier.port = this.props.port;
	}

	/** If condts is null, use the last condts to query.
	 * on succeed: set state.rows.
	 * @param condts the query conditions collected from query form.
	 */
	toSearch(condts: QueryConditions): void {
		// querst.onLoad (query.componentDidMount) event can even early than componentDidMount.
		if (!this.tier) {
			this.getTier();
		}

		let that = this;
		this.q = condts || this.q;
		this.tier.records( this.q,
			(cols, rows) => {
				that.state.selected.ids.clear();
				that.setState(rows);
			} );
	}

	onTableSelect(rowIds: Array<string>) {
		this.setState( {
			buttons: {
				// is this als CRUD semantics?
				add: this.state.buttons.add,
				edit: rowIds && rowIds.length === 1,
				del: rowIds &&  rowIds.length >= 1,
			},
		} );
	}

	toDel(e: React.MouseEvent<Element, MouseEvent>) {
		let that = this;
		this.confirm = (
			<ConfirmDialog title={L('Info')}
				ok={L('OK')} cancel={true} open
				onOk={ that.del }
				onClose={() => {that.confirm = undefined;} }
				msg={L('{cnt} record(s) will be deleted, proceed?', {cnt: this.state.selected.ids.size})} />);
	}

	del() {
		let that = this;
		this.tier.del({
				uri: this.uri,
				ids: this.state.selected.ids },
			resp => {
				that.confirm = (
					<ConfirmDialog title={L('Info')}
						ok={L('OK')} cancel={false} open
						onClose={() => {
							that.confirm = undefined;
							that.toSearch(undefined);
						} }
						msg={L('Deleting Succeed!')} />);
				that.toSearch(undefined);
			} );
	}

	toAdd(e: React.MouseEvent<Element, MouseEvent>) {
		if (e) e.stopPropagation();

		let that = this;
		this.tier.pkval.v = undefined;
		this.tier.rec = {};

		this.recForm = (<UserDetailst crud={CRUD.c}
			uri={this.uri}
			tier={this.tier}
			onOk={(r) => that.toSearch(undefined)}
			onClose={this.closeDetails} />);

		// NOTE:
		// As e's propagation is stopped, parent page won't trigger updating,
		// needing manually trigger re-rendering.
		this.setState({});
	}

	toEdit(e: React.MouseEvent<Element, MouseEvent>) {
		let that = this;
		let pkv = this.getByIx(this.state.selected.ids);
		this.tier.pkval.v = pkv;
		this.recForm = (<UserDetailst crud={CRUD.u}
			uri={this.uri}
			tier={this.tier}
			recId={pkv}
			onOk={(r) => that.toSearch(undefined)}
			onClose={this.closeDetails} />);
	}

	closeDetails() {
		this.recForm = undefined;
		this.tier.resetFormSession();
		this.toSearch(undefined);
		this.onTableSelect([]);
	}

	render() {
		const { classes } = this.props;
		let btn = this.state.buttons;
		let tier = this.tier;

		return (<div className={classes.root}>
			{this.props.funcName || this.props.title || 'Users of Jsample'}

			<UsersQuery uri={this.uri} onQuery={this.toSearch} />

			{this.tier && this.tier.client.ssInf && this.tier.client.ssInf.ssid && // also works in session less mode
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
				</Grid>}

			{tier && <AnTablist pk={tier.pkval.pk}
				className={classes.root} checkbox={tier.checkbox}
				selected={this.state.selected}
				columns={tier.columns()}
				rows={tier.rows}
				pageInf={this.pageInf}
				onPageChange={this.onPageInf}
				onSelectChange={this.onTableSelect}
			/>}
			{this.recForm}
			{this.confirm}
		</div>);
	}
}
UserstComp.contextType = AnContext;

const Userst = withStyles<any, any, Comprops>(styles)(withWidth()(UserstComp));
export { Userst, UserstComp }

class UsersQuery extends CrudCompW<Comprops & {onQuery: (conds: QueryConditions) => void}> {
	conds = [
		{ name: 'userName', field: 'userName', type: 'text', val: undefined, label: L('Student') },
		{ name: 'orgId',    field: 'orgId', type: 'cbb',  val: undefined, label: L('Class'),
		  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'} },
		{ name: 'roleId',   field: 'roleId', type: 'cbb',  val: undefined, label: L('Role'),
		  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'} },
	];

	constructor(props: Comprops) {
		super(props);
		this.collect = this.collect.bind(this);
	}

	collect() {
		return {
			userName: this.conds[0].val ? this.conds[0].val : undefined,
			orgId   : (this.conds[1].val as {n: string, v: string}) ?.v,
			roleId  : (this.conds[2].val as {n: string, v: string}) ?.v };
	}

	/** Design Note:
	 * Problem: This way bound the query form, so no way to expose visual effects modification?
	 */
	render () {
		let that = this;
		return (
		<AnQueryst {...this.props}
			fields={this.conds}
			onSearch={() => that.props.onQuery(that.collect()) }
			onLoaded={() => that.props.onQuery(that.collect()) }
		/> );
	}
}

export class UsersTier extends Semantier {
	port = 'userstier';
	// mtabl = 'a_users';
	// pk = 'userId';
	checkbox = true;
	// rows = [];
	// pkval = undefined;
	// rec = undefined as Tierec; // {pswd: undefined as string, iv: undefined as string};


	// TODO doc: samantier where disable pk field if pkval exists
	_fields = [
		{ type: 'text', field: 'userId', label: L('Log ID'),
		  validator: {len: 12, notNull: true} },
		{ type: 'text', field: 'userName', label: L('User Name') },
		{ type: 'password', field: 'pswd', label: L('Password'),
		  validator: {notNull: true} },
		{ type: 'cbb', field: 'roleId', label: L('Role'),
		  grid: {md: 5}, // defaultStyle: {marginTop: "8px", width: 220 },
		  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'},
		  validator: {notNull: true} } as TierComboField<JSX.Element, CompOpts>,
		{ type: 'cbb', field: 'orgId', label: L('Organization'),
		  grid: {md: 5}, // defaultStyle: {marginTop: "8px", width: 220 },
		  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'},
		  validator: {notNull: true} } as TierComboField<JSX.Element, CompOpts>,
	] as AnlistColAttrs<JSX.Element, CompOpts>[];

	_cols = [
		{ label: L('check'), field: 'userId', checkbox: true },
		{ label: L('Log Id'), field: 'userId' },
		{ label: L('User Name'), field: 'userName' },

		{ label: L('Organization'), field: 'orgName',
		  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'} },
		{ label: L('Role'), field: 'roleName',
		  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'} }
	] as Array<AnlistColAttrs<JSX.Element, CompOpts>>;

	constructor(comp) {
		super(comp);

		// this.port = 'userstier';
		this.mtabl = 'a_users';
		this.pkval.pk = 'userId';
		this.checkbox = true;
		this.rows = [];
		// pkval = undefined;
		// rec = undefined as Tierec; // {pswd: undefined as string, iv: undefined as string};
	}

	columns() {
		return this._cols;
	}

	records(conds: QueryConditions, onLoad: OnLoadOk) {
		if (!this.client) return;

		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, conds as UserstReqArgs )
					.A(UserstReq.A.records) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				onLoad(cols, rows);
			},
			this.errCtx);
	}

	record(conds: QueryConditions, onLoad: OnLoadOk) {
		if (!this.client) return;
		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, conds as UserstReqArgs )
					.A(UserstReq.A.rec) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				// that.rows = rows;
				that.rec = rows && rows[0];
				onLoad(cols, rows);
			},
			this.errCtx);
	}

	saveRec(opts: { uri: string; crud: CRUD; pkval: string; }, onOk: OnCommitOk) {
		if (!this.client) return;
		let client = this.client;
		let that = this;

		let { uri, crud } = opts;

		if (crud === CRUD.u && !this.pkval)
			throw Error("Can't update with null ID.");

		let {cipher, iv} = this.client.encryptoken(this.rec.pswd as string);
		this.rec.pswd = cipher;
		this.rec.iv = iv;

		let req = this.client.userReq(uri, this.port,
			new UserstReq( uri, { record: this.rec, relations: this.collectRelations(), pk: this.pkval.v } )
			.A(crud === CRUD.c ? UserstReq.A.insert : UserstReq.A.update) );

		client.commit(req,
			(resp) => {
				let bd = resp.Body();
				if (crud === CRUD.c)
					// NOTE:
					// resulving auto-k is a typicall semantic processing, don't expose this to caller
					that.pkval.v = bd.resulve(that.mtabl, that.pkval.pk, that.rec);
				onOk(resp);
			},
			this.errCtx);
	}

	collectRelations(): DbRelations {
		return {}; // user doesn't implys a relationship?
	}

	/**
	 * @param opts
	 * @param opts.uri overriding local uri
	 * @param opts.ids record id
	 * @param onOk function(AnsonResp);
	 */
	del(opts: {uri?: string, [p: string]: string | Set<string> | object}, onOk: OnCommitOk) : void {
		if (!this.client) return;
		let client = this.client;
		let that = this;
		let { uri } = opts;
		let ids = opts.ids as Set<string> ;

		if (ids && ids.size > 0) {
			let req = this.client.userReq(uri, this.port,
				new UserstReq( uri, { deletings: [...Array.from(ids)] } )
				.A(UserstReq.A.del) );

			client.commit(req, onOk, this.errCtx);
		}
	}
}

type UserstReqArgs = {
	record?: Tierec;
	pk?: string; relations?: DbRelations;
	deletings?: string[];
	userId?: string; userName?: string;
	orgId?: string; roleId?: string;
	hasTodos?: string;
};

export class UserstReq extends UserReq {
	static __type__ = 'io.odysz.jsample.semantier.UserstReq';
	static __init__ = function (uri) {
		// Design Note:
		// can we use dynamic Protocol?
		Protocol.registerBody(UserstReq.__type__, (jsonBd) => {
			return new UserstReq(uri, jsonBd);
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
	userId: string;
	userName: string;
	orgId: string;
	roleId: string;
	hasTodos: boolean;
	pk: string;
	record: Tierec;
	relations: DbRelations;
	deletings: string[];

	constructor (uri: string, args: UserstReqArgs = {}) {
		super(uri, "a_users");
		this.type = UserstReq.__type__;
		this.uri = uri;
		this.userId = args.userId;
		this.userName = args.userName;
		this.orgId = args.orgId;
		this.roleId = args.roleId;
		this.hasTodos = toBool(args.hasTodos);

		/// case u
		this.pk = args.pk;
		this.record = args.record;
		this.relations = args.relations;

		// case d
		this.deletings = args.deletings;
	}
}
import React from 'react';
import withStyles from "@material-ui/core/styles/withStyles";
import withWidth from "@material-ui/core/withWidth";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';

import { toBool, Protocol, CRUD, AnsonResp , UserReq, Tierec,
	OnCommitOk, AnlistColAttrs, OnLoadOk, TierComboField, DbRelations, PageInf
} from '@anclient/semantier';

import { L } from '../../utils/langstr';
import { Semantier } from '@anclient/semantier';
import { Comprops, CrudCompW } from '../../react/crud';
import { AnContext, AnContextType } from '../../react/reactext';
import { ConfirmDialog } from '../../react/widgets/messagebox'
import { AnTablPager } from '../../react/widgets/table-pager';
import { AnQueryst, ComboCondType } from '../../react/widgets/query-form';
import { JsampleIcons } from '../styles';

import { UserDetailst } from './user-details';
import { CompOpts } from '../../react/anreact';
import { Theme } from '@material-ui/core/styles';

const styles = (theme: Theme) => ( {
	root: {
		backgroundColor: '#eef'
	},
	warn: {
		backgroundColor: '#522',
		color: 'red'
	},
	button: {
		marginLeft: theme.spacing(1)
	}
} );


// GIT: task: AnTablist Paginator

class UserstComp extends CrudCompW<Comprops> {
	state = {
		buttons: { add: true, edit: false, del: false},
		pageInf: { page: 0, size: 10, total: 0 },
		selected: {ids: new Set<string>()},
	};

	tier = undefined as UsersTier;
	q: PageInf;
	confirm: JSX.Element;
	recForm: JSX.Element;

	constructor(props: Comprops) {
		super(props);

		this.state.selected.ids = new Set();
		this.q = new PageInf(0, 10);

		this.closeDetails = this.closeDetails.bind(this);
		this.toSearch = this.toSearch.bind(this);

		this.toAdd = this.toAdd.bind(this);
		this.toEdit = this.toEdit.bind(this);
		this.onTableSelect = this.onTableSelect.bind(this);
		this.toDel = this.toDel.bind(this);
		this.del = this.del.bind(this);
		this.onPageInf = this.onPageInf.bind(this);
	}

	componentDidMount() {
		console.log(this.uri);
		this.tier = new UsersTier(this);
		this.tier.setContext(this.context as AnContextType);
	}

	/** If condts is null, use the last condts to query.
	 * on succeed: set state.rows.
	 * @param _condts the query conditions collected from query form.
	 */
	toSearch(_condts: PageInf): void {
		if (!this.tier) {
			console.warn("really happens?")
			return;
		}

		let that = this;

		this.tier.records( this.q,
			(_cols, _rows) => {
				that.state.selected.ids.clear();
				that.setState( {buttons: {add: true, edit: false, del: false}} );
			} );
	}

	onPageInf(page: number, size? : number) : void {
		this.q.page = page || 0;
		this.q.size = size;
		this.toSearch(this.q);
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

	toDel(_e: React.MouseEvent<Element, MouseEvent>) {
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
							that.toSearch(that.q);
						} }
						msg={L(resp.Body(0).msg() || 'Deleting Succeed!')} />);
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
			onOk={() => that.toSearch(undefined)}
			onClose={this.closeDetails} />);

		// NOTE:
		// As e's propagation is stopped, parent page won't trigger updating,
		// needing manually trigger re-rendering.
		this.setState({});
	}

	toEdit(_e: React.MouseEvent<Element, MouseEvent>) {
		let that = this;
		let pkv = this.getByIx(this.state.selected.ids);
		this.tier.pkval.v = pkv;
		this.recForm = (<UserDetailst crud={CRUD.u}
			uri={this.uri}
			tier={this.tier}
			recId={pkv}
			onOk={() => that.toSearch(undefined)}
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
			<Card className={classes.funcard}>
				<Typography variant="h6" gutterBottom>{}
					{this.props.funcName || this.props.title || L('Users of Jsample')}
				</Typography>
			</Card>
			<UsersQuery uri={this.uri} pageInf={this.q} onQuery={this.toSearch} />

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

			{tier && <AnTablPager pk={tier.pkval.pk}
				className={classes.root}
				checkbox={tier.checkbox}
				selected={this.state.selected}
				columns={tier.columns()}
				rows={tier.rows}
				sizeOptions={[5, 8, 10]}
				pageInf={this.q}
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

class UsersQuery extends CrudCompW<Comprops & {pageInf: PageInf, onQuery: (conds: PageInf) => void}> {
	conds = [
		{ name: 'userName', field: 'userName', type: 'text', val: undefined, label: L('Student'),
		  grid: {sm: 3, md: 2} } as AnlistColAttrs<any, any>,
		{ name: 'orgId',    field: 'orgId', type: 'cbb',  val: undefined, label: L('Class'),
		  sk: Protocol.sk.cbbOrg, nv: {n: 'text', v: 'value'}, grid: {sm: 3, md: 2} } as ComboCondType,
		// { name: 'roleId',   field: 'roleId', type: 'cbb',  val: undefined, label: L('Role'),
		//   sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'}, grid: {md: 2, sm: 3} },
	];

	constructor(props: Comprops & {pageInf: PageInf, onQuery: (conds: PageInf) => void}) {
		super(props);
		this.collect = this.collect.bind(this);
	}

	collect(pageInf: PageInf) : PageInf {
		// return new PageInf()
		return pageInf
				.nv("userName", this.conds[0].val ? this.conds[0].val : undefined)
				.nv("orgId", (this.conds[1].val as {n: string, v: string})?.v);
	}

	/**
	 * Design Note:
	 *
	 * Problem: This way bound the query form, so no way to expose visual effects modification?
	 */
	render () {
		let that = this;
		return (
		<AnQueryst {...this.props} uri={this.uri}
			fields={this.conds}
			onSearch={() => that.props.onQuery(that.collect(that.props.pageInf)) }
			onLoaded={() => that.props.onQuery(that.collect(that.props.pageInf)) }
		/> );
	}
}

export class UsersTier extends Semantier {
	port = 'userstier';
	checkbox = true;

	_fields = [
		{ type: 'text', field: 'userId', label: L('Log ID'),
		  validator: {len: 20, notNull: true} },
		{ type: 'text', field: 'userName', label: L('User Name') },
		{ type: 'password', field: 'pswd', label: L('Password'),
		  validator: {notNull: true} },
		{ type: 'cbb', field: 'roleId', label: L('Role'),
		  grid: {md: 5},
		  sk: Protocol.sk.cbbRole, nv: {n: 'text', v: 'value'},
		  validator: {notNull: true} } as TierComboField<JSX.Element, CompOpts>,
		{ type: 'cbb', field: 'orgId', label: L('Organization'),
		  grid: {md: 5},
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

	constructor(comp: Comprops) {
		super(comp);

		this.pkval.tabl = 'a_users';
		this.pkval.pk = 'userId';
		this.checkbox = true;
		this.rows = [];
	}

	records(conds: PageInf, onLoad: OnLoadOk<Tierec>) {
		if (!this.client) return;

		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, {}, conds )/*10、修改前：new UserstReq( this.uri, conds )*/
					.A(UserstReq.A.records) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				conds.total = resp.Body()?.Rs()?.total || 0;
				onLoad(cols, rows as Tierec[]);
			},
			this.errCtx);
	}

	record(rec: Tierec, onLoad: OnLoadOk<Tierec>) {
		if (!this.client) return;
		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new UserstReq( this.uri, rec, {} as unknown as PageInf )/*9、修改前：new UserstReq( this.uri, conds )*/
					.A(UserstReq.A.rec) );

		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				// that.rows = rows;
				that.rec = rows && rows[0];
				onLoad(cols, rows as Tierec[]);
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

		/**
		 *  This is intial password
		let {cipher, iv} = this.client.encryptoken(this.rec.pswd as string);
		this.rec.pswd = cipher;
		this.rec.iv = iv;
		*/

		// this.rec.iv = undefined; // won't work - didn't sent by Chrome
		this.rec.iv = null; // working - but why?

		let req = this.client.userReq(uri, this.port,
			new UserstReq( uri, { record: this.rec, relations: this.collectRelations(), pk: this.pkval.v }, {} as unknown as PageInf )/*8、修改前：new UserstReq( uri, { record: this.rec, relations: this.collectRelations(), pk: this.pkval.v } )*/
			.A(crud === CRUD.c ? UserstReq.A.insert : UserstReq.A.update) );

		client.commit(req,
			(resp) => {
				let bd = resp.Body();
				if (crud === CRUD.c)
					// NOTE:
					// resulving auto-k is a typicall semantic processing, don't expose this to caller
					that.pkval.v = bd.resulve(that.pkval.tabl, that.pkval.pk, that.rec);
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
				new UserstReq( uri, { deletings: [...Array.from(ids)] }, {} as unknown as PageInf )/*7、修改前：new UserstReq( uri, { deletings: [...Array.from(ids)] } )*/
				.A(UserstReq.A.del) );

			client.commit(req, onOk, this.errCtx);
		}
	}
}

export class UserstReq extends UserReq {
	static __type__ = 'io.oz.jsample.semantier.UserstReq';
	static __init__ = function (uri) {
		// Design Note:
		// can we use dynamic Protocol?
		Protocol.registerBody(UserstReq.__type__, (jsonBd) => {
			return new UserstReq(uri, jsonBd, null);
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

	pk: any;
	userId: string;
	userName: string;
	orgId: string;
	roleId: string;
	hasTodos: boolean;
	record: Tierec;
	relations: DbRelations;
	deletings: string[];
	page: PageInf;

	// constructor (uri: string, args = {} as Tierec & { record? : {userId?: string}}) {
	constructor (uri: string, query: Tierec, pageInf: PageInf) {/*1、修改前：constructor (uri: string, query: PageInf | any)*/
		super(uri, "a_users");
		this.type = UserstReq.__type__;
		this.uri = uri;

		/// FIXME: obviousely this is should be refactored to the chained calls API

		/// case r
		if (pageInf.page === undefined && typeof pageInf.condtsRec === 'function')/*2、修改前：(query.page === undefined && typeof query.condtsRec === 'function')*/
			throw Error("Scince anreact 0.4.17, UserstReq no longer user Tierec as query condition.");

		if (pageInf.condtsRec) {/*3、修改前：query.condtsRec*/
			let args = pageInf.condtsRec() as Tierec & { record? : {userId?: string} };/*4、修改前：query.condtsRec()*/
			this.userId = (args.userId || args.record?.userId) as string;
			this.userName = args.userName as string;
			this.orgId = args.orgId as string;
			this.roleId = args.roleId as string;
			this.hasTodos = toBool(args.hasTodos as string | boolean);

			this.page = new PageInf(pageInf.page, pageInf.size);
		}
		/// case A = rec (TRecordForm loading)
		else if (query.userId) {
			this.record = query as Tierec;
			this.userId = query.userId as string;
			this.page = new PageInf(0, -1);
		}
		/// case A = u
		else if (query.pk) {
			this.pk = query.pk;
			this.record = query.record as Tierec;
			this.relations = query.relations as DbRelations;
		}

		/// case d
		else if (query.deletings) {/*5、修改前：this.deletings = query.deletings as string[];*/
			this.deletings = query.deletings as string[];
		}
	
		/// case ins /*6、新增语句*/
		else {
			this.record = query.record as Tierec;
			this.relations = query.relations as DbRelations;	
		}
	}
}

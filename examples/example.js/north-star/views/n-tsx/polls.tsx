
import React from 'react';
import { withStyles } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import { Grid, Button, Theme, Typography } from '@material-ui/core';

import { Semantier2, AnsonBody, AnsonResp } from "@anclient/semantier";
import {
	L, AnConst,
    AnContext, CrudCompW,
	ConfirmDialog, AnQueryForm, AnTablist, jsample
} from '@anclient/anreact';

import { PollsProp } from '../../common/north';

const { JsampleIcons } = jsample;

const styles = (theme: Theme) => (Object.assign(
	Semantier2.invalidStyles as any, {
	crudButton: {
		margin: theme.spacing(1),
	},
	funcName: {
		fontSize: "1.4em",
	}
} ));

interface QueryCondt {
	pollIds?: Array<string>;
	states?: string;
}

class PollsComp extends CrudCompW {
    // uri: string;

	state = {
		students: [],
		condQzName: { type: 'text', val: '', label: L('Quiz Name') },
		condTag:  { type: 'text', val: '', label: L('Quiz Tag') },
		condUser: { type: 'cbb',
					sk: 'users.org-arg', nv: {n: 'text', v: 'value'},
					sqlArgs: [],
					val: AnConst.cbbAllItem,
					options: [ AnConst.cbbAllItem ],
					label: L('My Students') },

        queryReq: undefined as typeof AnsonBody,
		pageInf: { page: 0, size: 25, total: 0 },
		buttons: { start: true, stop: false, edit: false},
		selected: {ids: new Set<string>()},
	};

    context: typeof AnContext;
    tier: PollsTier;

    confirm: JSX.Element;
    detailsForm: JSX.Element;
	q: QueryCondt = {};

	constructor(props: PollsProp) {
		// this.uri = props.match && props.match.path || props.uri;
		super(props);

		this.closeDetails = this.closeDetails.bind(this);
		this.toSearch = this.toSearch.bind(this);
		this.onPageInf = this.onPageInf.bind(this);
		this.onTableSelect = this.onTableSelect.bind(this);

		this.toShowDetails = this.toShowDetails.bind(this);

		this.toStop = this.toStop.bind(this);
	}

	componentDidMount() {
		console.log(this.uri);
		// this.jquiz = new JQuiz(this.context.anClient, this.context.error);
		this.tier = new PollsTier(this);
		this.tier.setContext(this.context);
		this.toSearch();
	}

	/*
	toSearch(e, query) {
		let pageInf = this.state.pageInf;
		let queryReq = this.context.anClient.query(this.uri, 'polls', 'p', pageInf)
		let req = queryReq.Body()
			.expr('max(pid)', 'pid')
			.expr('qz.qid', 'qid').expr('title')
			.expr('count(userId)', 'users')
			.expr('state').expr('subject', 'subject')
			.j('quizzes', 'qz', 'qz.qid=p.quizId')
			.groupby('qz.qid').groupby('p.state')
			.orderby('qz.qid', 'desc');

		if (query && query.tag)
			req.whereCond('%s', 'q.tags', `'${query.tag}'`);
		if (query && query.qzName)
			req.whereCond('%', 'quizName', `'${query.qzName}'`);
		if (query && query.userId)
			req.whereEq('userId', query.userId);

		this.state.queryReq = queryReq;

		this.context.anReact.bindTablist(queryReq, this, this.context.error);

		this.state.selected.ids.clear();
	}
	*/

	toSearch(condts?: QueryCondt) {
		if (this.tier) {
			let that = this;
			this.q = condts || this.q;
			this.tier.records( this.q,
				(cols, rows) => {
					that.state.selected.ids.clear();
					that.setState(rows);
				}, undefined );
		}
	}

	onPageInf(page: number, size: number) {
		this.state.pageInf.size = size;
		this.state.pageInf.page = page;
		// let query = this.state.queryReq;
		// if (query) {
		// 	query.Body().Page(size, page);
		// 	this.state.pageInf = {page, size, total: this.state.pageInf.total};
		// 	this.context.anReact.bindTablist(query, this, this.context.error);
		// }
	}

	onTableSelect(rowIds) {
		this.setState( {
			buttons: {
				start: this.state.buttons.start,
				stop: rowIds &&  rowIds.length >= 1,
				edit: rowIds && rowIds.length === 1,
			},
		} );
	}

    toShowDetails(e: React.UIEvent): void {
        this.detailsForm = (
            <PollDetailsForm
            />);
    }
    
	toStop(e: React.UIEvent) {
		let that = this;
		this.tier.pollsUsers(this.uri,
			{pollIds: this.state.selected.ids},
			( (users) => {
				console.log(users);
				let txt = L('Totally {count} polls, {users} users will be updated. Are you sure?',
							{ count: that.state.selected.ids.size,
							  users: users.Body().msg() });
				that.confirm =
					(<ConfirmDialog open={true}
						ok={L('OK')} cancel={true}
						title={L('Info')} msg={txt}
						onOk={ () => {
								that.tier.stopolls(this.uri, Array.from(that.state.selected.ids),
									( rsp => { that.confirm = undefined; } )); // make sure it's an array
						 	}
						}
						onClose={ () => {that.confirm === undefined} }
					/>);
				that.setState( {} );
			}) );
	}

	closeDetails() {
		this.detailsForm = undefined;
		this.setState({});
	}

	render() {
		const { classes } = this.props;
		let btn = this.state.buttons;
		this.state.condUser.sqlArgs = [this.context.anClient.userInfo.uid];
		return ( <>
			<Typography className={classes.funcName} >{L('Polls Trending - TSX')}</Typography>
			<AnQueryForm uri={this.uri}
				onSearch={this.toSearch}
				conds={[ this.state.condQzName, this.state.condTag, this.state.condUser ]}
				query={ (q: typeof AnQueryForm) => { return {
					qzName:q.state.conds[0].val ? q.state.conds[0].val : undefined,
					tag:   q.state.conds[1].val ? q.state.conds[1].val : undefined,
					orgId: q.state.conds[2].val ? q.state.conds[2].val.v : undefined,
				} } }
				onDone={(query) => { this.toSearch(query); } }
			/>
			<Grid container alignContent="flex-end" >
				<Button variant="contained" disabled={!btn.stop}
					className={classes.crudButton} onClick={this.toStop}
					startIcon={<JsampleIcons.DetailPanel />}
				>{L('Stop Poll')}</Button>
				<Button variant="contained" disabled={!btn.start}
					className={classes.crudButton} onClick={this.toShowDetails}
					startIcon={<JsampleIcons.Add />}
				>{L('Details')}</Button>
				{/*
				<Button variant="contained" disabled={!btn.edit}
					className={classes.crudButton} onClick={this.toEdit}
					startIcon={<JsampleIcons.Delete />}
				>{L('Setup Users')}</Button>*/}
			</Grid>

			{this.tier && <AnTablist
				className={classes.list} checkbox={true} pk={this.tier.pk}
				columns={this.tier.columns()}
				rows={this.tier.rows}
				pageInf={this.state.pageInf}
				onPageInf={this.onPageInf}
				selectedIds={this.state.selected}
				onSelectChange={this.onTableSelect}
			/>}
			{this.detailsForm}
			{this.confirm}
		</>);
	}
}
PollsComp.contextType = AnContext;

const Polls = withWidth()(withStyles(styles)(PollsComp));

class PollDetailsForm extends React.Component<any, any, any> {

}

class PollsTier extends Semantier2 {
    _cols = [
        { text: L('quiz event'),field: "pid",    hide:true },
        { text: L('Quiz Name'), field: "title",  color: 'primary', className: 'bold'},
        { text: L('Users' ),    field: "users",  color: 'primary' },
        { text: L('Status'),    field: "state",  color: 'primary' },
        { text: L('Subject'),   field: "subject",color: 'primary' }
	];

	pk = 'pid';

    constructor(comp: PollsComp) {
        super(comp);
    }

	/**[Promiting Style]
	 * Get all poll users for pollIds, with state in states.
	 * port: quiz
     * 
     * @param opts 
     * @param onLoad 
     * @param errCtx 
     * @returns 
     */
    records(opts: QueryCondt,
            onLoad: (cols: Array<{}>, rows: Array<{}>) => void,
            errCtx: typeof AnContext.error) {
		let {pollIds, states} = opts;
		let opt = {};
		opt[NPollsReq.pollIds] = pollIds;
		opt[NPollsReq.states] = states;
		// return this.serv(this.uri, NPollsReq.A.pollsUsers, opt, onLoad, errCtx);
		if (!this.client) return;

		let client = this.client;
		let that = this;

		let req = client.userReq(this.uri, this.port,
					new NPollsReq( this.uri, opt )
					.A(NPollsReq.A.list) );

		console.log(req);
		client.commit(req,
			(resp) => {
				let {cols, rows} = AnsonResp.rs2arr(resp.Body().Rs());
				that.rows = rows;
				that.resetFormSession();
				onLoad(cols, rows);
			},
			this.errCtx);
	}

}

/**The poll request message body */
class NPollsReq extends AnsonBody {
    /**
     * https://stackoverflow.com/questions/32494174/can-you-create-nested-classes-in-typescript
     */
 	static A = class {
		static start = 'start';
		static list = 'list';     // load quizzes
		static stopolls = 'stopolls'; // stop all polls
		static pollsUsers = 'polls-users'; // get all users of polls (pollIds, quizId, states)
	}

    static pollIds = "pids";
    static states = "states";

	constructor(uri: string, condts: any) {
		super({});
	}
}

export { Polls, PollsComp, NPollsReq, PollsTier }
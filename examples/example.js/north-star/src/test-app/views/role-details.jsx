import React from 'react';
import { withStyles } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";
import PropTypes from "prop-types";

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import Typography from '@material-ui/core/Typography';


import { L, Protocol, AnsonResp,
	AnConst, AnContext, AnError, DetailFormW,
	AnTablist, AnQueryForm, ConfirmDialog, AnTree, stree_t
} from 'anclient';

import { StarIcons } from '../../styles';

const styles = theme => ({
  dialogPaper: {
	minHeight: "80vh"
  },
  root: {},
  title: {
	backgroundColor: "linen",
	height: "5ch",
	width: "100%",
	color: "primary"
  },
  centre: { alignItems: "center" },
  lower: { height: "15%" },

  left: { alignItems: "center" },
  right: { alignItems: "center" },
  largeText: { width: "100%" },
  rowBox: {
	display: "flex",
	flexDirection: "row",
	alignItems: "center"
  },

  formLabel: {
	width: "12ch",
	textAlign: "right",
    paddingRight: theme.spacing(1),
  },
  formText: {
	textAlign: "right",
    paddingLeft: theme.spacing(1),
  },
  content: {
	height: "100%",
  },
  buttons: {
	justifyContent: "center",
	verticalAlign: "middle",
	"& > button": {
	  width: "20ch"
	}
  },
});

class RoleDetailsComp extends DetailFormW {
	state = {
		crud: Protocol.CRUD.r,
		dirty: false,
		closed: false,

		fields: [
			{type: 'text', validator: {len: 12}, field: 'roleId', label: 'Role Name'},
			{type: 'text', validator: {len: 200}, field: 'roleName', label: 'Role Name'},
			{type: 'text', validator: {len: 500}, field: 'remarks', label: 'Remarks'}
		],
		pk: undefined,
		record: {},
	};

	constructor (props = {}) {
		super(props);

		this.state.crud = props.c ? Protocol.CRUD.c
					: props.u ? Protocol.CRUD.u
					: Protocol.CRUD.r;
		this.state.pk = props.roleId;

		this.validate = this.validate.bind(this);
		this.toSave = this.toSave.bind(this);
		this.toCancel = this.toCancel.bind(this);
		this.showOk = this.showOk.bind(this);
	}

	componentDidMount() {
		let that = this;
		let sk = 'trees.role_funcs';
		let t = stree_t.sqltree; // loading dataset reshaped to tree

		if (this.state.crud !== Protocol.CRUD.c) {
			// load
			let queryReq = this.context.anClient.query(null, 'a_roles', 'r')
			queryReq.Body().whereEq('roleId', this.state.pk);
			this.context.anReact.bindSimpleForm({req: queryReq,
				onOk: (resp) => {
						let {rows, cols} = AnsonResp.rs2arr(resp.Body().Rs());
						that.state.record = rows[0];

						let ds = {sk, t, sqlArgs: [this.state.pk]};

						that.context.anReact.stree(ds, that.context.error, that);
					}
				},
				this.context.error);
		}
		else {
			// new, bind tree
			let ds = {sk, t, sqlArgs: []};

			this.context.anReact.stree(ds, this.context.error, this);
		}
	}

	validate() {
		let that = this;

	    const invalid = { border: "2px solid red" };

		let valid = true;
	    this.state.fields.forEach( (f, x) => {
			// let field = f.field;
			f.valid = validField(f, {validator: (v) => !!v});
			f.style = f.valid ? undefined : invalid;
			valid &= f.valid;
	    } );
		return valid;

		function validField (f, valider) {
			let v = that.state.record[f.field];

			if (typeof valider === 'function')
				return valider(v);
			else if (f.validator) {
				let vd = f.validator;
				if(vd.notNull && (v === undefined || v.length === 0))
					return false;
				if (vd.len && v !== undefined && v.length > vd.len)
					return false;
				return true;
			}
		}
	}

	toSave(e) {
		e.stopPropagation();

		if (!this.validate()) {
	    	this.setState({});
			return;
		}

		let client = this.context.anClient;
		let rec = this.state.record;
		let c = this.state.crud === Protocol.CRUD.c;

		let req;

		// 1. collect role-func
		// note 'nodeId' is not the same with DB as some fields are mapped in datase.xml
		let columnMap = {
			funcId: 'nodeId',
			// roleId doesn't included in forest, the value been just appended
			roleId: c ? rec.roleId : this.state.pk,
		};

		let rf = this.context.anReact.inserTreeChecked(
					this.state.forest,
					{ table: 'a_role_func',
					  columnMap,
					  check: 'checked',
					  reshape: true  // middle nodes been corrected according to children
					} );

		// 2. collect record
		// nvs data must keep consists with jquery serializeArray()
		// https://api.jquery.com/serializearray/
		let nvs = [];
		nvs.push({name: 'remarks', value: rec.remarks});
		nvs.push({name: 'roleName', value: rec.roleName});

		nvs.push({name: 'orgId', value: '006'}) // TODO: got orgId from cbb?

		// 3. request (with del if updating)
		if (this.state.crud === Protocol.CRUD.c) {
			nvs.push({name: 'roleId', value: rec.roleId});
			req = client
				.usrAct('roles', Protocol.CRUD.c, 'save')
				.insert(null, 'a_roles', nvs);
			req.Body().post(rf);
		}
		else {
			let del_rf = new DeleteReq(null, 'a_role_func', 'roleId')
							.whereEq('roleId', rec['roleId']);

			req = client
				.usrAct('roles', Protocol.CRUD.u, 'save')
				.update(null, 'a_roles', this.state.fields[0].field, nvs);
			req.Body()
				.whereEq('roleId', rec.roleId)
				.post(del_rf.post(rf));
		}

		let that = this;
		client.commit(req, (resp) => {
			that.state.crud = Protocol.CRUD.u;
			that.showOk(L('Role data saved!'));
			if (typeof that.props.onOk === 'function')
				that.props.onOk({code: resp.code, resp});
		}, this.context.error);
	}

	toCancel (e) {
		e.stopPropagation();
		if (typeof this.props.onClose === 'function')
			this.props.onClose({code: 'cancel'});
	}

	showOk(txt) {
		let that = this;
		this.ok = (<ConfirmDialog ok={L('OK')} open={true}
					title={L('Info')}
					cancel={false} msg={txt}
					onClose={() => {that.ok === undefined} } />);

		if (typeof this.props.onSave === 'function')
			this.props.onSave({code: 'ok'});

		that.setState({dirty: false});
	}

	render () {
		const { classes, width } = this.props;
		const smallSize = new Set(["xs", "sm"]).has(width);

		let c = this.state.crud === Protocol.CRUD.c;
		let u = this.state.crud === Protocol.CRUD.u;
		let rec = this.state.record;

		let title = c ? L('Create Role')
					: u ? L('Edit Role')
					: L('Role Details');

		return (<>
		  <Dialog className={classes.root}
			classes={{ paper: classes.dialogPaper }}
			open={true} fullWidth maxWidth="lg"
			onClose={this.handleClose}
		  >
			<DialogContent className={classes.content}>
			  <DialogTitle id="u-title" color="primary" >
				{title} - {c ? L("New") : u ? L("Edit") : ''}
				{this.state.dirty ? <StarIcons.Star color="secondary"/> : ""}
			  </DialogTitle>
			  <Grid container className={classes.content} direction="row">
				<Grid item sm={6} className={classes.left}>
				  <Box className={classes.rowBox}>
					{!smallSize && (
					  <Typography className={classes.formLabel}>
						{L("Role Id")}
					  </Typography>
					)}
					<TextField id="roleId"
						label={smallSize ? L("Role Id") : undefined}
						disabled={!c}
						variant="outlined" color="primary" fullWidth
						placeholder="Role ID" margin="dense"
						value={rec[this.state.fields[0].field] || ""}
						inputProps={{ style: this.state.fields[0].style }}
						onChange={(e) => {
							if (c)
							this.setState({
								record: Object.assign(rec, { roleId: e.target.value }),
								dirty : true });
						}}
					/>
				  </Box>
				</Grid>
				<Grid item sm={6} className={classes.right} >
				  <Box className={classes.rowBox}>
					{!smallSize && (
					  <Typography className={classes.formLabel} >
						{L("Role Name")}
					  </Typography>
					)}
					<TextField id="roleName" className={classes.formText}
						label={smallSize ? L("Role Name") : undefined}
						variant="outlined" color="primary" fullWidth
						placeholder="Role Name" margin="dense"
						value={rec[this.state.fields[1].field] || ""}
						inputProps={{ style: this.state.fields[1].style }}
						onChange={(e) => {
							this.setState({
								record: Object.assign(rec, { roleName: e.target.value }),
								dirty : true });
						}}
					/>
				  </Box>
				</Grid>
			  </Grid>
			  <Grid item sm={12} className={classes.formObject} >
				  <Box className={classes.rowBox}>
					{!smallSize && (
					  <Typography className={classes.formLabel} >
						{L("Remarks")}
					  </Typography>
					)}
					<TextField id="remarks" className={classes.formText}
						label={smallSize ? L("Remarks") : undefined}
						variant="outlined" color="primary" fullWidth
						placeholder="Remarks" margin="dense"
						value={rec[this.state.fields[2].field] || ""}
						inputProps={{ style: this.state.fields[2].style }}
						onChange={(e) => {
							this.setState({
								record: Object.assign(rec, { remarks: e.target.value }),
								dirty : true });
						}}
					/>
				  </Box>
			  </Grid>
			  <Grid item xs={12} className={classes.formObject} >
				  {this.state.forest && <AnTree checkbox
					  forest={this.state.forest}
					  onCheck={(e, v) => {this.setState({dirty: true})}} />}
			  </Grid>
			</DialogContent>
			<DialogActions className={classes.buttons}>
			  <Button onClick={this.toSave} variant="contained" color="primary">
				{(c || u) && L("Save")}
			  </Button>
			  <Button onClick={this.toCancel} variant="contained" color="primary">
				{(c || u) ? L('Close') : L("Cancel")}
			  </Button>
			</DialogActions>
		  </Dialog>
		  {this.ok}
	  </>);
	}
}
RoleDetailsComp.contextType = AnContext;

RoleDetailsComp.propTypes = {
	width: PropTypes.oneOf(["lg", "md", "sm", "xl", "xs"]).isRequired
};

const RoleDetails = withWidth()(withStyles(styles)(RoleDetailsComp));
export { RoleDetails, RoleDetailsComp };

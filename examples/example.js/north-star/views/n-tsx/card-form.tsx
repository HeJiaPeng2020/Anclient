
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";

import Grid from '@material-ui/core/Grid';
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card/Card';

import { TierCol, AnRowFormatter, TierComboField, Semantier } from '@anclient/semantier-st';
import { L, toBool, DatasetCombo } from '@anclient/anreact';

import { starTheme } from '../../common/star-theme';
import { CrudCompW, FormProp } from '../../common/north';

export interface CardsFormProp extends FormProp {
	headFormatter?: AnRowFormatter;
	CardsFormatter?: AnRowFormatter;
};

const styles = (theme: starTheme) => (Object.assign(
	Semantier.invalidStyles,
	{ root: {
		display: 'flex',
		width: '100%',
		backgroundColor: '#fafafaee'
	  },
	  paperHead: {
		width: '100%',
		'& :hover': {
		  backgroundColor: '#ced'
		}
	  },
	//  labelText: {
	// 	padding: theme.spacing(1),
	// 	borderLeft: '1px solid #bcd',
	//   },
	//   labelText_dense: {
	// 	paddingLeft: theme.spacing(1),
	// 	paddingRight: theme.spacing(1),
	// 	borderLeft: '1px solid #bcd' }
	}
) );

/**
 * This class render rows as Grid cards, a generic class like Tablist.
 * <h5>Required tiers:</h5>
 * <p>1. using tier.rec as paper head</p>
 * <p>2. using tier.rows as cards. All cards in Grid container.</p>
 */
class CardsFormComp extends CrudCompW<CardsFormProp> {
	state = {
		dirty: false,
		pk: undefined,
	};

    tier: Semantier;

	constructor (props: CardsFormProp) {
		super(props);

		this.tier = props.tier;
		this.formFields = this.formFields.bind(this);
		this.getField = this.getField.bind(this);
	}

	componentDidMount() {
		if (this.tier.pkval) {
			// in case rec is already loaded by parent component
			if (this.tier.rec && Object.keys(this.tier.rec).length > 0)
				console.warn("TRecordFormComp is supposed to load form data with pkval by itself.");

			let that = this;
			let cond = {};
			cond[this.tier.pk] = this.tier.pkval;
			this.tier.record(cond, (_cols, _rows) => {
				// that.rec = rows && rows[0] ? rows[0] : {};
				that.setState({});
			} );
		}
	}

    /**
	 * Let's move this better version to TRecordForm
	 */
	getField(f: TierCol, rec: { [x: string]: string; }, classes: { [x: string]: string; }) {
		let media = this.media;
		let { isSm } = media;
		let that = this;

		if (f.type === 'enum' || f.type === 'cbb') {
            const df = f as TierComboField;
			return (
				<DatasetCombo uri={ this.props.uri }
					sk={df.sk} nv={ df.nv }
					disabled={ !!df.disabled }
					readOnly={ !df && f.disabled }
					options={ df.options || []} val={{n: undefined, v:rec[f.field]} }
					label={ df.label }
					style={ df.cbbStyle || {width: 200} }
					invalidStyle={ df.style }
					onSelect={ (v) => {
						rec[df.field] = v.v;
						df.style = undefined;
						that.setState({dirty: true});
					} }
				/>);
		}
		else if (f.type === 'formatter' || f.formatter) {
			return (
				<>{f.formatter(rec)}</>
			);
		}
		else {
            const tf = f as TierCol;
			let type = 'text';
			if (tf.type === 'float' || tf.type === 'int')
				type = 'number';
			return (
			<TextField key={tf.field} type={tf.type || type}
				disabled={!!tf.disabled}
				label={isSm && !that.props.dense ? L(tf.label) : ''}
				variant='outlined' color='primary' fullWidth
				placeholder={L(tf.label)} margin='dense'
				value={ !rec || (rec[tf.field] === undefined || rec[tf.field] === null) ? '' : rec[tf.field] }
				className={classes[tf.style as string]}
				onChange={(e) => {
					rec[tf.field] = e.target.value;
					tf.style = undefined;
					that.setState({dirty: true});
				}}
			/>);
		}
	}

	formFields(rec: {}, classes, media: Media) {
		let fs = [];
		const isSm = this.props.dense || toBool(media.isMd);

		this.tier.fields().forEach( (f, i) => {
		  if (!!f.visible) {
			fs.push(
				<Grid item key={`${f.field}.${i}`}
					{...f.grid} className={this.props.dense ? classes.labelText_dense : classes.labelText} >
				  <Box className={classes.rowBox} {...f.box} >
					{!isSm && f.label &&
					  <Typography className={classes.formLabel} >
						{L(f.label)}
					  </Typography>
					}
					{this.getField(f, rec, classes)}
				  </Box>
				</Grid> );
		} } );
		return fs;
	}

	render () {
		const { classes, width } = this.props;
		let media = CrudCompW.getMedia(width);


		return <>
			{this.props.headFormatter(this.tier.rec, 0, classes, media)}
			<Grid container>
				{this.cards(classes, media)}
			</Grid>
		  </>;
	}

	// PaperHead(classes: {[x: string] : any}, media: Media): React.ReactNode {
	// 	let pl = this.tier.rec;
	// 	return <Card className={classes.paperHead}>{pl?.Title}</Card>
	// }

	cards(classes: {[x: string] : any}, media: Media): React.ReactNode {
		return this.tier.rows?.map( (r, x) => this.props.CardsFormatter(r, x, classes, media) );
	}
}

const CardsForm = withWidth()(withStyles(styles)(CardsFormComp)); // FIXME only after anreact upgraded
export { CardsForm, CardsFormComp }

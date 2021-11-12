

export function toBool(str) {
	return  !str || str === '0' || str === 'false'
			|| (typeof str === 'string' && str.trim().length === 0)
			? false : true;
}

export function isEmpty(str) {
	return typeof str === 'undefined' || str === null || str === '';
}

/**Usage: arr.swap(a, b);
 * see https://stackoverflow.com/a/4011851/7362888
 */
Array.prototype.swap = function(a, b){
    this[a] = this.splice(b, 1, this[a])[0];
    return this;
}


/**
 * https://stackoverflow.com/a/563442/7362888
 */
Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * @return {string} e.g. '2021-09-11'
 */
Date.prototype.toISOStr = function() {
	return this.toISOString().substring(0, 10);
};

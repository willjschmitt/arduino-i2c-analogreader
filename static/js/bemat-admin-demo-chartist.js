/**
 * bemat-admin-demo-chartist.js v1.0.0
 * http://www.cerocreativo.cl
 *
 * Copyright 2015, Cerocreativo.cl
 * http://www.cerocreativo.cl
 */

/**
 * Chartist Chars
 */
var data = {
	// A labels array that can contain any sort of values
	labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
	// Our series array that contains series objects or in this case series data arrays
	series: [
		[5, 2, 4, 2, 6],
		[1, 4, 2, 1, 5],
	]
};

var options = {
	height: 280
}

new Chartist.Line(".ct-chart", data, options);
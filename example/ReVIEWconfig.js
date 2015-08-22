var ReVIEW = require("review.js");
var lib = require("../lib/");

module.exports = function (review) {
	review.initConfig({
		builders: [new ReVIEW.HtmlBuilder()],
		validators: [new ReVIEW.DefaultValidator(), new lib.TextValidator("./prh.yml")],
		book: {
			contents: [
				"test.re"
			]
		}
	});
};

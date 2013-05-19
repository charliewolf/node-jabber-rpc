var Connection = require('./lib/connection');

var jabberrpc = exports

/**
 * Creates an Jabber-RPC client.
 *
 * @param {Object} options - server options to make the HTTP request to
 *   - {String} host
 *   - {Number} port
 *   - {String} url
 *   - {Boolean} cookies
 * @return {Client}
 * @see Client
 */
jabberrpc.createConnection = function(options) {
return new Connection(options);
};

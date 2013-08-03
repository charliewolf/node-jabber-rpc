var Connection = require('./lib/connection');

var jabberrpc = exports

/**
 * Creates an Jabber-RPC client.
 * Takes same options parameters as node-xmpp.Client
 *
 *   jid: String (required)
 *   password: String (required)
 *   host: String (optional)
 *   port: Number (optional)
 *   reconnect: Boolean (optional)
 *   register: Boolean (option) - register account before authentication
 *   legacySSL: Boolean (optional) - connect to the legacy SSL port, requires at least the host to be specified
 *   credentials: Dictionary (optional) - TLS or SSL key and certificate credentials
 *   actAs: String (optional) - if admin user act on behalf of another user (just user)
 *
 */

jabberrpc.createConnection = function(options) {
return new Connection(options);
};

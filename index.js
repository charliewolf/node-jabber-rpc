var Connection = require('./lib/connection');

var jabberrpc = exports

/**
 * Creates an Jabber-RPC client.
 * Custom options:
 * authenticate: a callback to check if a peer is authorized to perform RPC commands (call it back with an error in the first parameter if unauthorized)
 * dirty_json: set to true to break the XEP standard and encode the values in JSON internally
 * That will only work if both peers use this library, and is bad practice.
 * However, some servers (on the xmpp level) when dealing with large amounts of data will choke otherwise.
 *
 * Otherwise, takes same options parameters as node-xmpp.Client
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

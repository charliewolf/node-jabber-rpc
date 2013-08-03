# Jabber-RPC

Implementation of XEP-0009 in NodeJS for XMLRPC over XMPP. Parts of this  are based on the node-xmlrpc library.

This is ideal if you are using an environment where both method caller and callee might be behind a NAT and thus can't directly connect using XML-RPC/HTTP.


Basically run a `connection = jabber_rpc.createConnection(options)` on both sides with the appropriate options (see `index.js`).
Either side can both call and listen for events. Listen for a `ready` event (it's a standard `EventEmitter`) and then you can use `connection.methodCall(peer_jid, method, params_array, callback)`. The other side uses `connection.on(method,callback)`.

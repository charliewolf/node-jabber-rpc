var uuid = require('uuid');
var _ = require('underscore');

var EventEmitter = require('events').EventEmitter,
    Serializer = require('./serializer'),
    Deserializer = require('./deserializer'),
    xmpp = require('node-xmpp');

function Connection(options, onListening) {
    this.options = options;
    this._events |= {};
    if (false === (this instanceof Connection)) {
        return new Connection(options)
    }
    var that = this
    that._pending = {};
    that.conn = new xmpp.Client(options);
    that.keepalive = setInterval(function() {
        that.conn.send(' ');
    }, 45000);
    that.on('MethodList', function(error, params, callback) {
        callback(null, _.without(Object.keys(this._events), 'ready', 'MethodList'));
    });
    that.conn.on('online', that.emit.bind(that,'ready'));
    that.conn.on('error', that.emit.bind(that,'error'));
    that.conn.on('stanza', function(stanza) {
        if (!stanza.is('iq')) return false; // you have no power here
        var query = _.findWhere(stanza.children, {
            name: 'query'
        });
        if (query.attrs.xmlns !== 'jabber:iq:rpc') return false;
        if (stanza.type === 'error') {
            if (that._pending[stanza.attrs.id]) {
                if (that._pending[stanza.attrs.id].peer != stanza.attrs.from) return false;
                that._pending[stanza.attrs.id].fn.call(that, stanza.getChild('error'));
            }
            if (that._pending[stanza.attrs.id].timeout) clearTimeout(that._pending[stanza.attrs.id].timeout);
            delete that._pending[stanza.attrs.id];
            return;
        }
        var methodCall = _.findWhere(query.children, {
            name: 'methodCall'
        });
        if (methodCall) {
            if (options.authenticate) {
                return options.authenticate(stanza.attrs.from, function(err) {
                    if (!err) return next();
                });
            } else return next();

            function next() {
                var request = methodCall.toString();
                var deserializer = new Deserializer()
                deserializer.deserializeMethodCall(request, function(error, methodName, params) {
                    if (that.options.dirty_json === true) params = JSON.parse(params[0])
                    if (that._events.hasOwnProperty(methodName)) {
                        that.emit(methodName, null, params, function(error, value) {
                            var xml = null
                            if (error) {
                                xml = Serializer.serializeFault(error.toString());
                            } else {
                                xml = Serializer.serializeMethodResponse([JSON.stringify(value)])
                            }
                            var reply = new xmpp.Iq();
                            reply.attr('type', 'result').attr('from', that.conn.jid.toString()).attr('to', stanza.attrs.from).attr('id', stanza.attrs.id).c('query').attr('xmlns', 'jabber:iq:rpc').t(xml)
                            that.conn.send(reply);
                        });
                    }



                });
            };
            return;
        }
        var methodResponse = _.findWhere(query.children, {
            name: 'methodResponse'
        });
        if (methodResponse) {
            var deserializer = new Deserializer()
            deserializer.deserializeMethodResponse(methodResponse.toString(), function(error, params) {
                if (that._pending[stanza.attrs.id]) {
                    if (that._pending[stanza.attrs.id].peer != stanza.attrs.from) return false;
                    if (params && that.options.dirty_json === true) params = JSON.parse(params[0]);
                    that._pending[stanza.attrs.id].fn.apply(that, arguments);
                    //delete now
                    if (that._pending[stanza.attrs.id].timeout) clearTimeout(that._pending[stanza.attrs.id].timeout);
                    delete that._pending[stanza.attrs.id];
                }

            });

        }


    });
};

Connection.prototype.methodCall = function(peer, method, params, callback) {
    var iq = new xmpp.Iq();
    var that = this;
    var id = uuid.v1();
    if (that.options.dirty_json === true) params = [JSON.stringify(params)];
    iq.attr('type', 'set').attr('from', this.conn.jid.toString()).attr('to', peer).attr('id', id).c('query').attr('xmlns', 'jabber:iq:rpc').t(Serializer.serializeMethodCall(method, params));
    this.conn.send(iq);
    that._pending[id] = {
        fn: callback,
        peer: peer
    };
    var timeout = 30000;
    if (that.options.timeout) timeout = that.options.timeout;
    if (timeout != 0)
        that._pending[id].timeout = setTimeout(function() {
            if (that._pending[id]) {
                that._pending[id].fn(new Error('timeout'));
                delete that._pending[id];
            }
        }, 30000);
}

// Inherit from EventEmitter to emit and listen

Connection.prototype.__proto__ = EventEmitter.prototype


module.exports = Connection

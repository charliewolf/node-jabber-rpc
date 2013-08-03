var xmpp = require('node-xmpp');
var _ = require('underscore');
var dateFormatter=require('./date_formatter');
exports.serializeMethodCall = function(method, params) {

    var params = params || []

    var xml = new xmpp.Stanza('methodCall')

    xml.c('methodName').t(method);

    var xmlparams = xml.c('params');
    _.each(params,function(param) {
        serializeValue(param, xmlparams.c('param'))
    })
    return xml;
}

/**
 * Creates the XML for an XML-RPC method response.
 *
 * @param {mixed} value       - The value to pass in the response.
 * @param {Function} callback - function (error, xml) { ... }
 *   - {Object|null} error    - Any errors that occurred while building the XML,
 *                              otherwise null.
 *   - {String} xml           - The method response XML.
 */

exports.serializeMethodResponse = function(result) {

    var xml = new xmpp.Stanza('methodResponse');
    serializeValue(result, xml.c('params'));
    // Includes the <?xml ...> declaration
    return xml;
}

exports.serializeFault = function(fault) {
    var xml = new xmpp.Stanza('methodResponse');

    serializeValue(fault, xml.c('fault'))

    // Includes the <?xml ...> declaration
    return xml;
}

function serializeValue(value, xml) {
    var stack = [{
            value: value,
            xml: xml
        }
    ],
        current = null,
        valueNode = null,
        next = null

    while (stack.length > 0) {
        current = stack[stack.length - 1]

        if (current.index !== undefined) {
            // Iterating a compound
            next = getNextItemsFrame(current)
            if (next) {
                stack.push(next)
            } else {
                stack.pop()
            }
        } else {
            // we're about to add a new value (compound or simple)
            valueNode = current.xml.c('value')
            switch (typeof current.value) {
                case 'boolean':
                    appendBoolean(current.value, valueNode)
                    stack.pop()
                    break
                case 'string':
                    appendString(current.value, valueNode)
                    stack.pop()
                    break
                case 'number':
                    appendNumber(current.value, valueNode)
                    stack.pop()
                    break
                case 'object':
                    if (current.value === null) {
                        valueNode.c('nil')
                        stack.pop()
                    } else if (current.value instanceof Date) {
                        appendDatetime(current.value, valueNode)
                        stack.pop()
                    } else if (Buffer.isBuffer(current.value)) {
                        appendBuffer(current.value, valueNode)
                        stack.pop()
                    } else {
                        if (Array.isArray(current.value)) {
                            current.xml = valueNode.c('array').c('data')
                        } else {
                            current.xml = valueNode.c('struct')
                            current.keys = Object.keys(current.value)
                        }
                        current.index = 0
                        next = getNextItemsFrame(current)
                        if (next) {
                            stack.push(next)
                        } else {
                            stack.pop()
                        }
                    }
                    break
                default:
                    stack.pop()
                    break
            }
        }
    }
}

function getNextItemsFrame(frame) {
    var nextFrame = null

    if (frame.keys) {
        if (frame.index < frame.keys.length) {
            var key = frame.keys[frame.index++],
                member = frame.xml.c('member').c('name').t(key).up()
                nextFrame = {
                    value: frame.value[key],
                    xml: member
                }
        }
    } else if (frame.index < frame.value.length) {
        nextFrame = {
            value: frame.value[frame.index],
            xml: frame.xml
        }
        frame.index++
    }

    return nextFrame
}

function appendBoolean(value, xml) {
    xml.c('boolean').t(value ? 1 : 0)
}

var illegalChars = /^(?![^<&]*]]>[^<&]*)[^<&]*$/

    function appendString(value, xml) {
        if (value.length === 0) {
            xml.c('string')
        } /* else if (!illegalChars.test(value)) {
            xml.c('string').d(value)
        } */ else {
            xml.c('string').t(value)
        }
    }

    function appendNumber(value, xml) {
        if (value % 1 == 0) {
            xml.c('int').t(value)
        } else {
            xml.c('double').t(value)
        }
    }

    function appendDatetime(value, xml) {
        xml.c('dateTime.iso8601').t(dateFormatter.encodeIso8601(value))
    }

    function appendBuffer(value, xml) {
        xml.c('base64').t(value.toString('base64'))
    }

'use strict';

var http = require( 'http' );
var https = require( 'https' );
var fs = require( 'node-fs' );
var extend = require( 'node.extend' );
var EventEmitter = require( 'events' ).EventEmitter;
var util = require( 'util' );
var crypto = require( 'crypto' );
var express = require( 'express' );

var geoip = require( 'geoip-native' );

var defaults = {
    lookupURI: '/location/:ip',
    origin: '*'
};

module.exports = GeoIPServer;

function GeoIPServer( _options ) {
    var self = this;
    EventEmitter.call( self );

    self.options = extend( {}, defaults, _options );
}

util.inherits( GeoIPServer, EventEmitter );

GeoIPServer.prototype.attach = function( app ) {
    var self = this;

    function AllowCORS( request, response, next ) {
        response.header( 'Access-Control-Allow-Origin', self.options.origin );
        response.header( 'Access-Control-Allow-Methods', 'POST' );

        if ( !!request.headers[ 'access-control-request-headers' ] ) {
            response.header( 'Access-Control-Allow-Headers', request.headers[ 'access-control-request-headers' ] );
        }

        if ( request.method === 'OPTIONS' ) {
            response.send( 200 );
            return;
        }

        next();
    }

    if ( self.options.cors ) {
        app.all( self.options.lookupURI, AllowCORS );
    }

    app.get( self.options.lookupURI, function( request, response, next ) {
        self.onLookup( request, response, next );
    } );
};

GeoIPServer.prototype.getSignature = function( request ) {
    var self = this;

    var verification = '';
    for ( var key in Object.keys( request.query ).sort() ) {
        if ( key === 'signature' ) {
            continue;
        }

        verification += key + '=' + request.query[ key ] + '&';
    }

    verification += 'ip=' + request.params.ip + '&';
    verification += 'secret=' + self.options.secret;

    return crypto.createHash( 'sha1' ).update( verification ).digest( 'hex' );
};

GeoIPServer.prototype.onLookup = function( request, response ) {
    var self = this;

    var signature = request.query.signature || request.headers[ 'x-signature' ];
    
    if ( self.options.secret && !signature ) {
        response.json( {
            error: 'signature missing',
            message: 'No signature specified in request.'
        }, 400 );
        return;
    }

    if ( self.options.secret && ( self.getSignature( request ) != signature ) ) {
        response.json( {
            error: 'invalid signature',
            message: 'Signature for this request is invalid.'
        }, 400 );
        return;
    }

    var ip = request.params.ip;
    
    var geo = geoip.lookup( ip );
    self.emit( 'lookup', {
        ip: ip,
        geo: geo,
        request: request
    } );

    response.json( geo );
};

var listenDefaults = {
    port: 8888,
    ssl: {
        port: 4443
    }
};

GeoIPServer.prototype.listen = function( _options ) {
    var self = this;

    var options = extend( {}, listenDefaults, _options );

    var app = express();
    self.attach( app );

    if ( options.ssl && options.ssl.key && options.ssl.cert ) {
        var httpsServer = https.createServer( {
            key: fs.readFileSync( options.ssl.key ),
            cert: fs.readFileSync( options.ssl.cert ),
            ca: options.ssl.ca || []
        }, app );

        httpsServer.listen( options.ssl.port );

        self.emit( 'listening', {
            ssl: true,
            port: options.ssl.port
        } );
    }

    var httpServer = http.createServer( app );

    httpServer.listen( options.port );

    self.emit( 'listening', {
        port: options.port
    } );

    return self;
};

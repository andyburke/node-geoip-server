#!/usr/bin/env node
'use strict';

var program = require( 'commander' );
var humanize = require( 'humanize' );

var keyfilename = '.geoip-server-key';

program
    .usage( '[options]' )
    .option( '-s, --secret <secret key>', 'Specify the secret key. If this is not specifed, storehouse will check for a ' + keyfilename + ' file in the current directory. A key *must* be specified using this option or with a key file.' )
    .option( '--url <url>', 'Specify the lookup url. Eg: --url "/ip/:ip"  Default: /location/:ip' )
    .option( '--cors', 'Allow CORS cross-domain requests.' )
    .option( '--cors_origin', 'Set the allowed origin(s) for CORS. Default: *' )
    .option( '-p, --port <port>', 'Specify the port to listen on. Default: 8888' )
    .option( '--sslkey <keyfile>', 'Specify an SSL key file.' )
    .option( '--sslcert <certfile>', 'Specify an SSL cert file.' )
    .option( '--quiet', 'Do not print out events.' )
    .parse( process.argv );

if ( !program.secret )
{
    var fs = require( 'fs' );
    if ( fs.existsSync( keyfilename ) )
    {
        var keyfile_contents = fs.readFileSync( keyfilename, 'utf8' );
        program.secret = keyfile_contents.trim();
    }
}

var GeoIPServer = require( './index' );

var options = {
    secret: program.secret
};

var listenOptions = {
    ssl: {}
};

if ( program.url )           options.lookupURI = program.url;
if ( program.cors )          options.cors = true;
if ( program.cors_origin )   options.origin = program.cors_origin;
if ( program.port )          listenOptions.port = program.port;
if ( program.sslkey )        listenOptions.ssl.key = program.sslkey;
if ( program.sslcert )       listenOptions.ssl.cert = program.sslcert;

var geoIPServer = new GeoIPServer( options ).listen( listenOptions );

if ( !program.quiet )
{
    console.log( "GeoIPServer started..." );
    
    geoIPServer.on( 'lookup', function( event ) {
        console.log( humanize.date( 'c' ) + ' lookup: ' + event.ip );
    } );
}

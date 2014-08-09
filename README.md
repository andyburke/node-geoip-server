GeoIPServer
=========

GeoIPServer is a small, simple *node.js* module that allows simple IP geolocation requests. It also comes with a convenient command line utility for creating a standalone server.

## Installation

GeoIPServer requires *node.js*, *npm* and the requisite *data files*.

You can install GeoIPServer for use in your own project:

```
npm install geoip-server
```

Or you can install GeoIPServer globally, making it easy to run the standalone server:

```
sudo npm install geoip-server -g
```

## Usage

### In your project:

If you're already using express, you can attach GeoIPServer directly to your app:

```javascript
var GeoIPServer = require( 'geoip-server' );

var geoIPServer = new GeoIPServer( {
    url: '/ip/:ip',
    secret: 'this is the secret key'
} );

geoIPServer.attach( app ); // attach to an existing express app
```

If you don't already have an express app, you can tell GeoIPServer to listen on its own:

```javascript
geoIPServer.listen( {
    port: 8888 
} );
```

GeoIPServer also supports SSL:

```javascript
geoIPServer.listen( {
    port: 8888,
    ssl: {
        key: './path/to/ssl.key',
        cert: './path/to/ssl.crt',
        port: 4443
    }
} );
```

### As a standalone server:

```
  Usage: geoip-server [options]

  Options:

    -h, --help                 output usage information
    -s, --secret <secret key>  Specify the secret key for the storehouse. !!REQUIRED!!
    --url <url>                Specify the upload url. Eg: --url "/uploadfile"  Default: /upload
    -p, --port <port>          Specify the port to listen on. Default: 8888
    --sslkey <keyfile>         Specify an SSL key file.
    --sslcert <certfile>       Specify an SSL cert file.
    --quiet                    Do not print out events.
```

Example:

```
geoip-server -s "this is the secret key" --url /test/:ip --quiet
```

This would start a GeoIPServer with the secret key "this is the secret key" that:
 - Has an lookup endpoint url of: /test/:ip
 - Will not print out request logs

## Cool, how do I keep everyone on the internet from querying my server?

That's where the secret key comes in: to make a request you must send a signature along for validation.

The signature is a SHA1 of some information about the request plus the secret key.

The signature you send match this signature. To generate a signature, you would execute:

```javascript
var verification = '';
for ( var key in Object.keys( optionalQueryParams ).sort() ) {
    verification += key + '=' + optionalQueryParams[ key ] + '&';
}

verification += 'ip=' + ipToLookup + '&';
verification += 'secret=' + 'your secret code';

var signature = crypto.createHash( 'sha1' ).update( verification ).digest( 'hex' );
```

## That's great, but how do I generate a signature without leaking my secret key?

Good question! GeoIPServer is mostly intended to be used as a part of an existing web infrastructure where you already have some kind of web service running.

If you're using GeoIPServer internally, you could skip the secret key altogether and just limit incoming connections to approved IPs.

If you'd like to expose it externally, though, you can calculate the signature for the client on your server:

```javascript
ajaxCall( {
    url: '/api/getipgeolocationsignature',
    type: 'POST',
    data: {
        ip: ipAddressToLookup
    },
    success: function( signature ) {
        // here your API has given us back a signature that allows this request

        ajaxCall( {
            url: '/ip/' + ipAddressToLookup,
            type: 'GET',
            data: {
                signature: signature
            },
            success: function( lookup ) {
                console.log( lookup );
            }
        } );
    }
} );
```

# CREDIT WHERE CREDIT IS DUE

Thanks to Philip Tellis (@bluesmoon) for his geoip-lite library, which GeoIPServer is mostly a small wrapper around.

# CHANGELOG

v0.0.1
------
- Initial release.

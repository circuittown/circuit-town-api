#!/usr/bin/env node --harmony

// The basic prereqs
const config = require('config'),
    args = require('args'),
    mysql = require('mysql'),
    prettyjson = require('prettyjson'),
    _ = require('lodash'),
    express = require('express')
;

// Grab config values
const mysqlUrl = config.get('mysqlUrl');

// Get a mysql connection going that will be used in most routes
const db = mysql.createConnection(mysqlUrl);
    db.connect();


// Argument formatting
args.option('card', "Fetch a Circuit Town scorecard.");
args.option('areas', "Fetch a full list of areas");
args.option('server', "Launch a Circuit Town API server");
args.option('port', "Specify a port for hosting the API server");
const flags = args.parse(process.argv);

// The routes
if(flags.areas) {
    getAreas()
        .then(function(res) {
            console.log("Circuit Town Areas");
            console.log(prettyjson.render(res));
            process.exit();
        });
}
if(flags.server) {
    // Fire up a Circuit Town HTTP API server
    const app = express(),
    port = flags.port || 8000;

    app.listen(port, () => {
        console.log(`Circuit Town live at http://localhost:${port}`);
    });

    app.all("/api/getAreas", function(req,res,next) {
        getAreas()
        .then(function(areas) {
            res.send(areas);
            next();
        });
    })
}

// Show help if nothing else
if(_.isEmpty(flags)) {args.showHelp();process.exit();}

// Circuit Town logic
function getAreas(args) {
    var query = `select area, area_id, country_id, user_mast_id from areas where approved = 'yes' order by country_id, TRIM(LEADING 'the ' FROM LOWER('area'))`;

    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    });
}

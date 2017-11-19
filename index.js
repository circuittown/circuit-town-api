#!/usr/bin/env node --harmony

// The basic prereqs
const config = require('config'),
    args = require('args'),
    mysql = require('mysql'),
    prettyjson = require('prettyjson'),
    _ = require('lodash'),
    express = require('express'),
    PHPUnserialize = require('php-unserialize')
;

// Grab config values
const mysqlUrl = config.get('mysqlUrl');

// Get a mysql connection going that will be used in most routes
const db = mysql.createConnection(mysqlUrl);
    db.connect();


// Argument formatting
args.option('card', "Fetch a Circuit Town scorecard.");
args.option('areas', "Fetch a full list of areas");
args.option('difficulty', "Fetch a list of colors for difficulty.");
args.option(['U','allusers'], "Fetch a list of all users.");
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
if(flags.difficulty) {
    getDifficulty()
        .then(function(res) {
            console.log("Circuit Town Difficulty Colors");
            console.log(prettyjson.render(res));
            process.exit();
        });
}
if(flags.allusers) {
    getAllusers()
        .then(function(res) {
            console.log("Circuit Town Master User List");
            console.log(prettyjson.render(res));
            process.exit();
        });
}
if(flags.card) {
    if(_.isNumber(flags.card) === false) {
        console.log("Need a card ID, please.");
        process.exit();
    }
    else {
        getCard({cardId:flags.card})
            .then(function(res) {
                console.log(`Card #${flags.card}`);
                console.log(prettyjson.render(res));
                process.exit();
            });
    }
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
    app.all("/api/getDifficulty", function(req,res,next) {
        getDifficulty()
        .then(function(difficulty) {
            res.send(difficulty);
            next();
        });
    })	
    app.all("/api/getAllusers", function(req,res,next) {
        getAllusers()
        .then(function(allusers) {
            res.send(allusers);
            next();
        });
    })
    app.all("/api/getCard/:cardId", function(req,res,next) {
        getCard({cardId:req.params.cardId})
        .then(function(card) {
            res.send(card);
            next();
        });
    })

}

// Show help if nothing else
if(_.isEmpty(flags)) {args.showHelp();process.exit();}

// Circuit Town logic
function getAreas() {
    var query = `select area, area_id, country_id, user_mast_id from areas where approved = 'yes' order by country_id, TRIM(LEADING 'the ' FROM LOWER('area'))`;

    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    });
}
function getDifficulty(args) {
    var query = `select colour, colour_id, adjective, css, english, font, verm from colour order by colour_id`;
    
    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    });
}
function getAllusers(args) {
    var query = `select user, md5, user_mast_id, approved, handle, weight, height, ape, weightkg from user_mast order by user_mast_id, approved`;
    
    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    });
}
function getCard(args) {
    var cardId = args.cardId;
    var scq = `select card_id, circuit_id, user_mast_id, right_now, comment, card, coursepar, userpar from cards WHERE card_id = ${cardId}`;

    return new Promise(function(resolve,reject) {
        db.query(scq, function (error, results, fields) {
            if (error) throw error;
            var card = results[0];

            card.comment = card.comment.toString();

            var scoreData = PHPUnserialize.unserialize(card.card);
            var score = [];
            _.forEach(scoreData[0], function(it, key) {
                 score.push({name:it, par:scoreData[1][key], score:scoreData[1][key]});
            });
            card.card = score;

            resolve(card);
        });
    });
}

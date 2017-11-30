#!/usr/bin/env node --harmony

// The basic prereqs
const config = require('config'),
    args = require('args'),
    mysql = require('mysql'),
    prettyjson = require('prettyjson'),
    _ = require('lodash'),
    express = require('express'),
    PHPUnserialize = require('php-unserialize')
    moment = require('moment');
;

// Grab config values
const mysqlUrl = config.get('mysqlUrl');

// Get a mysql connection going that will be used in most routes
const db = mysql.createConnection(mysqlUrl);
    db.connect();


// Argument formatting
args.option('areas', "Fetch a full list of areas");
args.option('difficulty', "Fetch a list of colors for difficulty.");
args.option(['D', 'colour'], "Fetch a colour and details.");
args.option('circuit','Fetch a circuit.');
args.option(['p','problems'], "Fetch a list of problems for a circuit.");
args.option(['P','port'], "Specify a port for hosting the API server");
args.option('scorecard', "Fetch a Circuit Town scorecard.");
args.option(['S','server'], "Launch a Circuit Town API server");
args.option('user', "Fetch a user detail");
args.option(['U','allusers'], "Fetch a list of all users.");
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
if(flags.colour) {
    var allowedColours = ['white', 'yellow', 'orange', 'blue', 'red', 'black', 'pink'];
    if(allowedColours.indexOf(flags.colour) == -1) {
        console.log("Need a colour, please.");
        process.exit();
    } else {
        getColour({colour:flags.colour})
            .then(function(res) {
                console.log(`Colour #${flags.colour}`);
                console.log(prettyjson.render(res));
                process.exit();
            });
    } 
}
if(flags.allusers) {
    getAllusers()
        .then(function(res) {
            console.log("Circuit Town Master User List");
            console.log(prettyjson.render(res));
            process.exit();
        });
}
if(flags.user) {
	if(_.isNumber(flags.user) === false) {
        	console.log("Need a user ID, please.");
		process.exit();
	}
	else {
        getUser({userId:flags.user})
            .then(function(res) {
                console.log(`User #${flags.user}`);
                console.log(prettyjson.render(res));
                process.exit();
            });
	}
}
if(flags.circuit) {
        if(_.isNumber(flags.circuit) === false) {
                console.log("Need a circuit ID, please.");
                process.exit();
        }
        else {
        getCircuit({circuitId:flags.circuit})   
            .then(function(res) {
                console.log(`Circuit #${flags.circuit}`);
                console.log(prettyjson.render(res));
                process.exit();
            });
        }
}
if(flags.problems) {
        if(_.isNumber(flags.problems) === false) {
                console.log("Need a circuit ID, please.");
                process.exit();
        }
        else {
        getProblems({circuitId:flags.problems})
            .then(function(res) {
                console.log(`Circuit #${flags.problems}`);
                console.log(prettyjson.render(res));
                process.exit();
            });
        }
}
if(flags.scorecard) {
    if(_.isNumber(flags.scorecard) === false) {
        console.log("Need a card ID, please.");
        process.exit();
    }
    else {
        getCard({cardId:flags.scorecard})
            .then(function(res) {
                console.log(`Card #${flags.scorecard}`);
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
    app.all("/api/getColour/:colour", function(req,res,next) {
        getColour({colour:req.params.colour})
        .then(function(colour) {
            res.send(colour);
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
    app.all("/api/getUser/:userId", function(req,res,next) {
        getUser({userId:req.params.userId})
        .then(function(user) {
            res.send(user);
            next();
        });
    })
    app.all("/api/getCircuit/:circuitId", function(req,res,next) {
        getCircuit({circuitId:req.params.circuitId})
        .then(function(circuit) {
            res.send(circuit);
            next();
        });
    })
    app.all("/api/getProblems/:circuitId", function(req,res,next) {
        getProblems({circuitId:req.params.circuitId})
        .then(function(problems) {
            res.send(problems);
            next();
        });
    })
    app.all("/api/getCard/:cardId", function(req,res,next) {
        getCard({cardId:req.params.cardId})
        .then(function(scorecard) {
            res.send(scorecard);
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
function getColour(args) {
    var colour = args.colour;
    var query = `select colour, colour_id, adjective, css, english, font, verm from colour where colour = '${colour}'`;
    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            var colour = results[0];
            resolve(colour);
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
function getUser(args) {
    var userId = args.userId;
    var query = `select user, md5, user_mast_id, approved, handle, weight, height, ape, weightkg from user_mast where user_mast_id = ${userId}`;

    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results);
        });
    });
}
function getCircuit(args) {
    var circuitId = args.circuitId;
    var query = `select circuit, area_id, is_subarea, colour, user_mast_id from circuit where circuit_id = ${circuitId}`;

    // Using var before this definition scopes it locally to the getCircuit function, but above all the callbacks that are about to happen, so they can "share" the circ object we're creating 
    var circ = {}; 

    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;

            // By leaving off the var keyword here, we keep using the circ creating above, so we retain our scope that can be used by any callback below
            circ = results[0];

            // Dummy resolve that moves us to the next promise
            resolve(0);
        });
    })
        .then(function() {
            return new Promise(function(resolve,reject) {
                if (circ.is_subarea == "yes") {
                    var subarea_id = circ.area_id;
                    var saq = `select subarea, area_id from subareas where subarea_id = ${subarea_id}`;
                    db.query(saq, function(error, subresults, fields) {
                        if (error) throw error;
                        var subarea = subresults[0];
                        circ['subarea'] = subarea.subarea;
                        circ.area_id = subarea.area_id;
                        resolve(0);
                    });
                } else {
                    resolve(0);
                }

            });
        })
        .then(function() {
            return new Promise(function(resolve,reject) {
                var area_id = circ.area_id;
                aq = `select area from areas where area_id = ${area_id}`;
                db.query(aq, function(error, aresults, fields) {
                    if (error) throw error;
                    var area = aresults[0];
                    circ['area'] = area.area;
                    resolve(0);
                });
            });
        })
        .then(function() {
            return new Promise(function(resolve,reject) {
                var ccq = `select cirq_comments.user_mast_id, cirq_comments.right_now, user_mast.handle, cirq_comments.comment, cirq_comments.cc_id from cirq_comments inner join user_mast on 
cirq_comments.user_mast_id=user_mast.user_mast_id where cirq_comments.circuit_id = ${circuitId}`;
                db.query(ccq, function(error, ccresults, fields) {
                    if (error) throw error;
                    circ.comments = [];
                    var f_right_now;
                    _.forEach(ccresults, function(it, key) {
                        f_right_now = it.right_now;
                        f_right_now = moment(f_right_now).format("MMM DD, YYYY");
                        circ.comments.push({comment:it.comment.toString(), handle:it.handle, user_mast_id:it.user_mast_id, cc_id:it.cc_id, right_now:f_right_now})
                    });
                    resolve(0);                    
                });
            });
        })
        .then(function() {
            // our finished circuit object
            return circ;
        });
}
function getProblems(args) {
    var circuitId = args.circuitId;
    var query = `select problem_order, cp_id, problem, par from circuit_problems where circuit_id = ${circuitId} order by problem_order`;

    var problems = [];
    return new Promise(function(resolve,reject) {
        db.query(query, function (error, results, fields) {
            if (error) throw error;
            problems = results;
            resolve(0);
        });
    })
	.then(function() {
        var proms = [];

        _.forEach(problems, function(val,problemKey) {
            proms.push(
                        new Promise(function(resolve,reject) {
                            var pname = val.problem;
                            var pcq = `select problem_comments.user_mast_id, problem_comments.right_now, user_mast.handle, problem_comments.comment, problem_comments.pc_id from problem_comments 
                            inner join user_mast on problem_comments.user_mast_id=user_mast.user_mast_id where problem_comments.problem = "${pname}" and problem_comments.circuit_id = ${circuitId}`;
                            db.query(pcq, function(error, pcresults, fields) {
                                if (error) throw error;
                                var f_right_now;
                                _.forEach(pcresults, function(it, key) {
                                    if(problems[problemKey].comments === undefined) problems[problemKey].comments = [];
                                    f_right_now = it.right_now;
                                    f_right_now = moment(f_right_now).format("MMM DD, YYYY");
                                    problems[problemKey].comments.push({comment:it.comment.toString(), handle:it.handle, user_mast_id:it.user_mast_id, pc_id:it.pc_id, right_now:f_right_now})
                                });

                                resolve(0);
                            });
                        })
            );
        });

        return Promise.all(proms);
    })
        .then(function() {
            // our finished circuit object
            return problems;
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
                 score.push({name:it, par:scoreData[1][key], score:scoreData[2][key]});
            });
            card.card = score;

            resolve(card);
        });
    });
}

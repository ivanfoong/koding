/*
 * get stock recommendation from eastmoney.com
 */

var fs = require('fs'),
    MyMongo = require('./MyMongoUtil'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    config = require('../config.json');

var span = [
        /<span id="sp_ggdp">([.\S\W]+?)<\/span>/g,
        /机构参与度为([0-9.]+)/g,
        /<span class="red">([\.0-9]+?)<\/span>|<span class="green">([\-\.0-9]+?)<\/span>/g,
        /主力成本([0-9.]+)元/g
    ],
    options = {
        host: 'data.eastmoney.com'
            //, debug: true
    },
    urlFormat = '/stockcomment/{0}.html',
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.EMDbUri, 'em')),
    start = 1,
    today = process.argv.length > 2 ? process.argv[2] : new Date().format('yyyyMMdd'),
    helper = {
        rt: 0, //total
        rc: 0, //counter
        ri: 0, //current index
        r: [], //record
        rs: 0, //start
        re: 0 //end
    };

function counterProcess(symbol) {
    if (symbol.startsWith('999') ||
        symbol.startsWith('399') ||
        symbol.startsWith('510') ||
        symbol.startsWith('159')) {
        helper.rt--;
        return;
    }

    options.path = urlFormat.format(symbol);
    myUtil.get(options, function(content, statusCode) {

        if (statusCode === 200) {
            var o = coreProcess(content, symbol);
            if (o) {
                o._id = start++;
                o.s = symbol;
                o.d = today;
                helper.r.push(o);
                helper.ri++;
            }
        } else {
            console.dir([symbol, 'error ' + statusCode]);
        }

        helper.rc++;
        // console.log("{0},{1}".format(helper.rc, helper.rt));

        if (helper.rc % 100 === 0 || helper.rc === helper.rt) {
            helper.rs = helper.re;
            helper.re = helper.ri;
            console.log("{0}-{1}".format(helper.rs, helper.re));

            if (helper.re > helper.rs) {
                myMongo.insert("test", helper.r.slice(helper.rs, helper.re), function(err, docs) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            }

            // if (helper.rc === helper.rt) {
            //     console.log('done');
            // }
        }
    });
}

function parse(reg, input) {
    var result = [],
        m;
    while ((m = reg.exec(input))) {
        if (m.index === m.lastIndex) {
            m.lastIndex++;
        }
        result.push(m[1]);
    }
    return result;
}

function parse2(reg, input) {
    /// parsed by regex with a single "|"
    var result = [],
        m;
    while ((m = reg.exec(input)) != null) {
        if (m.index === m.lastIndex) {
            m.lastIndex++;
        }

        result.push(m[1] || m[2]);
    }
    return result;
}

function coreProcess(content, s) {
    var logArr = [];
    logArr.push(s);

    var reg = /<table class="tab1" cellpadding="0" cellspacing="0">([.\S\W]*?)<\/table>/gm;
    if (reg.test(content)) {
        content = content.match(reg)[0].stripLineBreaks();

        var result = {};
        var tmp = parse(span[0], content);
        if (tmp.length === 1) {
            result["cmm"] = tmp[0].trim();
        } else {
            logArr.push(0);
        }

        tmp = parse(span[1], content);
        if (tmp.length === 1) {
            result["mm"] = Number(tmp[0]);
        } else {
            logArr.push(1);
        }

        tmp = parse2(span[2], content);
        if (tmp.length === 2) {
            result["mi1"] = Number(tmp[0]);
            result["mi2"] = Number(tmp[1]);
        } else {
            logArr.push(2);
            logArr.push(3);
        }

        tmp = parse2(span[3], content);
        if (tmp.length === 2) {
            result["c1"] = Number(tmp[0]);
            result["c20"] = Number(tmp[1]);
        } else if (tmp.length === 1) {
            result["c1"] = Number(tmp[0]);
            logArr.push(5);
        } else {
            logArr.push(4);
            logArr.push(5);
        }

        if (logArr.length > 1) {
            if (logArr[1] !== 5) { // don't log new stock
                console.dir(logArr);
                return null;
            }
        };

        return result;

    } else {
        if (content) {
            logArr.push("something wrong");
            save(s, content);
        } else {
            logArr.push("empty");
        }

        if (logArr.length > 1) {
            console.dir(logArr);
        };
        return null;
    }
}

function save(s, data) {
    fs.writeFile("{0}.txt".format(s), data, function(err) {
        if (err) {
            throw err;
        }
        // console.log('%s done', s);
    });
}

function totalLines(filename) {
    var lines = myUtil.readlinesSync(filename);
    if (lines) {
        if (lines[lines.length - 1]) {
            return lines.length;
        }
        return lines.length - 1;
    }
    return 0;
}

function driven(func) {
    if (func) {
        myMongo.find("test", {
            q: {},
            s: {
                _id: -1
            },
            o: {
                limit: 1
            }
        }, function(err, docs) {
            if (err) {
                console.error(err);
                return;
            }

            var seq = 1;
            if (docs && docs.length === 1) {
                seq = docs[0]._id + 1;
            }

            func(seq);
        });
    }
}

function mainFunc(seq) {
    start = seq;
    console.log("start from", start);

    var filename = "../symbols.txt",
        total = totalLines(filename);

    if (total > 0) {
        helper.rt = total;

        myUtil.readlines(filename, function(row) {
            var symbol = row.split(',')[0];
            if (symbol) {
                counterProcess(symbol);
            }
        });
    }
}

function patchFunc(seq) {
    start = seq;
    console.log("start from", start);

    var index = 1,
        filename = "./{0}.txt".format(today);

    myUtil.readlines(filename, function(row) {
        if (index++ == 1) {
            return;
        }

        var symbol,
            arr = eval(row);
        if (arr instanceof Array) {
            helper.rt++;
            symbol = arr[0];
            // console.log(symbol);
            counterProcess(symbol);
        }
    });
}


var action = process.argv.length > 3 ? process.argv[3] : 1;
if (action == 1) {
    driven(mainFunc);
} else if (action == 2) {
    driven(patchFunc);
} else {
    console.log("USAGE: node em.js [yyyyMMdd] [action]");
}

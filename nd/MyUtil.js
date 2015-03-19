var http = require('http'),
    https = require('https'),
    fs = require('fs');

http.globalAgent.maxSockets = 25;

var MyUtil = function() {};

MyUtil.prototype.extend = function(origin, add) {

    var isObject = function(value) {
        return Object(value) === value;
    };

    return (function() {
        if (!add || typeof add !== 'object') return origin;

        var keys = Object.keys(add); //Object.getOwnPropertyNames(add);
        var i = keys.length;
        while (i--) {
            if (isObject(origin[keys[i]])) {
                MyUtil.prototype.extend(origin[keys[i]], add[keys[i]]);
            } else {
                origin[keys[i]] = add[keys[i]];
            }
        }
        return origin;
    }(origin, add));
};

// refer to https://github.com/ncb000gt/node-es/blob/master/lib/request.js
MyUtil.prototype.get = function(options, callback) {
    options = this.extend({
        secure: false,
        port: 80,
        method: 'GET',
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,zh-TW;q=0.2',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36',
        },
        timeout: 15000,
        // , debug: true
    }, options);

    var req = (options.secure ? https : http).get(options, function(res) {

        var bodyChunks = [];
        // res.setEncoding('utf-8');

        if (options.debug) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
        }

        res.on('data', function(chunk) {
            bodyChunks.push(chunk);
        }).on('end', function() {

            var body = Buffer.concat(bodyChunks);

            if (options.debug) {
                console.log('BODY: ' + body);
            }

            if (options.jsonp) {
                if (options.debug) {
                    console.log('jsonp');
                };

                var str = body.toString(),
                    index = str.indexOf("(");
                if (index > 0) {
                    global[str.substring(0, index)] = callback;
                    eval(str);
                } else {
                    console.log('JSONP ERROR');
                }

            } else {
                callback(body, res.statusCode);
            }
        });

    });

    req.on('error', function(err) {
        // if (err.code === "ECONNRESET") {
        //     console.log("Timeout occurs");
        // } else {
        //     console.log('ERROR: ' + err.message);
        // }
        callback(null, 500);
    });

    if (options.timeout) {
        req.setTimeout(options.timeout, function() {
            req.abort();
        });
    }
};

MyUtil.prototype.readlines = function(filePath, callback) {
    var input = fs.createReadStream(filePath);
    var remaining = '';

    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        while (index > -1) {
            var line = remaining.substring(0, index);
            remaining = remaining.substring(index + 1);
            callback(line.replace(/\r/g, ''));
            index = remaining.indexOf('\n');
        }
    });

    input.on('end', function() {
        if (remaining.length > 0) {
            callback(remaining);
        }
    });
};

MyUtil.prototype.readlinesSync = function(filePath, options) {
    options = this.extend({
        encoding: 'utf-8'
    }, options);
    var content = fs.readFileSync(filePath, options);
    if (content) {
        return content.toString().split(/\r\n|\n/);
    }
};

MyUtil.prototype.sleep = function(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

MyUtil.prototype.varReplace = function(input, dic) {
    /// replace %VARIABLE_NAME% with dic[VARIABLE_NAME]
    ///

    var reg = /(%([a-zA-Z]*)%)/g,
        m;
    while ((m = reg.exec(input))) {
        if (m.index === m.lastIndex) {
            m.lastIndex++;
        }
        input = input.replace(m[1], dic[m[2]]);
    }
    return input;
};

MyUtil.prototype.log2 = function(x) {
    if (x <= 0) return NaN;
    return Math.log(x) / Math.LN2;
};


module.exports = new MyUtil();

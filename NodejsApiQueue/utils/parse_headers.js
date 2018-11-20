var parse_headers = function (headers, tag) {
    var searchStr = String(tag);
    var myJSON, obj;
    var result = [];
    var tagFind = false;
    myJSON = JSON.stringify(headers);
    obj = JSON.parse(myJSON);
    for (var l in obj) {
        if (obj.hasOwnProperty(l)) {
            if (l === tag) {
                result.push(l + ': ' + obj[l]);
                tagFind = true;
            }
        }
    }

    return result[0];
}

exports.parse_headers = parse_headers;
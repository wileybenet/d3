
// General Helper Functions

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function log10(val) {
    return Math.log(val) / Math.LN10;
}

function roundTo(num, zeros) {
    if (num < 100) {
        var x = Math.floor(num)*Math.pow(10,zeros||0);
        return x;
    } else {
        zeros = (zeros)?zeros+1:1;
        var x = roundTo(Math.floor(num/10), zeros);
        return x;
    }
}

// dd/mm/yyyy
function formatDate(arr) {
    arr = arr.split("/");
    var d = parseInt(arr[0]);
    var m = parseInt(arr[1]);
    var y = parseInt(arr[2]);
    if (d > 0) {
        return [m, d, y];
    } else if (m > 0) {
        return [m, null, y];
    } else {
        return [null, null, y];
    }
}

function getDate(num) {
    var y = Math.floor((num-1)/12);
    return [(num%12 == 0)?12:num%12, 1, parseInt(y)+1900];
}
function getNumFromDate(arr) {
    arr[0] = arr[0] || 1;
    return (arr[2]-1900)*12+((arr[0])?arr[0]:1);
}
var months = ["none",
            "Jan", "Feb", "Mar", "Apr", 
            "May", "Jun", "Jul", "Aug", 
            "Sept", "Oct", "Nov", "Dec"
        ];
function getReadableDate(arr) {
    return ((arr[0])?months[arr[0]]+" ":"")+((arr[1])?arr[1]+", ":"")+arr[2];
}
function getReadableMY(arr) {
    return '<div class="map-time-month">'+months[arr[0]]+'</div> '+arr[2];
}

function getPadding(id) {
    return {v:parseInt($(id).css("padding-top"))+parseInt($(id).css("padding-bottom")),
            h:parseInt($(id).css("padding-left"))+parseInt($(id).css("padding-right"))
        };
}
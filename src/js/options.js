$(document).ready(function(){
    chrome.storage.sync.get(null, function(config) {
        var dataObject = {};
        var datas = [];

        for (var key in config) {
            if (config.hasOwnProperty(key) && key.substring(0, 3) == 'day') {
                if (!dataObject[key.substring(3, key.length - 1)])
                    dataObject[key.substring(3, key.length - 1)] = {};
                dataObject[key.substring(3, key.length - 1)][key.substring(key.length - 1)] = config[key];
            }
        }

        for (var key in dataObject)
            if (dataObject.hasOwnProperty(key))
                datas.push({
                    date: dateFromDay(key),
                    Played: YTTGetDurationAsMinutes(dataObject[key]['R']),
                    Total: YTTGetDurationAsMinutes(dataObject[key]['T']),
                    Ratio: parseFloat(YTTGetDurationAsMinutes(dataObject[key]['R'])) / YTTGetDurationAsMinutes(dataObject[key]['T'])
                });

        datas = modifyForEach(datas, 'Ratio', function(v){return v * getMaxValue(datas, 'Total')});

        plot(datas);
    });
});

function modifyForEach(datas, key, modify){
    datas.forEach(function(data, index, array){
        data[key] = modify(data[key]);
        array[index] = data;
    });
    return datas;
}

function dateFromDay(str){
    var year = parseFloat(str.substring(str.length - 4));
    var day = parseFloat(str.substring(0, str.length - 4));
    var date = new Date(year, 0);
    date.setDate(day);
    return ("0" + date.getDate()).slice(-2) + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-" + date.getFullYear();
}

function getMaxValue(datas, key){
    var val = -9999999999999999999999;
    datas.forEach(function(data){
        if(data[key] && data[key] > val)
            val = data[key];
    });
    return val;
}

function plot(data){
    var margin = {top: 20, right: 80, bottom: 30, left: 50};
    var width = 1000 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    var parseDate = d3.time.format("%d-%m-%Y").parse;
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);
    var color = d3.scale.category10();
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");
    var line = d3.svg.line()
        //.interpolate("basis")
        .interpolate('linear')
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.time); });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

    data.forEach(function(d) {
        d.date = parseDate(d.date);
    });

    var times = color.domain().map(function(name) {
        return {
            name: name,
            values: data.map(function(d) {
                return {date: d.date, time: +d[name]};
            })
        };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));

    y.domain([
        d3.min(times, function(c) { return d3.min(c.values, function(v) { return v.time; }); }),
        d3.max(times, function(c) { return d3.max(c.values, function(v) { return v.time; }); })
    ]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Time (minutes)");

    var city = svg.selectAll(".times")
        .data(times)
        .enter().append("g")
        .attr("class", "times");

    city.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.name); })
        .attr("data-legend",function(d) { return d.name});

    city.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.time) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });
}
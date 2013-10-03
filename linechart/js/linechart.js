

function LineChart(options){
    var self = this;

    self.defaults = {scale:"linear", margin:{top: 20, right: 80, bottom: 30, left: 50}};
    self.options = _.extend(self.defaults, options);

    self.margin = self.options.margin;

    self._timeFormat = function(formats) {
        return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            return f[0](date);
        };
    };

    self.customTimeFormat = self._timeFormat([
        [d3.time.format("%Y"), function() { return d.getYear(); }],
        [d3.time.format("%b %d"), function(d) { return d.getMonth(); }],
        [d3.time.format("%b %d"), function(d) { return d.getDate() != 1; }],
        //[d3.time.format("%a %d"), function(d) { return d.getDay() && d.getDate() != 1; }],
        [d3.time.format("%I %p"), function(d) { return d.getHours(); }],
        [d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
        [d3.time.format(":%S"), function(d) { return d.getSeconds(); }],
        [d3.time.format(".%L"), function(d) { return d.getMilliseconds(); }]
    ]);    

    self.color = d3.scale.category10();
    self.xScale = d3.time.scale();
    self.yScale = d3.scale[self.options.scale]();

    self.line = d3.svg.line()
    	.interpolate("linear")
        .x(function(d){ return self.xScale(d[0]);})
        .y(function(d){ return self.yScale(d[1]);});

    self.xAxis = d3.svg.axis()
            .scale(self.xScale)
            .orient("bottom")
            .ticks(12)
            .tickFormat(self.customTimeFormat);

    self.yAxis = d3.svg.axis()
            .scale(self.yScale)
            .orient("left");

    self.setSVG = function(svgHtmlID){
        self.svg = d3.select("#"+svgHtmlID);
        var svgWidth = self.svg[0][0].clientWidth;// Only cares the first one
        var svgHeight = self.svg[0][0].clientHeight;
        self.width = svgWidth - self.margin.left - self.margin.right;
        self.height = svgHeight - self.margin.top - self.margin.bottom;
        self.xScale.range([self.margin.left, self.margin.left+self.width]);
        self.yScale.range([self.height + self.margin.top, self.margin.top]);
        self.xAxis.tickSize(-self.height);
    };

    self.getData = function(url, headline){
        if(self.url == url)
            return;
        self.url = url;
        d3.text(url, "text/plain",
            function(error, text){
                if(!error){
                    var data = d3.tsv.parseRows(text);
                    var dates = data.map(function(d){ return new Date(d[0]);});
                    self.paths = [];
                    _.each(headline, function(varname, i){
                        var values = data.map(function(d){return +d[i+1];});
                        var line = {"name": varname, "values": _.zip(dates, values).filter(function(dv){return dv[1]>0;})};
                        self.paths.push(line);
                    });                                
                    self.color.domain(headline);
                    self.xScale.domain(d3.extent(dates));
                    self.yScale.domain([ d3.min(self.paths, function(p){return d3.min(p.values, function(dv){return dv[1];})}),
                    					 d3.max(self.paths, function(p){return d3.max(p.values, function(dv){return dv[1];})})]);
                    $("body").trigger({
                        type:"dataready",
                        sender: self
                    });
                }
                else{
                    console.log(error);
                    self.paths = null;    
                }
            }
        );
    };

    self.render = function(){
        self.svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + self.height + ")")
		    .call(self.xAxis);

		self.svg.append("g")
		    .attr("class", "y axis")
		    .attr("transform", "translate(" + self.margin.left +", 0)")
		    .call(self.yAxis);

        var paths = self.svg.selectAll(".path")
            .data(self.paths)
            .enter().append("g")
            .attr("class", "path");

        paths.append("path")
            .attr("class", "line")
            .attr("d", function(d){ return self.line(d.values);})
            .style("stroke", function(d){ return self.color(d.name);});

        paths.append("text")
            .datum(function(d){ return {name: d.name, value:_.last(d.values)}; })
            .attr("transform", function(d){ return "translate(" + self.xScale(d.value[0]) + "," + self.yScale(d.value[1])})
            .attr("x", 3)
      		.attr("dy", ".35em")
            .text(function(d){ return d.name});

    };
}
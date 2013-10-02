function LineChart(options){
	var self = this;

	self.defaults = {scale:"linear"};
	self.options = _.extend(self.defaults, options);

	self.margin = {top: 20, right: 80, bottom: 30, left: 50};
	self.customTimeFormat = timeFormat([
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
    self.yScale = d3.scale[self.options.scale]()

    self.line = d3.svg.line()
    	.x(function(d){ return xScale(d[0]);})
    	.y(function(d){ return yScale(d[1]);});

    self.setSVG = function(svg){
    	self.svg = svg;    	
	    self.width = svg.width - self.margin.left - self.margin.right;
	    self.height = svg.height - self.margin.top - self.margin.bottom;


		self.xScale.range([0, self.width]);
		self.yScale.range([self.height, 0]);

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
					this.paths = [];
					_.each(headline, function(varname, i){
						var values = data.map(function(d){return +d[i+1];});
						var line = {"name": varname, values: _.zip(dates, values).filter(function(dv){return dv[1]>0;});}
						this.paths.push(line);
					});								
					self.color.domain(headline);
					self.xScale.domain(d3.extend(dates));
					self.yScale.domain([0, d3.max(self.paths, function(p){return d3.max(p.values, function(dv){return dv[1];})})]);
				}
				else{
					console.log(error);
					self.paths = null;	
				}
			}
		});
	};

	self.render = function(){



		var xAxis = d3.svg.axis()
		    .scale(xScale)
		    .orient("bottom")
		    .ticks(12)
		    .tickFormat(self.customTimeFormat);

		var yAxis = d3.svg.axis()
		    .scale(yScale)
		    .orient("left");

		var paths = svg.selectAll(".path")
			.data(self.paths)
			.enter().append("g")
			.attr("class", "path");

		paths.append("path")
			.attr("class", "line")
			.attr("d", function(d){ return self.line(d.values);})
			.style("stroke", function(d){ return self.color(d.name);});

		paths.append("text")
			.datam(function(d){ return {name: d.name, value:_.last(d.values)};})
			.attr("transform", function(d){ return "translate(" + self.xScale(d[0]) + "," + self.ySacle(d[1])})
			.attr("x", 3)
			.text(function(d){ return d.name});

	};
}
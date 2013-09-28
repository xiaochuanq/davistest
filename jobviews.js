/*
// Create chart object
var chart = new TimeLineView({

        var t0 = +timeRange[0], t1 = timeRange[1];
		jobLogs = _.filter(jobLogs, function(entry){ return patt.test(entry.jobName) && +entry.submitTime < t1 || +entry.endTime > t0; });
		
		jobLogs = _.groupBy(jobLogs, function(entry){return entry.jobName;});
*/


var TimeLineView = Backbone.View.extent({
	// The time chart like view
	defaults: {
    	margin: {top: 20, right: 20, bottom: 30, left: 40},
    	size:{entryHeight:20}
  	},

  	initialize: function() {
		//TODO: cache last query to improve performance.
		this.model.bind('change', this.onDataChange, this);

		this.jobLogs = [];
		this.beginDate = new Date("2013/09/05 00:00:00");
		this.endDate = new Date("2013/09/07 00:00:00");
		this.nameFilter = new RegExp("", "i");
		this.beginPos = 200;
		this.endPos = 1400;

		this.customTimeFormat = timeFormat([
			[d3.time.format("%Y"), function() { return d.getYear(); }],
			[d3.time.format("%b %d"), function(d) { return d.getMonth(); }],
			[d3.time.format("%b %d"), function(d) { return d.getDate() != 1; }],
			//[d3.time.format("%a %d"), function(d) { return d.getDay() && d.getDate() != 1; }],
			[d3.time.format("%I %p"), function(d) { return d.getHours(); }],
			[d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
			[d3.time.format(":%S"), function(d) { return d.getSeconds(); }],
			[d3.time.format(".%L"), function(d) { return d.getMilliseconds(); }]
		]);	

		this.svg = d3.select(this.el).append("svg").attr("width", 2000).attr("height", 1000);
	},

	events: {
        //'mouseenter .shape': 'hoveringStart',
        //'mouseleave': 'hoveringEnd',
        'keyup #nameFilter': 'updateNameFilter'
        'mouseup .viewport': 'dragEnd',
        'mousedown .viewport': 'dragStart',
        'mousemove': 'mouseMove',
        'click .job': 'showJobStatus',
		'change': 'updateView'
	},
	
	onDataChange: function(){
		this.jobLogs = this.model.getJobLog(this.beginDate, this.endDate, false);
		this.updateView(this.filterData());
	},
	
	updateNameFilter: function(){
		this.nameFilter =  new RegExp($("#nameFilter").val(), "i");
		this.updateView(this.filterDataByName( this.jobLogs, this.nameFilter) );
	},

	filterDataByName: function(jobLogs, nameFilter){
		return _.filter(jobLogs, function(entry){ return nameFilter.test(entry.jobName); });
	},
		
	updateTimeRange: function(dX){
		var beginTimeInMs =  +this.beginDate;
		var endTimeInMs =  +this.endDate;
		var timeDelta = endTimeInMs - beginTimeInMs;
		beginTimeInMs = beginTimeInMs - dX/(this.endPos - this.beginPos) * timeDelta;
		endTimeInMs = beginTimeInMs + timeDelta;
		this.beginDate.setTime(beginTimeInMs);
		this.endDate.setTime(endTimeInMs);
	},
	
	dragStart: function(e){
		this.dragging = true;
		this.initialX = e.pageX;
		return false; // prevents default behavior
	},

	dragEnd: function(){
		if(this.dragging) {
			var dX = e.pageX - this.initialX;
			this.updateTimeRange(dX);
			this.jobLogs = this.model.getJobLog(this.beginDate, this.endDate, true);
			this.updateView(this.filterData());
			this.dragging = false;
		}
	},

	mouseMove: function(){
		if (this.dragging) {
			var dX = e.pageX - this.initialX;
			this.updateTimeRange(dX);
			var jobLogs = this.model.getJobLog(this.beginDate, this.endDate, true);
			this.updateView(this.filterData());
		}
	},

	render: function(){
		/*
		var margin = this.options.margin;
	    this.width = this.$el.width() - margin.left - margin.right;
	    this.height = this.$el.height() - margin.top - margin.bottom;
		*/
		/*
	    this.svg = d3.select(this.el).append("svg")
	        .attr("width", this.width + margin.left + margin.right)
	        .attr("height", this.height + margin.top + margin.bottom)
	      	.append("g")
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		*/
		// Initialize view
		this.jobLogs = this.model.getJobLog(this.beginDate, this.endDate, true);
		this.updateView(this.filterData(this.jobLogs, this.nameFilter));
		return this;
	},
	
	updateView: function( jobLogs ){
		this.renderXAxis();
		var jobNames = _.pluck(jobLogs, "jobName").sort();
		this.renderYAxis(jobNames);
		var jobNameIdx = this.getIndexTable(jobNames);
		this.renderData(jobLogs, jobNameIdx);
	},

	getIndexTable: function(a){
		var tbl = {};
		_.each(a, function(v, i){ tbl[v] = i;});
		return tbl;
	},
	
  	getXScale: function() {
		return d3.time.scale()
					  .domain([this.beginDate, this.endDate])
					  .range([this.beginPos, this.endPos]);
  	},

	getYScale: function(jobNames) {
    	return d3.scale.ordinal().domain(jobNames);
  	},
	
	renderXAxis: function(){
	    var xAxis = d3.svg.axis()
	      			 .scale(this.getXScale())
			         .orient("top")
			         .ticks(72)
					 .tickFormat(this.customTimeFormat)
					 .tickSize(-400)
					 .tickPadding(10);
	    this.svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis);

	},
		
	renderYAxes: function(jobNames){
	    var yAxis = d3.svg.axis()
	      			  .scale(this.getYScale(jobNames))
	      			  .orient("left")
	      			  .tickSize(this.endPos - this.beginPos);
	    this.svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis);
	  },

	timeToPosition: function(t){
		return (+t - this.beginTime() ) / (+this.endTime - this.beginTime) * this.pixelPerMs + this.beginPos;
	},
	
	timeToDistance: function(t1, t2){
		return max(1, (t2 - t1) * this.pixelPerMs);
		
	},
	
	renderJobLogs: function(jobLogs, jobNameIdx) {
		/*
		var bands = svg.selectAll("rect").data(dataSet);
				bands.enter().append("rect");.attr("y", function(d){ return names.indexOf(d.name)*20 + 10; })
											.attr("width", function(d){ return  1 + (d.endTime.getTime() - d.startTime.getTime()) / 90000 ; })
											.attr("height", 16)
											.attr("fill", function(d){ return jobState2Color.map(d.state);});
											
				bands.attr("x", function(d){ return (d.startTime.getTime() - leftTime) / timeDelta * viewWidth + leftPos  ; })
											.attr("y", function(d){ return names.indexOf(d.name)* entryHeight + 10; })
											.attr("width", function(d){ return  1 + (d.endTime.getTime() - d.startTime.getTime()) / timeDelta * viewWidth ; })
											.attr("height", bandHeight)
											.attr("fill", function(d){ return jobState2Color.map(d.state);});
				bands.exit().remove();
		*/
		//first set svg height by number of jobs
		this.svg.attr("height", jobNameIdx.length * 20 + 200);
	
		var jobBlocks = this.svg.selectAll("g. job").data(jobLogs, function(d){return d.uid;});
		jobBlocks.selectAll("rect").remove();
		jobBlocks.enter().append("g. job");
		
		var self = this;
		jobBlocks.append("rect .queued").attr("x", function(d){return self.timeToPosition(d.submitTime);})
								.attr("y", function(d){ return jobNameIdx[d] * 20;});
								.attr("width",function(d){ return self.timeToDistance(d.submitTime, d.startTime? self.endTime);})
								.attr("height", 16);
		
		jobBlocks.append("rect").attr("x",)
								.attr("y",)
								.attr("width",)
								.attr("height",);
		
		jobBlocks.exit().remove();
		
	    this.svg.selectAll("g .job")
	        .data(this.mapData()) // { x: xAttr, y: yAttr }
	        .enter().append("rect")
	        .attr("class", "bar")
	        .attr("x", function(d) { return x(d.x); })
	        .attr("width", x.rangeBand())
	        .attr("y", function(d) { return y(d.y); })
	        .attr("height", function(d) { return chart.height - y(d.y); });
  	}
});
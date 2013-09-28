var VCJobLogModel = Backbone.Model.extend({

	initialize: function(){
		this._log_cache = {};
		this._filename_maker = d3.time.format( "./Jobs-%Y-%m-%d.tsv" );
		this.on("change", function(){alert("Data change");});
	},
		
	getJobLog: function(beginTime, endTime, syncServer){
		var self = this;
		var floorTime = d3.time.day.floor(beginTime);
		var ceilTime = d3.time.day.ceil(endTime); // Intentionally get the date after "now", since we need the latest information about the "running" jobs
		var dateRange = d3.time.day.range(floorTime, ceilTime);
		var jobLogs = {};
		var missedDates = [];
		dateRange.forEach(function(date){
			var dailyData = self._getCacheData(date);
			if(dailyData){
				// latest record about a run of job (indexed by uid) will overwrite the old one)
				_.extend(jobLogs, _.indexBy(dailyData, function(entry){return entry.uid;})); 
			}
			else{
				missedDates.push(date); // track data missed
			}
		});
		if(syncServer){
			var today = d3.time.day.floor( new Date());
			if( +_.last(missedDates) > +today){
				missedDates.pop();
				if(+_.last(missedDates) != +today)
					missedDates.push(today);
			}
			self._syncCacheData(missedDates);
		}
		return _.filter(_.values(jobLogs), function(entry){ return +entry.submitTime < endTime || +entry.endTime > beginTime; });
	},
	
	_getCacheData: function(date){
		var page = this._log_cache[date];
		if(page){
			page.lastRead = new Date();
			return page.content;
		}
		return null;
	},
	
	_syncCacheData: function(dates){
	// dates need to be sorted in ascending order
		var self = this;
		var q = queue(); // parallel downloading
		dates.forEach(function(d){
			q.defer(function(date, callback){
				d3.tsv(self._filename_maker(date),
					function(entry){ return {"name": entry.name, 
											 "vcName": entry.vcName,
											 "jobName": entry.jobName,
											 "uid": entry.uid,
											 "submitTime": new Date(entry.submitTime),
											 "startTime": entry.startTime ? new Date(entry.startTime) : null,
											 "endTime": entry.endTime ? new Date(entry.endTime) : null,
											 "state": entry.state,
											 }; },
					function(error, data){ 					
						var log = {};
						if( !error){		
							log[date] = {lastRead: new Date(), content: data};
						}
						else{
							console.log(error);
						}
						callback(null, log);
					}
				);
			}, d);
		});
		q.awaitAll( function(error, logs){
			// TODO: purge cache entries if oversized.
			logs.filter(function(log){ return !_.isEmpty(log);});
			_.sortBy(logs, function(log){ return +_.keys(log)[0];});
			logs.forEach( function(dailyLog){
				_.extend(self._log_cache, dailyLog);
			});
			if(logs.length > 0){
				self.trigger("change");
			}
		});
	}

});
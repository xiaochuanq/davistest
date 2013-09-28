var VCJobLogModel = Backbone.Model.extend({

	initialize: function(){
		this._log_cache = {};
		this._filename_maker = d3.time.format( "./Jobs-%Y-%m-%d.tsv" );
	},

	getJobData: function(timeRange/*, syncServer*/){
		var self = this;
		var floorTime = d3.time.day.floor(timeRange[0]);
		var ceilTime = d3.time.day.ceil(timeRange[1]); // Intentionally get the date after "now", since we need the latest information about the "running" jobs
		var dateRange = d3.time.day.range(floorTime, ceilTime);
		var jobLogs = {};
		//var missedDates = [];
		dateRange.forEach(function(date){
			var dailyData = self._getCacheData(date);
			if(dailyData){
				// latest record about a run of job (indexed by uid) will overwrite the old one)
				_.extend(jobLogs, _.indexBy(dailyData, function(entry){return entry.uid;})); 
			}
			/*
			else{
				missedDates.push(date); // track data missed
			}
			if(syncServer){
				self.syncJobData(missedDates);
			}*/
		});
		jobLogs = _.values(jobLogs);
		return jobLogs;
	},
	
	_getCacheData: function(date){
		// Return a page of logs as an array of vc job runs.
		var page = this._log_cache[date];
		if(page){
			page.lastRead = new Date();
			return page.content;
		}
		return null;
	},
	
	syncJobData: function(dates){
		var self = this;
		var q = queue();
		dates.forEach(function(d){
			d = d3.time.day.floor(d);
			q.defer(function(date, callback){
				d3.tsv(self._filename_maker(date),
					function(entry){ return {"name": entry.name, 
											 "vcName": entry.vcName,
											 "jobName": entry.jobName,
											 "uid": entry.uid,
											 "submitTime": new Date(entry.submitTime),
											 "startTime": new Date(entry.startTime),
											 "endTime": entry.endTime ? new Date(entry.endTime) : new Date(),
											 "state": entry.state,
											 }; },
					function(error, data){ 
						var log = {};
						if( !error){
							log[date] = {lastRead: new Date(), content: data}; callback(error, log);
						}
						else{
							console.log(error);
						}
						callback(null, log);// If error, simply return {} rather than throw exceptions
					}
				);
			}, d);
		});
		q.awaitAll( function(error, logs){
			// TODO: purge cache entries if oversized.
			logs.forEach( function(dailyLog){
				_.extend(self._log_cache, dailyLog);
			});
			// TODO: trigger data change event
		});
	}

});
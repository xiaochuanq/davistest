function DataCache(maxSize, baseURL, logFileFormat)
{
	var self = this;
	self._max_page = maxSize;
	self._filename_maker =  d3.time.format( baseURL + "/" + logFileFormat + ".tsv" );
	self._file_cache = new Object();
	
	self.getDataPage = function(date){
		
		var page = self._file_cache[date];
		if(page != undefined){
			page.lastRead = new Date();
			return page.content;
		}
		
		var q = queue(1); // Intentionally set parallelism as 1; this queue is merely for a blocking read
		q.defer( function(callback){
			d3.tsv(self._filename_maker(date),				
				function(d){ return d;}, // return new VCRun(d.uid, d.name, d.jobName, d.vcName, d.state, d.submitTime, d.startTime, d.endTime); },
				function(error, data){ callback(error, data); } );
		});
		
		var pageContent = null;
		q.await(function(error, data){
			console.log(error);
			if(data){
				var keys = Object.keys(self._file_cache);
				if( keys.length > self._max_page){
					// Purge least used data
					keys.sort();
					delete self._file_cache[keys[0]];
				}
				self._file_cache[date] = {lastRead: new Date(), content: data};
				pageContent = data;
			}			
		});
		return pageContent;
	}	
	
	self.getJobData = function(date){
		var page = self._file_cache[date];
		if(page != undefined){
			page.lastRead = new Date();
			return page.content;
		}
		else
			return null;
	}
	
	self.syncJobData=function(dates){
		var q = queue();
		dates.forEach(function(d){
			q.defer(function(date, callback){
				d3.tsv(self._filename_maker(date),
					function(entry){ return entry; },
					function(error, data){ var log = {}; log[date] = {lastRead: new Date(), content: data}; callback(error, log);}
				);
			}, d);
		});
		q.awaitAll( function(error, logs){
			logs.forEach( function(dailyLog){
				_.extend(self._file_cache, dailyLog);
			});
		});
	}
}
	
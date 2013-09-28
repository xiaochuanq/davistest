function DataCache(maxSize, baseURL, logFileFormat)
{
	var self = this;
	self._max_page = maxSize;
	self._filename_maker =  d3.time.format( baseURL + "/" + logFileFormat + ".tsv" );
	self._data_cache = new Object();
	
	self.getDataPage(date){
		var page = self._data_cache[date];
		if(page != undefined){
			page.lastRead = new Date();
			return page.content;
		}
		
		var q = queue(1); // Intentionally set parallelism as 1; this queue is merely for a blocking read
		date.forEach(function(){
			q.defer( function(callback){
				d3.tsv(self._filename_maker(date),				
					function(d){ return d;}, // return new VCRun(d.uid, d.name, d.jobName, d.vcName, d.state, d.submitTime, d.startTime, d.endTime); },
					function(error, data){ callback(error, data)} );
			});
		});
		
		var pageData = null;
		q.await(function(error, data){
			console.log(error);
			if(data){
				var keys = Object.keys(self._file_cache);
				if( keys.length > _max_page()){
					// Purge least used data
					keys.sort();
					delete self._file_cache[keys[0]];
				}
				self._file_cache[date] = {lastRead: new Date(), content: data};
			}
		});
		
		return page;
	}	
}
	
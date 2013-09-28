function VCRun(uid, name, jobName, vcName, state, submitTime, startTime, endTime)
{
	var self = this;
	self.uid = uid;
	self.name = name;
	self.jobName = jobName;
	this.vcName = vcName;
	this.state = state;
	this.submitTime = submitTime;
	this.startTime = startTime;
	this.endTime = endTime;
}

/*
function JobRecord(jobName)
{
	var self = this;

	self.name = jobName;
	self.vcRuns = ko.observableArray([]); // an array of uids
}
*/

function VCRunHistoryViewModel()
{
	var self = this;

	// Private Properties:
	self._allJobRecords = new Object();  // an assicative array
	self._allJobNames = new d3.set([]);	 // a set of names
	self._dataBeginDate = null; //[  inclusive, date at 00:00:00 AM
	self._dataEndDate = null;   // exclusive, date at 00:00:00 AM)

	// Public Properties: User input and controls
	var now = new Date();
	self.viewportEndTime = ko.observable(now);
	var yesterday = new Date(now.getTime() - 1000*3600*24);
	self.viewportBeginTime = ko.observable(yesterday);

	self.viewportJobNameFilter = ko.observable("");

	// Public Properties: Data to display
	self.viewportJobNames = ko.computed(function(d){
		var patt = new RegExp(self.viewportJobNameFilter(), "i");
		jobNames2Show = self._allJobNames.values().filter(function(d){
			return (patt.test(d));
		})
		return jobNames2Show;
	});

	self.viewableVCRuns = ko.computed(function(){
		if(_dataBeginTime == null || _dataEndTime == null){
			// Both are null means no data available
			// Assuming the two time boundaries are always set together
			// Maintain the state that the data available are chronically contiguous
			var floorTime = d3.time.day.floor(self.viewportBeginTime());
			var ceilTime = d3.time.day.ceil(self.viewportEndTime());
			self._getDataFromServer(floorTime, ceilTime);
		}
		else{
			if(self.viewportBeginTime() < self._dataBeginTime){
				// If the beginning time is earlier than the available date's 00:00:00
				self._getDataFromServer(d3.time.day.floor(self.viewportBeginTime()), self._dataBeginTime);
			}
			if(self.viewportEndTime() > self._dataEndTime){
				self._getDataFromServer(self._dataEndTime, d3.time.day.ceil(self.viewportEndTime()));
			}
		}
		return self._selectViewableVCRuns();
	});
	
	/* Our backend data puller guarantees
		1) Any data page starts from 00:00:00 AM
		2) Each page can end at any time on the same day
		3) Only the latest page of "today" has incomplete data
		4) New page is more accurate than old ones about job state.
	*/
	self._getData = function(beg, end)
	{ // [beg, end]
		
	}
	
	// Private Methods:
	self._getDataFromServer = function(floorTime, ceilTime){
		var dateRange = d3.time.day.range(floorTime, ceilTime);
		var makeFileName = d3.time.format("Jobs-%Y-%m-%d.tsv");
		dateRange.forEach(function(date){
			var fileName = makeFileName(date);
			d3.tsv(fileName, function(error, data){
				data.forEach(function(d){
					vcrun = new VCRun(d.uid, d.name, d.jobName, d.vcName, d.state, d.submitTime, d.startTime, d.endTime)
					// When put the new records into data pool, overwrite only if newly pulled entries are more updated than old ones.
					if(1){
						// TODO: How to avoid O(n^2) search here? - Use time to check first, and then search over uid.
					}
				});
			});
		}
		// If no errors until this point, update _dataBeginTime and _dataEndTime
		self._dataBeginTime = Math.min( self._dateBeginTime, floorTime);
		self._dataEndTime = Math.max( self._dataEndTime, ceilTime;
		//TODO: 1) prefetch data that is possibly needed
		//TODO: 2) if the _allData size is too big, remove those are invisible from the view port. Least used first.
	}
	
	self._selectViewableVCRuns() = function(){
		var jobNameList = self.viewableJobNames();
		return d3.values(self._allJobRecords).filter(function(r){ return jobNameList.has(r.jobName);})];
	}
}

ajaxData = [
            {
                uid: "12340",
                name: "app1",
                events: 
                [
                {
                    startTime: "2013/08/31 12:00:00",
                    endTime: "2013/08/31 12:45:00",
                    state: "succeed"
                },
                {
                    startTime: "2013/9/1 13:00:00",
                    endTime: "",
                    state: "running"
                }
                ],
                resources: []
            },
            {
                uid: "12341",
                name: "app2",
                events: [
                {
                    startTime: "2013/08/31 13:00:00",
                    endTime: "2013/08/31 14:00:00",
                    state: "canceled"
                },
                {
                    startTime: "2013/08/31 14:05:00",
                    endTime: "2013/08/31 14:45:00",
                    state: "failed"
                },  
                {
                    startTime: "2013/08/31 15:00:00",
                    endTime: "2013/08/31 16:45:00",
                    state: "succeed"
                }
                ],
                resources: []   
            },
            {
                uid: "12342",
                name: "app3",
                events:[],
                resources: []
            }
        ];



function Task(data) {
    this.title = ko.observable(data.title);
    this.isDone = ko.observable(data.isDone);
}

function TaskListViewModel() {
    // Data
    var self = this;
    self.tasks = ko.observableArray([]);
    self.newTaskText = ko.observable();
    self.incompleteTasks = ko.computed(function() {
        return ko.utils.arrayFilter(self.tasks(), function(task) { return !task.isDone() });
    });

    // Operations
    self.addTask = function() {
        self.tasks.push(new Task({ title: this.newTaskText() }));
        self.newTaskText("");
    };
    self.removeTask = function(task) { self.tasks.remove(task) };
    
    /*
    // Load initial state from server, convert it to Task instances, then populate self.tasks
    $.getJSON("/tasks", function(allData) {
        var mappedTasks = $.map(allData, function(item) { return new Task(item) });
        self.tasks(mappedTasks);
    }); 
*/
}

function Event(data){
    this.startTime = ko.observable(data.startTime);
    this.endTime = ko.observable(data.endTime);
    this.state = ko.observable(data.state);
}


function Application(data){
    this.name = ko.observable(data.name);
    this.uid = ko.observable(data.uid);
    this.events = ko.observableArray(data.events);
}


function TimelineViewModel(){
    this.startTime = ko.observable();
    this.apps = ko.observableArray([]);
    var mappedApps = $.map(ajaxData, function(item){return new Application(item)});
    this.apps(mappedApps);
}

// ko.applyBindings(new TaskListViewModel());
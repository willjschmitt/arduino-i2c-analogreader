define(['angularAMD','moment'],function(angularAMD,moment){
	angularAMD
	.service('timeSeriesSocket',function(){
		//message queue lets us queue up items while the socket is not currently open
		this._msgqueue = [];
		this._flushqueue = function(){ for (msg in this._msgqueue){this._socket.send(JSON.stringify(this._msgqueue[msg]))}; this._msgqueue = []; }
		
		//handle the fundamentals of creating and managing the websocket
		this._isopen=false;
		this._socket = new WebSocket("ws://localhost:8888/live/timeseries/socket/");
		this._socket.onopen = function(){
			this._isopen = true; this._flushqueue();
		}.bind(this);
		this._socket.onmessage = function(msg){
			var parsed = JSON.parse(msg.data);
			this._subscribers[parsed.sensor].newData([parsed]);
		}.bind(this);
		this._socket.onclose = function(){
	  		this._isopen=false;
		}.bind(this);
		
		//entry point for subscriptions to initiate the subscription
		this._subscribers = {};
		this.subscribe = function(subscriber){
			var self = this;
			$.post( "live/timeseries/identify/",{recipe_instance:subscriber.recipe_instance,name:subscriber.name}, function( data ) {
				subscriber.sensor = data.sensor;
				self._subscribers[subscriber.sensor] = subscriber;
				self._msgqueue.push({
					recipe_instance: subscriber.recipe_instance,
					sensor: subscriber.sensor,
					subscribe: true
				});
				if (self._isopen) self._flushqueue();
			});
		};
		//TODO: add websocket sending of data
		/*this.send = function(subscriber,value){}*/
	})
	.factory('timeSeriesUpdater',['timeSeriesSocket',function(timeSeriesSocket){
		var service = function(recipe_instance,name){
			this.recipe_instance = recipe_instance;
			this.name = name;
			
			this.errorSleepTime = 500;
			this.cursor = null;
			
			this.dataPoints = [];
			this.latest = null;
			
			var self = this;
			this.timeSeriesSocket = timeSeriesSocket;
			this.timeSeriesSocket.subscribe(self);
		}
	
		service.prototype.newData = function(dataPointsIn) {
		    for (var i = 0; i < dataPointsIn.length; i++) {
		    	var dataPoint = dataPointsIn[i];
		    	this.dataPoints.push([new Date(dataPoint.time),parseFloat(dataPoint.value)]);
		    	this.latest = dataPoint.value;//parseFloat(dataPoint.value);
		    }
		};
		
		service.prototype.set = function(value){
			var now = moment().toISOString();
			$.ajax({
    			url: "/live/timeseries/new/", type: "POST", dataType: "text",
    			data: $.param({
	    			recipe_instance: this.recipe_instance,
	    			sensor: this.sensor,
	    			value: value,
	    			time: now,
	    		})
	    	});
		};
	    
	    return service;
	}]);
});
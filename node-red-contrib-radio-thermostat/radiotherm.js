module.exports = function(RED) {
    
	
	
	function RadioThermostatNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		
		this.baseurl = config.IPAddr;
		
		this.on('input', function(msg) {
			
			
			this.url1 = this.baseurl + '/tstat';
			this.url2 = this.baseurl + '/sys/name';
			
			var http;
			http = require("http");
			var NumUrlsFinished = 0;
			msg.payload = "";             
			var test1 = "";
			var test2 = "";
			var httpCode = "";
				
			
			http.get(this.url1, function(res) {
				httpCode = res.statusCode;
				res.setEncoding('utf8');
				res.on('data', function(chunk) {
					test1 += chunk;
					console.log(test1);
				});
				res.on('end', function() {
					if (httpCode === 200) {
						NumUrlsFinished++;
						
						if (NumUrlsFinished >= 2){
							parseAndSend();
						}
					}
				});
			}).on('error', function(e) {
				node.error(e,msg);
			});
			
			
			
			http.get(this.url2, function(res) {
				httpCode = res.statusCode;
				res.setEncoding('utf8');
				res.on('data', function(chunk) {
					test2 += chunk;
					console.log(test2);
				});
				res.on('end', function() {
					if (httpCode === 200) {
						NumUrlsFinished++;
						
						if (NumUrlsFinished >= 2){
							parseAndSend();		
						}
					}
				});
			}).on('error', function(e) {
				node.error(e,msg);
			});

			
			function parseAndSend() {
				try {
					test1 = JSON.parse(test1);
					test2 = JSON.parse(test2);
					test1.name = test2.name;
					delete test1.time;
					delete test1.t_type_post;
					delete test1.override;
					msg.payload = test1;
					node.send(msg);
				} catch(err) {
					// Failed to parse, pass it on
					console.log(err);
				}
			};
			
            
        });
    }
    RED.nodes.registerType("radio-thermostat",RadioThermostatNode);
	
	
	function RadioThermostatNodeIn(config) {
        
		RED.nodes.createNode(this,config);
		
        var node = this;
		
		this.baseurl = config.IPAddr;
		
		this.on('input', function(msg) {
		
			var jsonData = {};
			config.setpoint = Number(config.setpoint);
			jsonData.tmode = Number(config.tmode);
			jsonData.fmode = Number(config.fanState);

			//only send a setpoint if it's valid

			if (config.setpoint != 0){
				//mode:heat
				if (jsonData.tmode == 1) {
					jsonData.it_heat = config.setpoint;
				}
				//mode: cool
				else if (jsonData.tmode == 2) {
					jsonData.it_cool = config.setpoint;
				}
				//mode: auto
				else if (jsonData.tmode == 3) {
					jsonData.it_cool = config.setpoint;
					jsonData.it_heat = config.setpoint;
				}				
			}
			
			var data = JSON.stringify(jsonData);
			var http = require("http");
			this.warn(data);
			
			var options = {
				host: '192.168.0.9',
				path: '/tstat',
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': Buffer.byteLength(data)
				}			  

			};
			
			var req = http.request(options, function(res) {
			  console.log('Status: ' + res.statusCode);
			  console.log('Headers: ' + JSON.stringify(res.headers));
			  res.setEncoding('utf8');
			  res.on('data', function (body) {
				console.log('Thermostat Response: ' + body);

			  });
			});
			req.on('error', function(e) {
			  console.log('problem with request: ' + e.message);
			});
			req.write(data);
			req.end();

			this.warn("Thermostat at " + this.baseurl + " set to mode: " + config.tmode + " with setpoint: " + config.setpoint + " and fan mode: " + config.fanState + ".");			
			
		});
		
	}
	RED.nodes.registerType("radio-thermostat in",RadioThermostatNodeIn);
}
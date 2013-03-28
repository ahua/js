/*
	Push API Address.
*/
var PUSH_DOMAIN = "https://pushservice.dolphin-browser.com";
var get_pushURL =  function(){
	if(CommInfo.push_domain) {
		return CommInfo.push_domain + "/data/1/sonar_conf";	
	}
	else {
		return PUSH_DOMAIN + "/data/1/sonar_conf";
	}
}
var getURL = function() {
	if(CommInfo.push_domain) {
		return CommInfo.push_domain + "/data/1/get_msg";
	}
	else {
		return PUSH_DOMAIN + "/data/1/get_msg";
	}
};
var listURL = function() {
	if(CommInfo.push_domain) {
		return CommInfo.push_domain + "/data/1/device/auth";
	}
	else {
		return PUSH_DOMAIN + "/data/1/device/auth";
	}
};
var affirmURL = function() {
	if(CommInfo.push_domain) {
		return CommInfo.push_domain + "/data/1/device/affirm";
	}
	else {
		return PUSH_DOMAIN + "/data/1/device/affirm";
	}
};	

var SONAR_PUSH_URL = "http://sonarpush.dolphin-browser.com/cometd";

/*
	Push Channels.
*/
var channel = {
	push: "/service/dolphin/tabpush",
	publish:"/meta/publish",
	device: "/service/dolphin/device",
	tab : "/service/dolphin/sync/tab",
	bookmark: "/service/dolphin/sync/desktop",	
	sonar:"/service/dolphin/sonar"
};

/*
	base64 encode/decode key
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
*/

/*
	Received message types.
*/
var RECV_MSG_TYPE={
	'join':0,
	'new':1,
	'del':2,
	'pub':3,
	'mod_dvc_nm':4,
	'remove':5
};

function Pusher(hickey)
{
	var _dev_id = hickey.userinfo.dev_id;
	var _dev_token = hickey.userinfo.token;
	
    var _connected = false;
    var _connectStatus = false;
	var auth_timeout_id = null;
	var _handshakeListener;
	var _subscribeListener;
	var _deviceList;
	var self = this;
	var connecting = false;
	var pushClientId = 0;
	var ext = "";
	
	var Subscribtion = {
		tab:null,
		bookmark:null,
		push:null,
		device:null,
		publish:null,
		connect:null
	};
	
	var Handler = {
		tab:tab_receive,
		bookmark:bookmark_receive,
		push:receive,
		publish:publish_callback
	};
	var _connect_num = 1;
	var _affirm_retry_num = 1;
	var self = this;
	_listener_cometd =null;

	this.setDevName = function(name) {
		hickey.userinfo.device_info.name = name;
	};
	
	this.isConnect = function()
	{
		return _connected;
	};
	
	this.isConnectingStatus = function()
	{
		return {connecting:connecting, retry_num: _connect_num};
	};
	
	this.ConnectStatus = function() {
		return _connectStatus;
	};
	
	/*
		When message pushed from push-server arrive, this function will be called.
		right now, there are 4 message type,[join, new ,del, pub]
	*/
	function receive(message)
	{
		var msg_type = RECV_MSG_TYPE[message.data.type];
		switch(msg_type)
		{
			case RECV_MSG_TYPE['join']:
				print_msg("[11][Push] push join has a response...");	
				if(message.data.data != '' && message.data.data != null){
					recv_join(JSON.parse(message.data.data));					
				}
				else {
					recv_join([]);
				}
				break;
			case RECV_MSG_TYPE['new']:
				recv_new(message);
				break;
			case RECV_MSG_TYPE['del']:
				recv_del(message);
				break;
			case RECV_MSG_TYPE['remove']:
				recv_remove(message);
				break;
			case RECV_MSG_TYPE['pub']:
				recv_pub(message);
				break;
			case RECV_MSG_TYPE['mod_dvc_nm']:
				recv_dev_rename(message);
				break;
			default:
				print_msg('unrecognize msg type');
		}
	}
	
	function publish_callback(message) {
		//print_msg(message);
		if(message.channel == channel.push && message.successful) {
			print_msg("[Push Message] message send ok.");
		}
		
		if(message.successful == false) {
			print_msg("[Push Message] message send failed.");	
			//self.disconnect();
			//self.login();
		}
	}
	
	function tab_receive(message) {
		print_msg("receive tab sync push message");
		var data = JSON.parse(message.data.data);
		hickey.handler.tab_sync(data[0].sid);
	}
	
	function bookmark_receive(message) {
		print_msg("receive bookmark sync push message");
		var data = JSON.parse(message.data.data);
		if(data[0].type == 64) {
			print_msg("type is 64");
			hickey.handler.bookmark_sync(data[0].sid);			
		}
	}
	
	/*
		After device join success, server will push a join message back.
		This message may include history data which is pushed to this device 
		when the device was offline.
	*/
	function recv_join(message)
	{
		print_msg("[12][Push] add listener...");	
		Subscribe(['push','publish']); 
		Subscribe(hickey.subscribe); 
		//self.syncChange(hickey.subscribe);
		
		
		//right now, push connect is successful, then display devices on main panel.
		_connected = true;
		
		if(hickey.handler.device_list != null)
		{
			hickey.handler.device_list(_deviceList);
		}
		
		print_msg("[13][Push] now main panel can show device list...");	
		
		//inform client that there are some old data on server, get it by data
		if(message.length > 0){
			getHistoryData(message);			
		}
		
		//if join success
		sync_control();
	}
	
	/*
		When a new device join.
	*/
	function recv_new(message)
	{
		//there is a new client coming, update the device list
		if(!_deviceList[message.data.device_id])
		{
			_deviceList[message.data.device_id] = message.data.device_info;
			
			var new_device={};
			new_device[message.data.device_id]=message.data.device_info;
			
			if(hickey.handler.device_add != null)
			{
				hickey.handler.device_add(new_device);
			}	
		}
	}
	
	function del_dev(dev_id)
	{
		if(_deviceList != null) {
			if(_deviceList[dev_id] != null) {
				delete _deviceList[dev_id];					
			}
		}
	}
	
	/*
		When a device is delete by this user.
	*/
	function recv_del(message)
	{
		if(message.data.del_id == _dev_id) {
			hickey.handler.logout();
			affirm_logout(1);
		}
		else {
			del_dev(message.data.del_id);
			if(hickey.handler.device_remove != null)
			{
				hickey.handler.device_remove(message.data.del_id);
			}		
		}
	}
	
	function recv_remove(message)
	{
		recv_del(message);
	}
	/*
		Normal push data receiver.
	*/
	function recv_pub(message)
	{
		//some client push data to me, show it! remeber decode it 
		//hickey.message_new_handler(jQuery.base64.decode(message.data.data));
		if(hickey.handler.receive_new != null)
		{
			var data = JSON.parse(message.data.data);
			if(data.push_type == 1 || data.push_type == 2) {
				print_msg('');
				hickey.handler.receive_new(data.push_data);				
			}
			else {
				print_msg("receive text:[%d]"+ data.push_data.title,data.push_type);
			}
		}
		try {
			_listener_cometd.publish(channel.push, {
				type : 'affirm',
				device_id : _dev_id,
				msgid : message.data.msgid,
				data : message.data.data
			});		
		}
		catch(e) {
			print_msg(e.message);
		}	
	}
	
	function recv_dev_rename(message)
	{
		if(hickey.handler.device_rename != null)
		{
			//if(message.data.device_info) {}
			hickey.handler.device_rename(message.data.target_id, JSON.parse(message.data.device_info));
		}
	}
	
	this.push = function(destination, pushData)
	{
		try{
			_listener_cometd.publish(channel.push, {
				type : 'pub', 
				device_id : _dev_id,
				dst_id : destination,
				//data : jQuery.base64.encode(pushData),
				data : pushData
			});		
		}
		catch(e) {
			print_msg(e);
			try {
				self.disconnect();
			}
			catch(e) {
				print_msg(e);
			}
			self.login();	
		}
	};

	this.remove = function(device_id)
	{
		del_dev(device_id);
		try {
			_listener_cometd.publish(channel.device, {
				type: 'del', 
				device_id: _dev_id,
				del_id: device_id
			});		
		}
		catch(e) {
			print_msg(e);
		}
	};
	
	this.rename = function(device_id,name,type)
	{
		hickey.userinfo.device_info.name = name;
		try {
			_listener_cometd.publish(channel.device, {
				type: 'mod_dvc_nm', 
				device_id: _dev_id,
				target_id: device_id,
				device_info:JSON.stringify({type:type, name:name})
			});
		}
		catch(e) {
			print_msg(e.message);
		}		
	};

	function getHistoryData(informDataData)
	{
		informData = {
			"token" : _dev_token,
			"device_id" : _dev_id,
			"msg_id_list" : informDataData
		};
		
		jQuery.ajax({
			url : getURL(),
			type : 'post',
			data :urlencode(informData),

			//call back function, get the old data
			success : function(message){
				if(message.status == 0)
				{				
					//do logic for message
					var pushData = [];
					for(key in message.data)
					{
						//pushData.push(jQuery.base64.decode(message.data[key]));
						//if data is null, error may occur, so, we need filter null object out.
						if(message.data[key] != null)
						{
							pushData.push(message.data[key]);
						}	
					}
					
					if(hickey.handler.receive_old != null)
					{
						hickey.handler.receive_old(pushData);
					}	
				}
			}
		});
	}

	function getDeviceList()
	{
		print_msg("[2][Push] getDeviceList...");
		//used for log statistic
		hickey.userinfo.device_info.browser = "chrome";
		var _auth_token = {
			"token" : _dev_token,
			"device_id" : _dev_id,
			"device_info" : hickey.userinfo.device_info
		};
		var msg_encode = urlencode(_auth_token);
		jQuery.ajax({
			url : listURL(),
			type : 'post',
			data : msg_encode,

			//call back function, get the old data
			success : function(message,status){
				print_msg("[3][Push] getDeviceList has response...");	
				if (status == 'success' && message.status == 0){
					print_msg("[4][Push]getDeviceList success ...");	
					_connect_num = 1;
					var device_state = message.data.device_state;
					if(device_state == 0) {
						
						hickey.handler.sync_setting(message.data.tab_sync_commit_delay*1000);
						_deviceList = message.data.device_list;
						if(message.data.ext != null) {
							ext = message.data.ext;
						}
						
						push_url = message.data.url;
						push_connect(push_url);						
					}
					else{
						print_msg("[5][Push] device is logout in webmanagement ...");	
						hickey.handler.logout();
						_affirm_retry_num = 1;
						affirm_logout(device_state);
					}
				}
				else
				{
					//if failed, will try 10 times.
					if(_connect_num < 1024){
						_connect_num = _connect_num *2;
						print_msg("retry get device list");
						auth_timeout_id = setTimeout(getDeviceList, 1000*_connect_num);
					}
					else{
						_connect_num = 1;
						_connected = false;
						connecting = false;
						print_msg("get device list failed.");
					}
				}
			},
			error: function() {
				//if failed, will try 10 times.
				if(_connect_num < 1024){
					_connect_num = _connect_num *2;
					print_msg("retry get device list");
					auth_timeout_id = setTimeout(getDeviceList, 1000*_connect_num);
				}
				else{
					_connect_num = 1;
					_connected = false;
					connecting = false;
					print_msg("get device list failed.");
				}				
			}
		});				
	}
	 
	function affirm_logout(state) {
		var _auth_token = {
				"token" : _dev_token,
				"device_id" : _dev_id,
				"device_state" : (state == null) ? 1 : state
		};
		
		var msg_encode = urlencode(_auth_token);	
		
		jQuery.ajax({
			url : affirmURL(),
			type : 'post',
			data : msg_encode,
			//call back function, get the old data
			success : function(message,status) {
				if (status == 'success'){
					if(message.status == 0) {
						//hickey.handler.logout();					
					}
				}
				else
				{
					//if failed, try again.
					if(_affirm_retry_num < 1024) {
						_affirm_retry_num = _affirm_retry_num*2;
						setTimeout(affirm_logout, _affirm_retry_num*1000);				
					}
					else {
						_affirm_retry_num = 1;
						print_msg("affirm logout failed");
					}
				}
			},
			error: function() {
				if(_affirm_retry_num < 1024) {
					_affirm_retry_num = _affirm_retry_num*2;
					setTimeout(affirm_logout, _affirm_retry_num*1000);				
				}
				else {
					_affirm_retry_num = 1;
					print_msg("affirm logout failed");
				}
			}
		});		
	}
	
	this.login = function()
	{ 		
		print_msg("[1][Push] login Start...");
		_connected = false;
		connecting = true;  
		_connect_num = 1;
		getDeviceList();
	};
	
	this.logLevel = function(level)
	{
		if(level == null) {
			level = 'debug';
		}
		
		_listener_cometd.configure({
            logLevel: level
        });		
	};
	
	function push_connect(push_url)
    {
    	_listener_cometd = new jQuery.Cometd();  
		print_msg("[6][Push] start push connect...");		

		push_debug = localStorage['DolphinBrowserPushLog'];
		logLevel = 'warn';
		if(push_debug != null) {
			logLevel = push_debug;
		}
		
		_listener_cometd.configure({
        	url: push_url,
            logLevel: logLevel
        });
		print_msg("[7][Push] start push handshake...");	
		var _handshakeListener = _listener_cometd.addListener('/meta/handshake', function (message) {
			print_msg("[8][Push] push handshake has response...");	
			if(message.successful)
		    {	
		    	print_msg("[9][Push] push handshake success...");	
		    	//if handshake success, connect is success.
		    	//_connected = true;
		    	pushClientId = message.clientId;
				//add device channel listener.
				Subscribtion.device = _listener_cometd.addListener(channel.device, receive);
				
				var sync_types = hickey.subscribe;
				var channel_types = channelName2TypeMapping(sync_types);
				
				print_msg("[10][Push] push start join...");	
				try {
					_listener_cometd.publish(channel.device, {
						type : "join",
						device_id : _dev_id,
						sync_channels : channel_types
					});					
				}
				catch (e) {
					print_msg(e);
				}

				//remove handshake listener.
				_listener_cometd.removeListener(_handshakeListener);
				
				Subscribtion.connect = _listener_cometd.addListener('/meta/connect', function(message){
					if(message.successful) {
						//Reference:[http://cometd.org/documentation/cometd-java/server/multipleclients]
						if(message.advice && message.advice['multiple-clients'] && message.advice['multiple-clients'] == true) {
							//fetch previous pushClientId and disconnect it.
							if(localStorage['DolphinBrowserPushClientid'] != null) {
								self.disconnect({"clientId":localStorage['DolphinBrowserPushClientid']});
								self.login();	
							}
						}
						else{
							_connectStatus = true;
							localStorage['DolphinBrowserPushClientid'] = 	pushClientId;
						}
					}
					else {
						_connectStatus = false;
						if(message.advice.reconnect=='retry') {
							//Server address may changed, auth again.
							if(message.advice.interval > 5000) {
								self.disconnect();
								self.login();							
							}
						}
						else {
							self.disconnect();
							self.login();
						}
					}
				});
		    }
			else {
				print_msg("[9][Push] push handshake failed...");	
				connecting = false;
				_connected = false;
				
				//remove handshake listener.
				//_listener_cometd.removeListener(_handshakeListener);
				//should restart handshake process?
				//_listener_cometd.handshake();				
			}
		});
		
		//start handshake.
        _listener_cometd.handshake({
			ext:{
				token: _dev_token,
				deviceid: _dev_id, 
				ext:ext
			}
		});
    }

	function channelName2TypeMapping(sync_types) {
		var channel_types = 0;
		for(var id in sync_types) {
			if(sync_types[id] == 'tab') {
				channel_types += 2;
			}
			else if(sync_types[id] == 'bookmark') {
				channel_types += 8;
			}
		}
		
		return channel_types;
	}
	
	/*
	 * Params:
	 * 		-config, ['tab', 'bookmark']
	 */
	unSubscribe = function(config) {
		if(_listener_cometd) {
			for(var id in config) {
				if(Subscribtion[config[id]] != null) {
					try{
						_listener_cometd.removeListener(Subscribtion[config[id]]);						
					}
					catch(e) {
						print_msg(e.message);
					}
					Subscribtion[config[id]] = null;
				}	
			}
		}
	}
	
	this.syncChange = function(current) {
		try {
			if(_listener_cometd) {
				var channel_types = 0;
				
				if(current != null) {
					channel_types = channelName2TypeMapping(current);		
				}
				
				_listener_cometd.publish(channel.device, {
					type: "mod_sync_channel",
					device_id: _dev_id,
					sync_channels: channel_types
				});
			}		
		}
		catch(e){
			print_msg(e.message);
		}
	}
	
	/*
	 * Params:
	 * 		-config, ['tab', 'bookmark']
	 */
	Subscribe = function(config) {
		for(var id in config) {
			if(Subscribtion[config[id]] == null) {
				try {
					Subscribtion[config[id]] = _listener_cometd.addListener(channel[config[id]], Handler[config[id]]);								
				}
				catch(e) {
					print_msg(e.message);
				}
			}
		}
	}

	this.disconnect = function(param)
	{
		if(_deviceList){
			_deviceList={};		
		}
		
		if(auth_timeout_id != null) {
			try{
				clearTimeout(auth_timeout_id);	
			}
			catch(e) {
				print_msg(e);
			}
			auth_timeout_id = null;
		}
		
		unSubscribe(['tab', 'bookmark', 'push', 'device','publish','connect']);
		self.syncChange();
		
		if(_listener_cometd) {
			try {
				if (param != null) {
					_listener_cometd.disconnect(param);			
				}
				else {
					_listener_cometd.disconnect();			
				}
			}
			catch(e) {
				print_msg(e.message);
			}
			_listener_cometd = null;	
		}	
		_connected = false;
		connecting = false;
		_connectStatus = false;
	};
}

/*
	Push module for sonar login
*/
function SonarPusher(hickey)
{
	var listener_cometd = new jQuery.Cometd();
	
	var handshakeListener =  null;
	var subscribeListener = null;
	var sendSubscribtion = null;	
	var _connect_num = 1;
	
	this.login = function()
	{
		push_connect(SONAR_PUSH_URL);		
	}
	
	function push_connect(server_url){
		push_debug = localStorage['DolphinBrowserPushLog'];
		logLevel = 'warn';
		if(push_debug != null) {
			logLevel = push_debug;
		}
      	listener_cometd.configure({
        	url: server_url,
            logLevel:logLevel
        });
        
		handshakeListener = listener_cometd.addListener('/meta/handshake', function(message){
		    if(message.successful)
		    {
				listener_cometd.removeListener(handshakeListener);
				sendSubscribtion = listener_cometd.addListener(channel.sonar, recv);
				listener_cometd.publish(channel.sonar, {
					type : "note",
					device_id : hickey.dev_id		    
				});	
		    }
			else {
				//should re-handshake?
			}
		});
		listener_cometd.handshake();
	};
	
	function recv(msg)
	{
		if(hickey.handler)
		{
			var user_info = msg.data.data;
			hickey.handler(JSON.parse(user_info));
		}		
	}    	
	
	this.disconnect = function()
	{		
		if(sendSubscribtion)
		{
			listener_cometd.removeListener(sendSubscribtion);
			sendSubscribtion = null;
		}
		
		if(listener_cometd)
		{
			listener_cometd.disconnect();	
			listener_cometd = null;
		}
	};		
}

var pusher= null;
var push_result_handler;
var target_device;
var retry_max = 10;
var retry_count = 0;
var lastReConnectTime = 0;
function push_init()
{
	var client_id = get_clientid(true);
	var subscribe= [];

	var setting = CommInfo.get_setting();
	if(setting.tab) {
		subscribe.push('tab');
	}
	if(setting.bookmark) {
		subscribe.push('bookmark');
	}
	
	pusher = new Pusher({
		userinfo:{
			dev_id:client_id,
			token:CommInfo.token,
			device_info:{
				type:2,
				name:get_devicename() == '' ? gen_devicename():get_devicename()
			}
		},
		handler:{
			device_list:device_list,
			device_add:device_add,
			receive_new:receive_new,
			receive_old:receive_old,
			device_rename:dev_rename_handler,
			push_success:push_success_handler,
			push_failed:push_failed_handler,
			device_remove:device_remove_handler,
			sync_setting:tabs_sync.setting,
			tab_sync:tab_sync_once,
			bookmark_sync:BookmarkSyncCtrl.sync,
			logout:logout_clear
		},
		subscribe:subscribe
	});
	pusher.login();
} 

/*
 *  For main panel reconnect.
 */
function pushReConnect(){
	var time_current = get_utc()/1000;
	if((time_current - lastReConnectTime) > 10) {
		if(pusher) {
			var connStatus = pusher.isConnectingStatus();
			if((connStatus.connecting == true && connStatus.retry_num > 1) || connStatus.connecting == false) {
				lastReConnectTime = time_current;
				pusher.disconnect();
				pusher.login();
			}
		}
	}
}

function changeSyncListener(setting) {
	if(pusher != null) {
		pusher.syncChange(setting);
	}
}

/*
	When receive remove push device message, remove the device from current device list.
*/
function device_remove_handler(device_id)
{
	var client_id = get_clientid(true);
	var devices = CommInfo.device_list;
	
	if(device_id != client_id)
	{
		//delete push devices.
		for(var idx in devices)
		{
			if(devices[idx].did == device_id)
			{
				//delete from device list
				devices.splice(idx,1);
				remove_menu(device_id);
				
				//delete tabs
				var tabs = CommInfo.tab_sync_list();
				for(var i in tabs) {
					if(device_id.indexOf(tabs[i].dev_id) != -1) {
						delete tabs[i];
						localStorage['DolphinBrowserSyncTabs'] = JSON.stringify(tabs);
						break;
					}
				}
				
				//delete shortcut
				var sc = CommInfo.get_device_shortcut();
				delete sc[device_id];
				CommInfo.save_device_shortcut(sc);
				
				if(CommInfo.popup_id != null)
				{
					//UI display
					var device_list = CommInfo.device_list;		
					CommInfo.popup_id.reflashPage(device_list, CommInfo.get_device_shortcut(), 'push');
					var tab_sync_list = CommInfo.tab_sync_list_sorted();
					CommInfo.popup_id.reflashPage(tab_sync_list, null, 'sync');
				}
				break;
			}
		}
		
		//reflresh userinfo page if exits.
		refresh_userinfo_page();
	}
	else
	{
		//suicide.
		logout_clear();
	}	
}

/*
	Check push connect status, if connect failed, try again later, otherwise stop check.
*/
function retry()
{
	if(pusher == null)
	{
		return;
	}	
	
	var connect = pusher.isConnect();
	if(connect)
	{
		return;
	}			
	else
	{
		print_msg('push connect failed!');
		pusher.disconnect();
		print_msg('push connect retry!');
		pusher.login();
		retry_count += 1;
		
		if(retry_count < retry_max)
		{
			setTimeout(retry,1000*15);
		}	
		else
		{
			retry_count = 0;
		}	
	}
}

function push_close()
{
	if(pusher != null)
	{
		pusher.disconnect();
		delete pusher;
		pusher = null;
	}
}

//push success, then display success on popup page.
function push_success_handler()
{
	//push_result_handler(target_device,'ok');
}

//push failed, then display failed on popup page.
function push_failed_handler()
{
	//push_result_handler(target_device,'failed');
}

/*
	data Format:
	{
		id:'f2578628-e092-4e1c-a472-5330a0dce63d',
		data:{
			title:'Baidu',
			url:'http://www.baidu.com'
		}
	}
*/

//push interface to display module.
function pushSend(device, display_callback)
{
	//push(device,null,true,1);
	chrome.tabs.query({highlighted:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
		//print_msg(tabs[0].url);	
		push(device, {title:tabs[0].title, url:tabs[0].url}, null, 1, null);
	});
}

/*
 	Rename device interface.
 	params:
 		- device_id:
 		- name:
 		- type
 */
function dev_rename(device_id,name,type)
{
	if (device_id == null) {
		device_id = get_clientid(true);
	}
	
	if(type == null) {
		type = 2;
	}
	
	if(pusher != null && pusher.isConnect()){
		//save in localstorage.
		save_devicename(name);
		pusher.rename(device_id,name,type);		
	}
	else{
		print_msg('rename failed');
	}
}

function dev_rename_test() {
	dev_rename(get_clientid(true), encodeURIComponent('rename test3'), 2);
}

/*
	push interface to push module.
	param:
		-id: device id,
		-msg: tab message {title:'baidu',url:'http://www.baidu.com'}
		-flag: passed with true means pushing from main panel, otherwise from rigth menu.
*/
function push(id, msg, flag, type, subtype)
{
	//check title and url length limit.
	if(type == 3) {
		if(getByteLength(msg.title) > 1000*2) {
			chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_FAIL});
			chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});
			return;		
		}
	}
	else{
		if(getByteLength(msg.title) > MAX_TITLE_LENGTH ||  getByteLength(msg.url) > MAX_URL_LENGTH) {
			chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_FAIL});
			chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});
			return;
		}	
	}
	
	//inject send overlayer.
	chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_ONGOING});		
	chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});

	var devs = CommInfo.device_list;
	var dev_t = 'PC';
	for(var idx in devs) {
		if(devs[idx].did == id) {
			if(devs[idx].category !='pc') {
				dev_t = 'Mobile';
			}
			break;
		}
	}
	
	//pusher is connected, and invoke push module push function
	if(pusher != null && pusher.isConnect() && pusher.ConnectStatus())
	{
		pusher.push(id, JSON.stringify({push_type:type,push_data:msg}));

		track_event({
			category:'push',
			action:'PC',
			label:dev_t,
			value:1
		},true);	
				
		switch(type)
		{
			case 1:
				if(subtype!=null && subtype == 0)
				{
					chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_DIRECTION});
					track_event({
						category:'Push to action',
						action:'Push',
						label:msg.title,
						value:1
					});						
				}
				else if(subtype!=null && subtype == 1){
					chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_APP});
					track_event({
						category:'Push to action',
						action:'Push',
						label:'app',
						value:1
					});	
				}
				else {
					chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_PAGE});	
					
					track_event({
						category:'Push to action',
						action:'Push',
						label:'tab',
						value:1
					});	
				}
				break;
			case 2:
				chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_IMAGE});
				track_event({
					category:'Push to action',
					action:'Push',
					label:'image',
					value:1
				});	
				break;
			case 3:
				chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_TEXT});
				track_event({
					category:'Push to action',
					action:'Push',
					label:'text',
					value:1
				});	
				break;
				
			default:
				chrome.tabs.executeScript(null, {code: INJECT_CODE.SEND_FAIL});
		}
		chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});
	}
	else //pusher is null or not connected, then show failed messsage
	{
		chrome.tabs.executeScript(null, {code: INJECT_CODE.NETWORK_ERROR});
		chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});
		
		//reconnect with push server.
		if(pusher == null) {
			push_init();
		}
		else {
			pusher.login();
		}
	}
}

/*
	Delete device from list
*/
function push_remove_device(id,success_handler,fail_handler)
{
	if(pusher != null)
	{
		for(var idx in CommInfo.device_list)
		{
			if(CommInfo.device_list[idx].did == id)
			{
				pusher.remove(id);
				CommInfo.device_list.splice(idx,1);
				remove_menu(id);		
				if(success_handler)
				{
					success_handler();
				}
				break;
			}
		}
		return;	
	}
	
	if(fail_handler)
	{
		fail_handler();
	}
}

/*
	msg format:	
	[
		{title:baidu,url:'http://www.baidu.com'},
		{title:google,url:'http://www.google.com'}
	]
*/
function receive_old(msg)
{
	print_msg("reve..."+msg);	
	var len = msg.length;
	for(var idx in msg)
	{
		var m = JSON.parse(msg[idx]);
		var data = m.push_data;
		chrome.tabs.create({
			url:data.url
		});
	}
	
	track_event({
		category:'Push to action',
		action:'stable',
		label:'recnum',
		value:len
	});	
					
	if(len > 1){		
		createNotification("Pages Received", "You have received " + len + " pages from other devices.");
	}
	else {
		createNotification("Page Received", "You have received " + len + " page from other devices.");
	}
}

/*
	msg format:
	{
		title:google,
		url:'http://www.google.com'
	}
*/
function receive_new(msg)
{	
	var m = msg;
	//create a new tab display the webpage identified by msg.url
	
	chrome.windows.getAll({populate:true}, function(wins){
		if(wins && wins.length > 0) {
		    	chrome.tabs.create({url: m.url},function(tab){
				var win_id = tab.windowId;
                                chrome.windows.get(win_id,null,function(win){
                                    if(win.state == 'minimized'){
			    	        chrome.windows.update(win_id, {state:"maximized",focused:true});
                                    }
                                    else {
			    	        chrome.windows.update(win_id, {focused:true});
                                    }
                                });
			});			
		}
		else{
			chrome.windows.create({url:m.url,focused:true,type:"normal"}, function(win){
				chrome.windows.update(win.id,{state:"maximized",focused:true});
			});
		}
	});
	
	track_event({
		category:'Push to action',
		action:'stable',
		label:'recnum',
		value:1
	});	
}

/*
 	msg format:
 	
 */
function dev_rename_handler(dev_id, info){
	//TODO
	var client_id = get_clientid(true);
	var devices = CommInfo.device_list;
	print_msg("rename handler start");
	//rename other device, not the current device.
	if(dev_id != client_id)
	{
		print_msg('receive device rename message');
		for(var idx in devices)
		{
			if(devices[idx].did == dev_id)
			{			
				var name_decode=info.name;
				devices[idx].deviceName = name_decode;
				rename_menu(dev_id, name_decode);
				
				//rename tabs;
				var tabs = CommInfo.tab_sync_list();
				for(var i in tabs) {
					if(dev_id.indexOf(tabs[i].dev_id) != -1) {
						tabs[i].name = name_decode;
						localStorage['DolphinBrowserSyncTabs'] = JSON.stringify(tabs);
						break;
					}
				}
				
				if(CommInfo.popup_id != null)
				{
					//UI display		
					CommInfo.popup_id.reflashPage(devices,CommInfo.get_device_shortcut(),'push');
					var tab_sync_list = CommInfo.tab_sync_list_sorted();
					CommInfo.popup_id.reflashPage(tab_sync_list,null,'sync');
				}
				//refresh userinfo page if exits.
				refresh_userinfo_page();
				break;
			}
		}
	}
	else
	{
		print_msg('current device rename push back');
		//No operation need
	}	
}

/*
	did : 'd1',
	category : 'phone',
	deviceName : 'iPhone' 

	devs format:
	[
		{'f2578628-e092-4e1c-a472-5330a0dce63d':{name:'Nexus',type:0}},
		{'e2578628-e092-4e1c-a472-5330a0dce62d':{name:'iphone',type:3}},
	]
*/

function device_list(devs)
{
	device_list_op(devs,true);
	
	//Refresh popup window.
	if(CommInfo.popup_id != null)
	{
		var device_list = CommInfo.device_list;
		print_msg("device_list");
		CommInfo.popup_id.reflashPage(device_list,CommInfo.get_device_shortcut(),'push');		
	}
	
	if(get_devicename() == ''){
		var name = gen_devicename();
		if(CommInfo.infoPage_id != null) {
			CommInfo.infoPage_id.reflashDeviceName(name);
		}
		dev_rename(get_clientid(true), name, 2);
	}
	refresh_userinfo_page();
}

/*
	dev format:
	{'f2578628-e092-4e1c-a472-5330a0dce63d':'0Nexus'}
*/
function device_add(dev)
{
	device_list_op(dev,false);
	//Refresh popup window.
	if(CommInfo.popup_id != null)
	{
		var device_list = CommInfo.device_list;		
		CommInfo.popup_id.reflashPage(device_list, CommInfo.get_device_shortcut(), 'push');
	}	
	//refresh userinfo page if exits.
	refresh_userinfo_page();
}

/*
	Add device to glocal device list
	Params:
		devs:array list of device,
		truncate:true/false, true will clear global devices, false will append device to global device list.
*/
function device_list_op(devs,truncate)
{
	if(truncate)
	{
		CommInfo.device_list.splice(0,CommInfo.device_list.length);
		removeall_menu();
	}
	
	var devs_add = [];
	for(var id in devs)
	{
		//filter out local device, local device should not be added in glocal device list.
		if(id  == get_clientid(true))
		{
			continue;
		}
		
		var dev = devs[id];
		
		//get device type,default is phone.
		var dev_json = JSON.parse(dev);
		
		var type = dev_json.type;
		var name = dev_json.name;
		if(type == null)
		{
			type = 0;
		}
		
		var category='phone';
		
		switch(type)
		{
			case 0:
			case 3:
				category='phone'; 
				break;
			case 1: 
			case 4:
				category='pad'; 
				break;
			case 2:
				category='pc'; 
				break;
		}
		var dev_info = {did:id,category:category,deviceName:name};
		devs_add.push(dev_info);	
		
	}
	
	CommInfo.device_list = CommInfo.device_list.concat(devs_add);
	set_default_shortcuts(CommInfo.device_list);
	for(var id in devs_add) {
		create_menu(devs_add[id], !truncate);
	}
}

/*
 *	By default, the first 2 device is ['Shift+X', 'Shift+Ctrl+X'] 
 */
function set_default_shortcuts(devs) {
	var sc = CommInfo.get_device_shortcut();
	var len = 0;
	
	for(var id in sc) {
		len ++;
	}
	
	//remove Shift X.
	if(len ==0 && devs.length > 0) {
		sc[devs[0].did] = ['Shift', 'Ctrl', 'X'];
	}
	
	/*	
	if(len == 0) {
		if(devs.length == 1) {
			sc[devs[0].did] = ['Shift', 'X'];
		}
		else if(devs.length >= 2){
			sc[devs[0].did] = ['Shift', 'X'];
			sc[devs[1].did] = ['Shift', 'Ctrl', 'X'];
		}
	}

	else if(len == 1) {
		if(devs.length >= 2) {
			//check shortcuts conflict
			if(sc[devs[0].did] && sc[devs[0].did].length == 2) {
				sc[devs[1].did] = ['Shift', 'Ctrl', 'X'];
			}
			else if(sc[devs[0].did]) {
				sc[devs[1].did] = ['Shift', 'X'];
			}
		}
	}
	*/	
	CommInfo.save_device_shortcut(sc);
}

/*
	after all other module is loading, this function will be called.
*/
check_login_status();


/*
 	Params:
 		-message:
 			{
 				type: one of "dev_data", "map", "itunes_app"
 			}
 */
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
	
	var type =  message.type;
	var data = message.data;

	if(type == 'map'){
		print_msg("send "+type);
		if(!CommInfo.is_login) {
			sendResponse({status:1});   //1 stands for not login
			return;
		}
		var setting = CommInfo.get_setting();
		if(!setting['button']) {
			sendResponse({status:2});	// 2 stands for button not be enabled.
			return;
		}
		
		sendResponse({status:0});
		push(data.dev_id, {title:data.title, url:data.url}, false, 1, 0);
	}
	else if(type == 'appstore'){
		if(!CommInfo.is_login) {
			sendResponse({status:1});
			return;
		}
		var setting = CommInfo.get_setting();
		if(!setting['button']) {
			sendResponse({status:2});
			return;
		}
		
		sendResponse({status:0});
		push(data.dev_id, {title:data.title, url:data.url}, false, 1, 1);
	}
	else if(type == 'dev_data') {
		sendResponse(CommInfo.get_mobile_devs());
	}
	else if(type == 'buttonsetting') {
		var setting = CommInfo.get_setting();
		sendResponse(setting['button']);
	}
	else if(type == 'shortcuts') {
		var keys = data;
		var dev_keys = CommInfo.get_device_shortcut();
		
		for(var idx in dev_keys) {
			if(keys.length == dev_keys[idx].length) {
				var match = true;
				for(var id in keys) {
					if(keys[id] != dev_keys[idx][id]) {
						match = false;
						break;
					}
				}
				if(match) {			
					print_msg("match"+idx);
					pushSend(idx);
					track_event({
						category:'other',
						action:'shortcutspush',
						label:'shortcutspush',
						value:1
					});	
					break;
				}
			}
		}
	}
	else if(type == 'clicktarget') {
		var target = data;
		CommInfo.clickTarget = target;
	}
});

var DOMAIN_ID = "https://sen.dolphin-browser.com/";
var DOMAIN_ID_CHECK = ["http://sen.dolphin-browser.com/","https://sen.dolphin-browser.com/"];
var DOMAIN_SYNC = "https://sen.dolphin-browser.com";
var DOMAIN_PUSH = "https://pushservice.dolphin-browser.com";
var DOMAIN_SONAR = "http://vcen.dolphin-browser.com/";

var API={
	signup:DOMAIN_ID + "accounts/signup/",
	auth:DOMAIN_ID + "api/2/user/auth",
	info:DOMAIN_ID + "api/2/user/info",
	loginresult:[DOMAIN_ID_CHECK[0] + "accounts/2/loginresult",DOMAIN_ID_CHECK[1] + "accounts/2/loginresult"],
	//logout:DOMAIN_ID + "api/2/user/logout",
	validate_token:DOMAIN_ID + "api/2/user/validatetoken",
	
	sync_create:function() { 
		if(CommInfo.region_domain) {
			return CommInfo.region_domain + "/api/1/sync/create";
		}
		else {
			return DOMAIN_SYNC + "/api/1/sync/create"; 
		}
	},
	sync_update: function() {
		if(CommInfo.region_domain) {
			return CommInfo.region_domain + "/api/1/sync/update";
		}
		else {
			return DOMAIN_SYNC + "/api/1/sync/update";
		}
	},
	sync_getchunk: function() {
		if(CommInfo.region_domain) {
			return CommInfo.region_domain + "/api/1/sync/getchunk";
		}
		else {
			return DOMAIN_SYNC + "/api/1/sync/getchunk";
		}
	},
	sync_state: function() {
		if(CommInfo.region_domain) {
			return CommInfo.region_domain + "/api/1/sync/state";
		}
		else {
			return DOMAIN_SYNC + "/api/1/sync/state";
		}
	},
	sonar_command:DOMAIN_SONAR+"api/voice/1/getPhrase",
	sonar_query:DOMAIN_SONAR+"api/1/sonarconnect/query_connect",
	
	logout: function() {
		if(CommInfo.push_domain) {
			return CommInfo.push_domain + "/data/1/device/logout";
		}
		else {
			return DOMAIN_PUSH + "/data/1/device/logout";	
		}
	}
};

var SID = {
	current : 0,
	ongoing : 0
};


/*
	Get user id
*/
function API_validate_token()
{
	var method = "POST";
	var url = API.validate_token;
	var headers={"Content-Type":"application/json"};
	var data={'token':CommInfo.token};
	var body = urlencode(data);
	var callback=CALLBACK_validate_token;
	sendRequest(method, url, headers, body, callback);
}

/*
	Callback of API_validate_token.
	Params:
		xhr:XMLHttpRequest.
*/
function CALLBACK_validate_token(xhr)
{
	if(xhr.readyState == 4 && xhr.status === 200)
	{
		var resp = JSON.parse(xhr.responseText);
		if(resp.status == 0) 	//connect success
		{
			CommInfo.user_id  = resp.data.user_id;
			save_user_login_info();
			setBelugaCode(CommInfo.user_id);
		}
	}	
}

/*
	Get sync state
*/
function API_sync_state()
{
	track_event({
		category:'general',
		action:'TabSync',
		label:'trigger',
		value:1
	});		
	
	var method = "POST";
	var url = API.sync_state();
	var headers={"Content-Type":"application/json","ClientVersion":"chromeExtv1.0"};
	var data={'token':CommInfo.token};
	var body = urlencode(data);
	var callback=CALLBACK_save_latest_sync_id;
	sendRequest(method, url, headers, body, callback);
}

/*
	Callback of API_sync_state.
	Params:
		xhr: XMLHttpRequest
*/
function CALLBACK_save_latest_sync_id(xhr)
{
	if(xhr.readyState == 4 && xhr.status === 200)
	{
		var msg = xhr.responseText;
		if(msg.length > 0)
		{
			var resp = JSON.parse(xhr.responseText);
			if(resp.status == 0) 	//connect success
			{	
				//tab
				var latest_sid = resp.data.latest_tab_sid;
				var	after_sid = CommInfo.after_sid();	
				var tab_sid	= 0;		
				if(after_sid['tab'] == null) {
					tab_sid = 0;
				}
				else {
					tab_sid = after_sid['tab'];
				}
				
				if(tab_sid < latest_sid)
				{
					SID.current = tab_sid;
					SID.ongoing = tab_sid;
					API_sync_getchunk({type:'tab',latest_sid:latest_sid});
					CommInfo.delete_tabs.splice(0,CommInfo.delete_tabs.length);
				}
				else
				{
					get_open_tabs();
				}
			}
			else
			{
				track_event({
					category:'general',
					action:'TabSync',
					label:'fail',
					value:1
				});	
				print_msg("sync failed.");
				//showNotification('Sync Failed','Sync failed!');
			}
		}
		else
		{	
			track_event({
				category:'general',
				action:'TabSync',
				label:'fail',
				value:1
			});	
			print_msg("sync failed.");
			//showNotification('Sync Failed','Sync failed!');
		}
	}
	else if(xhr.readyState == 4 && xhr.status != 200) {
		track_event({
			category:'general',
			action:'TabSync',
			label:'fail',
			value:1
		});			
	}	
}

/*
	Send get chunk request.
	Params:
		context:sync item information, json dict
*/
function API_sync_getchunk(context)
{		
	var data = {};
	var token = CommInfo.token;
	var after_sid = SID.ongoing;//CommInfo.after_sid()[context.type];
	var latest_sid = context.latest_sid;
	var limit = latest_sid - after_sid;
	var type = get_type(context);
	
	data.token=token;
	data.after_sid = after_sid;
	data.limit = limit>20?20:limit;
	data.type = type;
	data.cid = get_clientid(false);
	
	if(SID.current == 0) {
		data.no_deleted = 1;
	}
	
	var method = "POST";
	var url = API.sync_getchunk();
	var headers={"Content-Type":"application/json"};	
	var body=urlencode(data);
	var callback = CALLBACK_getchunk;
	
	sendRequest(method, url, headers, body, callback);
}

/*
	Callback of getchunk.
	This function save the obj get from server to local storage,
	if get chunk is not finish, getchunk will be called again.
	
	Params:
		xhr: XMLHttpRequest.
*/
function CALLBACK_getchunk(xhr)
{
	if(xhr.readyState == 4 && xhr.status === 200)
	{
		var resp = JSON.parse(xhr.responseText);
		if(resp.status == 0) 	//connect success
		{	
			//tab
			var latest_sid = resp.data.latest_sid;
			var chunk_latest_sid = resp.data.chunk_latest_sid;
			var updated_objs = resp.data.updated_objs;
			
			CommInfo.delete_tabs = CommInfo.delete_tabs.concat(resp.data.deleted_ids);
			
			var tabs = CommInfo.tab_sync_list();
			for(var idx in updated_objs)
			{
				var updated_obj = updated_objs[idx];
				//Device having no tab will be filtered out.  
				
				if(updated_obj.payload && updated_obj.payload.tabs)
				{
					if(updated_obj.payload.tabs.length > 0) {
						tabs[updated_obj._id] = {name:updated_obj.payload.name, data:updated_obj.payload.tabs, sid:updated_obj.sid, dev_id:updated_obj.cid};
					
						if(updated_obj.payload.hasOwnProperty('devicetype'))
						{
							tabs[updated_obj._id].dev_type = updated_obj.payload.devicetype;
						}
					}
					else {
						//if update device has no tabs, delete it from localStorage.
						if(tabs.hasOwnProperty(updated_obj._id)) {
							delete tabs[updated_obj._id];
						}
					}
				}
			}
			
			//save other device sync result to localStorage, which will be displayed in index.html later.
			localStorage['DolphinBrowserSyncTabs'] = JSON.stringify(tabs);
			
			if(chunk_latest_sid < latest_sid)
			{
				SID.ongoing = chunk_latest_sid;
				API_sync_getchunk({type:'tab',latest_sid:latest_sid});
			}
			else
			{
				SID.current = chunk_latest_sid;
				SID.ongoing = chunk_latest_sid;
				
				var after_sid = CommInfo.after_sid();
				
				//get tab after_sid
				after_sid['tab'] = chunk_latest_sid;
				
				//save after_sid
				var after_sid_str = localStorage['DolphinBrowserAfterSid'];
				var after_sid_json;
				if(after_sid_str != null && after_sid_str != "")
				{
					after_sid_json = JSON.parse(after_sid_str);
				}
				else
				{
					after_sid_json={};
				}
				
				after_sid_json[CommInfo.user_name] = after_sid;
				localStorage['DolphinBrowserAfterSid'] = JSON.stringify(after_sid_json);
				
				for(var i in CommInfo.delete_tabs)
				{
					CommInfo.tab_sync_list_remove(CommInfo.delete_tabs[i]);
				}
				
				//Refresh popup window.
				if(CommInfo.popup_id != null)
				{
					var tab_sync_list = CommInfo.tab_sync_list_sorted();					
					CommInfo.popup_id.reflashPage(tab_sync_list, null, 'sync');
				}
				get_open_tabs();
			}
		}
		else
		{
			track_event({
				category:'general',
				action:'TabSync',
				label:'fail',
				value:1
			});	
			print_msg("sync failed.");
		}
	}	
	else if(xhr.readyState == 4 && xhr.status != 200) {
		track_event({
			category:'general',
			action:'TabSync',
			label:'fail',
			value:1
		});			
	}	
}

/*
	Update the device current open tabs 
	Params:
		sync_id:user sync_id
*/
function API_tab_sync_update(sync_id)
{
	var method = "POST";
	var url = API.sync_create();
	var headers={"Content-Type":"application/json"};	
	
	var data={"type":2,"folder":0,"order":1, "pid":"", "cid":get_clientid(false),"_id":sync_id,"deleted":0};
	var payload={"name":get_devicename(),"tabs":CommInfo.cur_tab_list,'devicetype':2};
	data.payload=payload;
	var body={'token':CommInfo.token,'data':[data], "device_id":get_clientid(true)};
	var body_encode=urlencode(body);
	var callback = CALLBACK_save_tab_id;
	sendRequest(method, url, headers, body_encode, callback, data.type);
}

/*
	Display sync notification.
	Params:
		xhr: XMLHttpRequest.
*/
function sync_finish_notify(xhr)
{
	if(xhr.readyState == 4 && xhr.status === 200)
	{
		var resp = JSON.parse(xhr.responseText);
		if(resp.status == 0)
		{
			//showNotification('Sync Complete','Sync complete!');
		}
		else
		{
			//showNotification('Sync Failed','Sync failed!');
		}
	}
}	

/*
	Create a new tab id, this means first sync for this device.
*/
function API_tab_sync_create()
{
	var method = "POST";
	var url = API.sync_create();
	var headers={"Content-Type":"application/json"};	
	var data={"type":2,"folder":0,"order":1, "pid":"", "cid":get_clientid(false),"deleted":0};
	var payload={"name":get_devicename(),"tabs":CommInfo.cur_tab_list,'devicetype':2};
	data.payload=payload;
	var body={'token':CommInfo.token,'data':[data],"device_id":get_clientid(true)};
	var body_encode=urlencode(body);
	var callback = CALLBACK_save_tab_id;
	sendRequest(method, url, headers, body_encode, callback);
}

/*
	Save sync id to local storage
	Params:
		xhr: XMLHttpRequest.
*/
function CALLBACK_save_tab_id(xhr)
{	
	if(xhr.readyState == 4 && xhr.status === 200)
	{
		var resp = JSON.parse(xhr.responseText);
		if(resp.status == 0) 	//connect success
		{	
			var tab_sync_id = resp.data[0]._id;
			var sync_id_s = {};
			sync_id_s[CommInfo.user_name] = tab_sync_id;
			localStorage.setItem("DolphinBrowserTabSyncId", JSON.stringify(sync_id_s));	
			set_normal_ico();
			showNotification('Sync Complete','Sync complete!');
			track_event({
				category:'general',
				action:'TabSync',
				label:'success',
				value:1
			});	
		}
		else
		{
			track_event({
				category:'general',
				action:'TabSync',
				label:'fail',
				value:1
			});	
			set_normal_ico();
			showNotification('Sync Failed','Sync failed!');
		}
	}
	else if(xhr.readyState == 4 && xhr.status != 200) {
		track_event({
			category:'general',
			action:'TabSync',
			label:'fail',
			value:1
		});			
	}	
}

/*
	Get sync item type number
	Params:
		context: sync item information
*/
function get_type(context)
{
	if(context.type == 'bookmark')
		return 64;
	else if(context.type == 'tab')
		return 2;
	else if(context.type == 'history')
		return 4;
}

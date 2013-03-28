var CommInfo = {
    client_version:"chromeExtv1.0",
    first_login:false,
    sync_first:true,
    infoPage_id: null,
    popup_id:null,
    login_win_id:null,
    logining:false,
    auth_tab_id:null,
    token:null,
    user_id:null,
    user_name:'',
    nick_name:'',
    login_type:0,
    login_typeName:'dolphin',
    is_login:false,
    context_menu_id:null,
    context_image_menu_id:null,
    context_select_menu_id:null,
    sync_time_id:null,
    sonar_cmd:'Go Dolphin',
    menuid_map:{},
    delete_tabs:[],
    delete_bookmarks:[],
    cur_tab:null,
    cur_tab_list:[],
    device_list:[],
    get_mobile_devs: function() {
	var devs = [];
	for(var id in CommInfo.device_list) {
	    if(CommInfo.device_list[id].category != 'pc') {
		devs.push(CommInfo.device_list[id]);
	    }
	}
	return devs;
    },
    get_setting: function() {
	var setting  = localStorage['DolphinBrowserSetting'];
	if(setting == null || setting == '' || setting == '{}') {
	    var setting = {bookmark:false,tab:true,button:true};
	    var user_setting = {};
	    user_setting[CommInfo.user_name] = setting;
	    localStorage['DolphinBrowserSetting']= JSON.stringify(user_setting);
	    return setting;
	}
	var setting_json = JSON.parse(setting);
	if(setting_json[CommInfo.user_name] == null){
	    setting_json[CommInfo.user_name] = {bookmark:false,tab:true,button:true};
	    localStorage['DolphinBrowserSetting'] = JSON.stringify(setting_json);
	}
	return setting_json[CommInfo.user_name];
    },
    save_setting: function(setting){
	var settings  = localStorage.getItem('DolphinBrowserSetting');
	if(settings == null || settings == '' || settings == '{}') {
	    var user_setting = {};
	    user_setting[CommInfo.user_name] = setting;
	    localStorage['DolphinBrowserSetting']= JSON.stringify(user_setting);
	}
	else{
	    var setting_json = JSON.parse(settings);
	    setting_json[CommInfo.user_name] = setting;
	    localStorage['DolphinBrowserSetting'] = JSON.stringify(setting_json);
	}
	
	var sync_items = [];
	if(setting.tab) {
	    sync_items.push('tab');
	}
	//if(setting.bookmark) {
	//    sync_items.push('bookmark');
	//}
	changeSyncListener(sync_items);
    },
    get_device_shortcut: function() {
	var shortcuts = localStorage['DolphinBrowserPushShortcuts'];
	if(shortcuts == null || shortcuts == '') {
	    var keys={};
	    return keys;
	}
	else{
	    var data  = JSON.parse(shortcuts);
	    return data;
	}
    },
    save_device_shortcut: function(dev_shortcuts){
	/*
	  shortcuts format:
	  {
	  'dev1':['ctrl','alt','x'],
	  'dev2':['shift','y'],
		  }
	*/
	var shortcuts = dev_shortcuts;
	localStorage['DolphinBrowserPushShortcuts'] = JSON.stringify(shortcuts);
    },
    bookmark_sync_list:[],
    //other device push tab list
    tab_push_list:function(){
	var pushs = localStorage.getItem('DolphinBrowserPushTabs');
	//if no pushs,return a blank list.
	if(pushs == null || pushs == '')
	{
	    return [];
	}
	else
	{
	    var data = JSON.parse(pushs);
	    if(CommInfo.user_name != null && data[CommInfo.user_name])
	    {
		return data[CommInfo.user_name];
	    }
	    else
	    {
		return [];
	    }
	}
    },
    save_push_tabs:function(tabs)
    {
	var push_save = localStorage.getItem('DolphinBrowserPushTabs');
	if(push_save != null && push_save != '')
	{
	    var push_save_json = JSON.parse(push_save);
	}
	else
	{
	    var push_save_json = {};
	}
	push_save_json[CommInfo.user_name] = tabs;
	localStorage['DolphinBrowserPushTabs']  = JSON.stringify(push_save_json);
    },
    //other device sync tab list
    tab_sync_list:function(){
	var tabs = localStorage.getItem('DolphinBrowserSyncTabs');
	if(tabs == null || tabs =='')
	{
	    return {};
	}
	else
	{
	    var data = JSON.parse(tabs);
	    return data;
	}
    },
    tab_sync_list_sorted:function(){
	var sync_list = CommInfo.tab_sync_list();
	var sorted_list = [];
	for(var key in sync_list)
	{
	    sorted_list.push({id:key, data:sync_list[key]});
	}
	if(sorted_list.length > 0)
	{
	    sorted_list.sort(function(a,b){return parseInt(b.data.sid) - parseInt(a.data.sid);});
	}	
	return sorted_list;
    },
    tab_sync_list_remove:function(id){
	var sync_list = CommInfo.tab_sync_list();
	if(sync_list.hasOwnProperty(id))
	{
	    delete sync_list[id];
	    localStorage['DolphinBrowserSyncTabs'] = JSON.stringify(sync_list);
	}
    },
    get_all_devices:function()
    {
	//clear the devices
	var all_devices={};
	
	//merge sync and push device according device_id
	var sync_devices = CommInfo.tab_sync_list();
	var push_devices = CommInfo.device_list;
	
	for(var idx in push_devices)
	{
	    var dev_id;
	    
	    var colon_idx = push_devices[idx].did.indexOf(':');
	    if(colon_idx != -1)
	    {
		dev_id = push_devices[idx].did.substring(0,colon_idx);
	    }
	    else
	    {
		//this condition should not occur,just for safe.
		dev_id = push_devices[idx].did;
	    }
	    
	    var info = {category:push_devices[idx].category, deviceName:push_devices[idx].deviceName};			
	    all_devices[dev_id]=info;
	}
	
	for(var idx in sync_devices)
	{
	    var dev_id = sync_devices[idx].dev_id;
	    if(all_devices.hasOwnProperty(dev_id))
	    {
		continue;
	    }
	    else
	    {
		var info = {deviceName:sync_devices[idx].name};
		if(sync_devices[idx].hasOwnProperty('dev_type'))
		{
		    switch(sync_devices[idx].dev_type)
		    {
		    case 0:	info.category = 'phone'; 	break;
		    case 1:	info.category = 'pad'; 		break;
		    case 2: 	info.category = 'pc'; 		break;	
		    default:	info.category = 'phone';	break;	
		    }
		}
		else
		{
		    info.category='phone';
		}
		
		all_devices[dev_id]=info;
	    }
	}	
	
	return all_devices;
    },
    //save after sid, used for sync operation
    after_sid:function(){
	var sid=localStorage.getItem('DolphinBrowserAfterSid');
	if(sid == null || sid == '')
	{
	    return {tab:0,bookmark:0,history:0};
	}
	else
	{
	    var data = JSON.parse(sid);
	    if(CommInfo.user_name != null && data[CommInfo.user_name] != null)
	    {
		return data[CommInfo.user_name];
	    }
	    else
	    {
		return {tab:0,bookmark:0,history:0};
	    }
	}
    },
    get_tab_change_setting:function(){
	var setting = localStorage['DolphinBrowserAccountChange'];
	if(setting != null)
	{
	    var setting_json = JSON.parse(setting);
	    var setting_usr = setting_json[CommInfo.user_name];
	    if(setting_usr != null)
	    {
		return setting_usr;
	    }
	}
	return null;	
    },
    save_tab_change_setting:function(setting){
	var setting_str = localStorage['DolphinBrowserAccountChange'];
	var setting_json = {};
	if(setting_str != null)
	{
	    var setting_json = JSON.parse(setting_str);
	}
	setting_json[CommInfo.user_name] = setting;
	localStorage['DolphinBrowserAccountChange'] = JSON.stringify(setting_json);
    },
    clear: function() {	
    },
    clickTarget:null
};	

var ThirdParty = {
	'google':'google',
	'facebook':'facebook',
	'sinaweibo':'sinaweibo'
};

var MAX_URL_LENGTH = 2048;
var MAX_TITLE_LENGTH = 1000;

var INJECT_CODE={
    SONAR_LOGIN:"window.DOLPHIN_STATUS=0",
    SEND_ONGOING:"window.DOLPHIN_STATUS=1",
    SEND_TEXT:"window.DOLPHIN_STATUS=2",
    SEND_PAGE:"window.DOLPHIN_STATUS=3",
    SEND_DIRECTION:"window.DOLPHIN_STATUS=4",
    SEND_IMAGE:"window.DOLPHIN_STATUS=5",
    SEND_APP:"window.DOLPHIN_STATUS=6",
    NETWORK_ERROR:"window.DOLPHIN_STATUS=7",
    LOGIN_SUCCESS:"window.DOLPHIN_STATUS=8",
    SEND_FAIL:"window.DOLPHIN_STATUS=9"	
};

BOOKMARK_SID = {
	current:0,
	ongoing:0
};

/*
	Get sync state
*/
function SYNC_state()
{
	//when user logout, no need to process.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}
	
	track_event({
		category:'general',
		action:'BookmarkSync',
		label:'trigger',
		value:1
	});	
	
	var data={'token':CommInfo.token};
	var data_encode = urlencode(data);

	jQuery.ajax({
		url:API.sync_state(),
		contentType:"application/json",
		type:"post",
		data:data_encode,
		headers:{"ClientVersion":"chromeExtv1.0"},
		success:SYNC_state_callback,
		error:function(){
			print_msg("get state error.");
			BookmarkInfo.ongoing = 0;
			local = null;
			track_event({
				category:'general',
				action:'BookmarkSync',
				label:'fail',
				value:1
			});	
		}
	});
}

/*
	Callback of API_sync_state.
	Params:
		xhr: XMLHttpRequest
*/
function SYNC_state_callback(resp)
{
	//when user logout, no need to process.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}	
	
	if(resp.status == 0) 	//connect success
	{	
		//bookmark
		var latest_sid = resp.data.latest_chrome_sid;
		var	after_sid = CommInfo.after_sid();		
		BOOKMARK_SID.current = after_sid['bookmark'];
		BOOKMARK_SID.ongoing = after_sid['bookmark'];
		
		
		//when there is new data updated in server, get chunk
		if(after_sid['bookmark'] < latest_sid)
		{
			//clear buffer
			BookmarkInfo.deletes.splice(0, BookmarkInfo.deletes.length);
			BookmarkInfo.updates.splice(0, BookmarkInfo.updates.length);
			
			SYNC_getchunk({type:'bookmark',latest_sid:latest_sid});
		}
		else
		{
			pre_process_local();
		}
	}
	else
	{
		track_event({
			category:'general',
			action:'BookmarkSync',
			label:'fail',
			value:1
		});	
		print_msg('[BookmarkSync] get state error.');
		BookmarkInfo.ongoing = 0;
		local = null;
	}
}

/*
	Send get chunk request.
	Params:
		context:sync item information, json dict
*/
function SYNC_getchunk(context)
{	
	//when user logout, no need to getchunk
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}	
	
	var data = {};
	var token = CommInfo.token;
	var after_sid = BOOKMARK_SID.ongoing;//CommInfo.after_sid()[context.type];
	var latest_sid = context.latest_sid;
	var limit = latest_sid - after_sid;
	var type = get_type(context);
	
	data.token=token;
	data.after_sid = after_sid;
	data.limit = limit>20?20:limit;
	data.type = type;
	
	if(BOOKMARK_SID.current == 0) {
		data.no_deleted = 1;
	}
	
	data_encode = urlencode(data);
	
	jQuery.ajax({
		url:API.sync_getchunk(),
		contentType:"application/json",
		type:"post",
		data:data_encode,
		success:SYNC_getchunk_callback,
		error:function(){
			print_msg("[BookmarkSync] get chunk error.");
			BookmarkInfo.ongoing = 0;
			local = null;
			track_event({
				category:'general',
				action:'BookmarkSync',
				label:'fail',
				value:1
			});				
		}
	});
}

/*
	Callback of getchunk.
	This function save the obj get from server to local storage,
	if get chunk is not finish, getchunk will be called again.
	
	Params:
		xhr: XMLHttpRequest.
*/
function SYNC_getchunk_callback(resp)
{
		//when user logout, no need to process the result.
		if (CommInfo.is_login == false) {
			BookmarkInfo.ongoing = 0;
			local = null;			
			return;
		}	
		
		if(resp.status == 0) 	//connect success
		{	
			//bookmark
			var latest_sid = resp.data.latest_sid;
			var chunk_latest_sid = resp.data.chunk_latest_sid;
			var updated_objs = resp.data.updated_objs;
			
			BookmarkInfo.deletes = BookmarkInfo.deletes.concat(resp.data.deleted_ids);
			BookmarkInfo.updates = BookmarkInfo.updates.concat(updated_objs);
			
			//more data need receive.
			if(chunk_latest_sid < latest_sid)
			{
				BOOKMARK_SID.ongoing = chunk_latest_sid;
				SYNC_getchunk({type:'bookmark',latest_sid:latest_sid});
			}
			else
			{
				BOOKMARK_SID.ongoing = chunk_latest_sid;
				BOOKMARK_SID.current = chunk_latest_sid;
				
				var after_sid = CommInfo.after_sid();
				
				//get bookmark after_sid
				after_sid['bookmark'] = chunk_latest_sid;
				
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
				
				//Bookmark data receive finish, start merge process.
				bookmark_merge_ctrl();
			}
		}
		else
		{
			print_msg("[BookmarkSync] getchunk_callback error.");
			track_event({
				category:'general',
				action:'BookmarkSync',
				label:'fail',
				value:1
			});	
			BookmarkInfo.ongoing = 0;
			local = null;
		}
}

/*
	Update the device current open tabs 
	Params:
		sync_id:user sync_id
*/
function SYNC_update(data)
{
	//when user logout, no need to update.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}
		
	var data_encode = urlencode({'token':CommInfo.token,'data':data, "device_id":get_clientid(true)});
	jQuery.ajax({
		url:API.sync_update(),
		contentType:"application/json",
		type:"post",
		data:data_encode,
		success:SYNC_update_callback,
		error:function(){
			print_msg("[BookmarkSync] update error.");
			BookmarkInfo.ongoing = 0;
			local = null;
			track_event({
				category:'general',
				action:'BookmarkSync',
				label:'fail',
				value:1
			});		
		}
	});
}	

function SYNC_update_callback(resp){
	
	//when user logout, no need to process result.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}
	
	if(resp.status == 0) 	
	{
		if(resp.data && resp.data.length > 0) {
			for(var idx in resp.data) {
				var data = resp.data[idx];
				
				var local_id = data.cid;
				if(local[local_id].state == BookmarkSyncState.REMOVE) {
					delete local[local_id];
				}
				else{
					local[local_id].state = BookmarkSyncState.SYNCED;				
				}
				BookmarkInfo.latest_sid = data.sid;
				sync_node_update();
			}		
		}
		else {
			sync_node_update();
		}
	}
	else
	{
		print_msg("[BookmarkSync] update callback error.");
		BookmarkInfo.ongoing = 0;	
		local = null;
		track_event({
			category:'general',
			action:'BookmarkSync',
			label:'fail',
			value:1
		});				
	}
}

/*
	Create a new tab id, this means first sync for this device.
	Params:
		-data:  array list.
*/
function SYNC_create(data)
{
	//when user logout, no need to create.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}
	
	var data_encode = urlencode({'token':CommInfo.token,'data':data, "device_id":get_clientid(true)});
	jQuery.ajax({
		url:API.sync_create(),
		contentType:"application/json",
		type:"post",
		data:data_encode,
		success:SYNC_create_callback,
		error:function(){
			print_msg("[BookmarkSync] create error.");
			BookmarkInfo.ongoing = 0;
			local = null;
			track_event({
				category:'general',
				action:'BookmarkSync',
				label:'fail',
				value:1
			});			
		}
	});
}

/*
	Save sync id to local storage
	Params:
		xhr: XMLHttpRequest.
*/
function SYNC_create_callback(resp)
{	
	//when user logout, no need to process result.
	if (CommInfo.is_login == false) {
		BookmarkInfo.ongoing = 0;
		local = null;		
		return;
	}
	
	if(resp.status == 0)
	{	
		if(resp.data && resp.data.length) {
			for(var id in resp.data) {
				var data = resp.data[id];
				var sync_id = data._id;
				var local_id = data.cid;
			
				local[local_id].sid = sync_id;
				local[local_id].state = BookmarkSyncState.SYNCED;
				BookmarkInfo.latest_sid = data.sid;			
			}
			sync_node_create();		
		}
		else {
			sync_node_create();					
		}
	}
	else
	{
		print_msg("[BookmarkSync] create callback error.");
		BookmarkInfo.ongoing = 0;
		local = null;
		track_event({
			category:'general',
			action:'BookmarkSync',
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

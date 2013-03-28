BookmarkSyncStorage = {};

/*
	Load bookmark data from localStorage.
*/
BookmarkSyncStorage.load = function() {
	var data=localStorage['DolphinBrowserBookmark'];
	if(data == null || data.length == 0)
	{
		return {};
	}
	else
	{
		var data_json = JSON.parse(data);
		return data_json;
	}
};

/*
	Save bookmark data to localStorage.
	params:
		-data: json format
*/
BookmarkSyncStorage.save = function(data) {
	var data_string = JSON.stringify(data);
	localStorage['DolphinBrowserBookmark'] = data_string;
};


/*
	Clear bookmark data
*/
BookmarkSyncStorage.clear = function() {
	delete localStorage['DolphinBrowserBookmark'];
};


/*
	Load bookmark tree and save to localStorage
*/
BookmarkSyncStorage.init = function (callback,params) {	
	chrome.bookmarks.getTree(
		function (result){
			print_msg("[BookmarkSync] Bookmark init.");
			var data_json = {};
			var root_node = result[0];
			if(result){
				var time = get_utc();
				for(var idx in root_node.children)
				{
					getNodeInfo(root_node.children[idx],data_json, time);
				}
				BookmarkSyncStorage.save(data_json);
				if(callback != null){
					callback(params);				
				}
				else{
					BookmarkInfo.ongoing = 0;
				}
			}
			else{
				BookmarkInfo.ongoing = 0;
				print_msg("[BookmarkSync] getTree: result is null.");
			}
		}
	);
};

/*
This is recursive function.
*/
function getNodeInfo(node, data_json, time) {
	
	data_json[node.id] = {
		id:node.id,
		pid:node.parentId,
		folder: (node.url == null) ? 1 : 0,
		title:node.title,
		url: node.url,
		order: time + (node.index+1)*10,
		state:BookmarkSyncState.CREATE
	};		
		
	if(node.children)
	{
		for(var idx in node.children)
		{
			getNodeInfo(node.children[idx], data_json, time);
		}	
	}
}

/*
 	This function recheck node order.
 */
BookmarkSyncStorage.syncLocalPreprocess = function(callback) {
	print_msg('[BookmarkSync] local node pre-process start');
	
	chrome.bookmarks.getTree(
		function (result) {
			print_msg("[BookmarkSync] local preprocess");
			var data_json = BookmarkSyncStorage.load();
			var root_node = result[0];
			//save bookmark root.
			BookmarkInfo.treeRoot = root_node;
			
			var tree_nodes = {};
			
			if(root_node) {
				for(var idx in root_node.children)
				{
					checkNodeState(root_node.children[idx], data_json, tree_nodes,  get_utc());
				}
				checkNodeDelete(tree_nodes, data_json);
				BookmarkSyncStorage.save(data_json);
				print_msg('[BookmarkSync] local node pre-process finish.');
				
				if(callback != null){
					print_msg('invoke callback');
					callback();				
				}				
			}
			else{
				print_msg("[BookmarkSync] local node pre-process: result is null, exit");
				BookmarkInfo.ongoing = 0;
			}
		}
	);
};

function checkNodeState(node, data_json, tree_nodes, time) {
	tree_nodes[node.id] = 0;
	
	//if node exist check it's status, otherwise create it
	if (data_json.hasOwnProperty(node.id)) {
		
		//index
		/*
			if content of a folder is modified, for example, a new file is added 
			to this folder, or its children are reordered. 
		*/
		if(data_json[node.id].hasOwnProperty('dirty') && data_json[node.id].dirty == 1) {
			data_json[node.id].dirty = 0;
			var len = node.children.length;
			for (var idx =0; idx < len; idx++) {
				var child_node = node.children[idx];
				
				//child not exist, create it.
				//a new file is added to this folder, so create one.
				if(data_json[child_node.id] == null)
				{
					data_json[child_node.id] = {
							id:child_node.id, 
							pid:node.id, 
							folder:child_node.url == null ? 1 : 0,
							title:child_node.title,
							url: child_node.url,
							order: time + child_node.index,
							state:BookmarkSyncState.CREATE		
					};		
				}//children are reordered.
				else if(data_json[child_node.id].state == BookmarkSyncState.MOVE)
				{
					try {
						if(idx > 0 && idx < len-1) {
							var node_before = node.children[idx-1];
							var node_after = node.children[idx+1];
							if(data_json[node_before.id] && data_json[node_after.id]) {
								data_json[child_node.id].order = parseInt((data_json[node_after.id].order+data_json[node_before.id].order)/2);					
							}
							else{
								//if there are continuation nodes, may has problem.
								data_json[child_node.id].order = time + child_node.index;
							}
						}
						else if(idx == 0) {
							var node_after = node.children[idx+1];
							if(node_after) {
								data_json[child_node.id].order = data_json[node_after.id].order - 20;						
							}
							else {
								data_json[child_node.id].order = time;
							}
						}
						else if(idx == (len-1)) {
							data_json[child_node.id].order = time + (child_node.index+1)*10;
						}					
					}
					catch(e) {
						print_msg(e.message);
					}
					data_json[child_node.id].state = BookmarkSyncState.UPDATE;					
				}
			}	
		}
		
		//move
		if(data_json[node.id].pid != node.parentId){ 
			data_json[node.id].pid = node.parentId;
			data_json[node.id].state = BookmarkSyncState.MOVE;
		}
		
		//title update
		if(data_json[node.id].title != node.title) {
			data_json[node.id].title = node.title;
			data_json[node.id].state = BookmarkSyncState.UPDATE;
		}
		
		//url update
		if((data_json[node.id].folder != 0) && (data_json[node.id].url != node.url) ) {
			data_json[node.id].url = node.url;
			data_json[node.id].state = BookmarkSyncState.UPDATE;
		}
	}
	else{
		data_json[node.id] = {
				id:node.id, 
				pid:node.parentId, 
				folder:node.url == null ? 1 : 0,
				title:node.title,
				url: node.url,
				order: time + node.index,
				state:BookmarkSyncState.CREATE		
		};				
	}
	
	//recursive visit children node.
	if(node.children)
	{
		for(var idx in node.children)
		{
			checkNodeState(node.children[idx], data_json, tree_nodes, time);
		}	
	}
}

/*
 	Check node delete, and marked with REMOVE.
 */
function checkNodeDelete(tree_nodes, local_nodes){
	for(var id in local_nodes) {
		if(!tree_nodes.hasOwnProperty(id)) {
			local_nodes[id].state = BookmarkSyncState.REMOVE;
		}
	}
}
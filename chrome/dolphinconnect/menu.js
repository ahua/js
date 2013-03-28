/*
	CommInfo.menuid_map=[page, image, text]
*/
function create_menu(dev, flag)
{
	if(CommInfo.device_list.length == 1)
		return;
	
	var id = chrome.contextMenus.create({
		"parentId":CommInfo.context_menu_id,
		"title": dev.deviceName, 
		"contexts":['page'],
		'documentUrlPatterns':["http://*/*","https://*/*"],
		"onclick": function(info,tab){
			var id = dev.did;
			//var msg  = null;
			title = tab.title;
			url = tab.url;
			onclick_page_handler(title, url, id);
		}
	});
	CommInfo.menuid_map[dev.did]=[id];
	
	id = chrome.contextMenus.create({
		"parentId":CommInfo.context_image_menu_id,
		"title": dev.deviceName, 
		"contexts":['image'],
		"onclick": function(info,tab){
			var id = dev.did;
			var src  = image_src_parse(info);
			onclick_img_handler(src, id);
		}
	});
	CommInfo.menuid_map[dev.did].push(id);

	if(CommInfo.device_list.length == 2 && flag) {
		devs = CommInfo.device_list[0];
		id = chrome.contextMenus.create({
			"parentId":CommInfo.context_menu_id,
			"title": devs.deviceName, 
			"contexts":['page'],
			'documentUrlPatterns':["http://*/*","https://*/*"],
			"onclick": function(info,tab){
				var id = devs.did;
				//var msg  = null;
				title = tab.title;
				url = tab.url;
				onclick_page_handler(title, url, id);
			}
		});
		CommInfo.menuid_map[devs.did]=[id];
		
		id = chrome.contextMenus.create({
			"parentId":CommInfo.context_image_menu_id,
			"title": devs.deviceName, 
			"contexts":['image'],
			"onclick": function(info,tab){
				var id = devs.did;
				var src = image_src_parse(info);
				onclick_img_handler(src, id);
			}
		});
		CommInfo.menuid_map[devs.did].push(id);		
	}
	
	if(dev.category != 'pc') {
		var mobile_devs = CommInfo.get_mobile_devs();
		
		if(mobile_devs.length == 1){
			return;
		}
		
		id = chrome.contextMenus.create({
			"parentId":CommInfo.context_select_menu_id,
			"title": dev.deviceName, 
			"contexts":['selection'],
			"onclick": function(info,tab){
				var id = dev.did;
				//var src = info.srcUrl;
				//onclick_img_handler(src, id);
	    		var text = info.selectionText;
				onclick_text_handler(text, id);
			}
		});
		CommInfo.menuid_map[dev.did].push(id);
		
		if(mobile_devs.length == 2 && flag) {
			devs = mobile_devs[0];
			id = chrome.contextMenus.create({
				"parentId":CommInfo.context_select_menu_id,
				"title": devs.deviceName, 
				"contexts":['selection'],
				"onclick": function(info,tab){
					var id = devs.did;
					//var src = info.srcUrl;
					//onclick_img_handler(src, id);
					var text = info.selectionText;
					onclick_text_handler(text, id);
				}
			});
			CommInfo.menuid_map[dev.did].push(id);
		}
	}
}

function image_src_parse(info) {
	var src = info.srcUrl;
	
	//google image
	if(src.indexOf("data:") == 0) {
		var imgurl = getQueryStringRegExp(info.linkUrl,"imgurl");
		src = !imgurl?src:imgurl;
	}
	else if(info.pageUrl.indexOf("image.baidu.") != -1 || 
		info.pageUrl.indexOf("images.baidu.") != -1 || 
		info.pageUrl.indexOf("tupian.baidu.") != -1 || 
		info.pageUrl.indexOf("pic.baidu.") != -1 || 
		info.pageUrl.indexOf("picture.baidu.") != -1) 
	{
		//baidu image
		if(CommInfo.clickTarget != null){
			src = CommInfo.clickTarget;
		}
		else if(info.linkUrl != null) {
			src = info.linkUrl;
		}
	}	
	
	return src;
}

function onclick_img_handler(src, dev_id) {
	push(dev_id, {title:'',url:src},false, 2);
}

function onclick_text_handler(text, dev_id) {
	if(text.length > 1000) {
		alert('More than 1000 characters.');
	}
	else {
		push(dev_id,{title:text,url:''},false, 3);
	}
}

function onclick_page_handler(title, url, dev_id) {
	push(dev_id,{title:title,url:url}, false, 1);
}

/*
	Remove all menu items on context menu which appear at right click.
*/
function removeall_menu()
{
	chrome.contextMenus.removeAll();
	CommInfo.menuid_map={};
	create_top_menu();
}

/*
	Create top level menu item.
*/
function create_top_menu()
{
	CommInfo.context_menu_id = chrome.contextMenus.create({
		"title": "Send to Dolphin", 
		"contexts":['page'],
		'documentUrlPatterns':["http://*/*","https://*/*"],
        "onclick": function(info,tab){
	    	if(CommInfo.device_list.length == 0) {
    			alert("You haven't logged in with Dolphin Connect in your Dolphin Browser.");
	    	}
	    	else if(CommInfo.device_list.length == 1){
	    		var id = CommInfo.device_list[0].did;
	    		var text ='';
	    		var url = '';
				if(info.selectionText) {
					text = info.selectionText;
					onclick_text_handler(text, id);
				}else {
					title = tab.title;
					url = tab.url;
					onclick_page_handler(title, url, id);
				}
	    	}
        }
	});	
	
	CommInfo.context_select_menu_id = chrome.contextMenus.create({
		"title": "Send to Dolphin", 
		"contexts":['selection'],
	    "onclick": function(info,tab){
	    	var mobile_devs = CommInfo.get_mobile_devs();
	    	
	    	if(mobile_devs.length == 0) {
	    			alert("You haven't logged in with Dolphin Connect in your Dolphin Browser.");
	    	}
	    	else if(mobile_devs.length == 1) {
				var id = mobile_devs[0].did;
	    		var text = info.selectionText;
				onclick_text_handler(text, id);
	    	}
	    }
	});
	
	CommInfo.context_image_menu_id = chrome.contextMenus.create({
		"title": "Send image to Dolphin", 
		"contexts":['image'],
	    "onclick": function(info,tab){
	    	if(CommInfo.device_list.length == 0) {
	    			alert("You haven't logged in with Dolphin Connect in your Dolphin Browser.");
	    	}
	    	else if(CommInfo.device_list.length == 1){
				var id = CommInfo.device_list[0].did;
				var src = image_src_parse(info);
				onclick_img_handler(src, id);		
	    	}
	    }
	});	
}

/*
  	delete device from context menu.
 */
function remove_menu(did)
{
	var ids = CommInfo.menuid_map[did];
	
	if(ids != null){
		
		for(var id in ids)
		{
			chrome.contextMenus.remove(ids[id], function(){print_msg("del context menu");});	
		}
		//chrome.contextMenus.remove(id[1], function(){print_msg("del context image menu");});
		delete CommInfo.menuid_map[did];		
	}
	
	// if where is one item left, remove it because ...

	if(CommInfo.device_list.length == 1) {
		did = CommInfo.device_list[0].did;
		var ids = CommInfo.menuid_map[did];
		
		if(ids != null){
			for(var id in ids)
			{
				chrome.contextMenus.remove(ids[id], function(){print_msg("del context menu");});	
			}
			delete CommInfo.menuid_map[did];					
		}
	}	
		
	var mobile_devs = CommInfo.get_mobile_devs();
	if(mobile_devs.length == 1 && CommInfo.device_list.length > 1){
		var ids = CommInfo.menuid_map[mobile_devs[0].did];
		if(ids != null){
			if(ids[2]) {
				chrome.contextMenus.remove(ids[2], function(){print_msg("del context menu");});	
				ids.splice(2,1);		
			}				
		}
	}
}

/*
	Update device name in context menu.
*/
function rename_menu(did, name) 
{
	var id = CommInfo.menuid_map[did];
	if(id) {
		chrome.contextMenus.update(id[0],{title:name} ,function(){print_msg("update context menu");});
		chrome.contextMenus.update(id[1],{title:name} ,function(){print_msg("update context image menu");});		
	}
}
//var lock=0;

/*
function insertJquery() {
         var j_script = document.createElement('script'); 
         j_script.setAttribute('type','text/javascript');
         //js_path = chrome.extension.getURL('jquery/jquery-1.7.2.js');
         j_script.setAttribute('src', 'http://code.jquery.com/jquery-1.4.1.min.js');
         //'http://code.jquery.com/jquery-1.4.1.min.js'
         document.getElementsByTagName('head')[0].appendChild(j_script);	
 }
*/

function rightClickListenerInsert() {
  var script = [" window.oncontextmenu = function(event)",
			    " {",
			    "    var target = event.target.getAttribute('obj_url');",
			    "	 window.postMessage({type: 'dolphin_clickTarget', target:target}, '*');",
                " };"
        ].join('');
        
        var e_script = document.createElement('script'); 
        e_script.setAttribute('type','text/javascript');
        e_script.innerText = script;
        document.getElementsByTagName('head')[0].appendChild(e_script);	
}


function inseryScript() {
        var script = ["function a() {",
                      "	 document.addEventListener('keydown', function(e){",
                      "		/*console.log('keydown');*/",
                      "		var keys = [];", 	
                      "		if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {", 
                      "			if(e.metaKey) {",
                      "				keys.push('Cmd');",
                      "			}",
                      "			if(e.shiftKey) {",
                      "				keys.push('Shift');",
                      "			}",
                      "			if(e.ctrlKey)",
                      "			{",
                      "				keys.push('Ctrl');",
                      "			}",
                      "			if(e.altKey) {",
                      "				keys.push('Alt');",
                      "			}",	
                      "		}",
                      "		if(e.which)",
                      "		{",
                      "			/*console.log(e.which);*/",
                      "			keys.push(String.fromCharCode(e.which));",
                      "		}",
                      "		/*console.log(keys.join('+'));*/",
                      "		if(keys.length >= 2 && keys[keys.length-1] != '') {",
                      "			window.postMessage({type: 'dolphin_shortcuts', keys:keys}, '*');",
                      "		}",
                      "	 });",
                      "}",
                      "a();"
        ].join('');
        
        var e_script = document.createElement('script'); 
        e_script.setAttribute('type','text/javascript');
        e_script.innerText = script;
        document.getElementsByTagName('head')[0].appendChild(e_script);
}

//set a lock;
window.addEventListener("message", function(event) {
         //We only accept messages from ourselves
         if (event.source != window)
            return;
          
          var data = event.data;
          if (data.type && (data.type == "dolphin_shortcuts")) {
          	var keys =  data.keys;	    	
          	//console.log("Content script received: keys %s",keys.join('+'));
          	//if(lock == 0) {
          		//lock = 1;
      	    	chrome.extension.sendMessage({type:'shortcuts',data:keys});
      	    	//setTimeout(function(){lock=0;},1000);
          	//}
          }
          else if(data.type && (data.type == "dolphin_clickTarget")){
          	var target = data.target; 
          	chrome.extension.sendMessage({type:'clicktarget',data: target});
          }
      }, false);

//insertJquery();
inseryScript();
rightClickListenerInsert();

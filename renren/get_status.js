var debug = true;

function debug_print(s)
{
    if(debug){
	display(s);
    }
}

function get_status(status_list)
{
    var ret = []
    for(var i = 0; i < status_list.length; ++i){
	try{
	    var n = status_list[i];
	    var text = n.childNodes[4].childNodes[2].nodeValue;
	    var ts = n.childNodes[5].childNodes[1].childNodes[1].childNodes[0].nodeValue;
	
	    s = ts.replace("\n", "") + text.replace("\n", "");
	    ret.unshift(s);
	}catch(err){
	    
	}
    }
    return ret;
}

function display(s)
{
    console.log(s);
}

function main()
{
    var ss = document.getElementById("my_panel");
    var ret = get_status(ss.childNodes);
    for(var i = 0; i < ret.length; ++i){
	display(ret[i]);
    }
}



var debug = true;

function debug_print(s)
{
    if(debug){
	display(s);
    }
}

function get_status(panel)
{
    var h3_list = panel.getElementsByTagName("h3");
    var ts_list = panel.getElementsByClassName("duration");
    var ret = [];

    if(h3_list.length != ts_list.length){
	return [];
    }

    for(var i = 0; i < ts_list.length; ++i){
	var s = "";
	try{
	    var text = h3_list[i].childNodes[2].nodeValue;
	    var ts = ts_list[i].childNodes[0].nodeValue;
	    s = ts.replace("\n", "") + text.replace("\n", "");
	}catch(err){
	    var text = h3_list[i].childNodes[1].nodeValue;
	    var ts = ts_list[i].childNodes[0].nodeValue;
	    s = ts.replace("\n", "") + text.replace("\n", "");
	}
	if(s != ""){
	    ret.unshift(s);
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
    var ret = get_status(ss);
    for(var i = 0; i < ret.length; ++i){
	display(ret[i]);
    }
}



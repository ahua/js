
function ajax_test(){
    var xmlhttp = new XMLHttpRequest();
    
    var success = function(){
	if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
	    print("hello");
	}
    }

    xmlhttp.onreadystatechange = success;
    xmlhttp.open("GET", "/ajxx/test", true);
    xmlhttp.send();
}

ajax_test();

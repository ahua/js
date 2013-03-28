(function(){
    function BA(){}
    BA.prototype = {
        body : [],
        send : function(o){
            var oThis = this;
            var url = _bahost+"track/1/logs.gif?l=";
            var hdr = ba_config.hdr;
            if(!hdr.isu){
                return true;
            }
            o = (!o)?oThis.body:o;
            url += encodeURIComponent((JSON.stringify({"header":hdr,"body":o})));
            oThis.body = [];
            var timg = new Image();
            timg.src = url;
        },
        track : function(cat,act,label,val){
            if(navigator.onLine){
                //有网的情况下才统计
                var oThis = this,t = Date.now(),elem = {"ctg":"-","act":"-","lab":"-","val":"1","t":t};
                
                if(cat){
                    cat.length = (cat.length >40)?40:cat.length;
                    elem.ctg = cat;
                }
                if(act){
                    act.length = (act.length >100)?100:act.length;
                    elem.act = act;
                }
                if(label){
                    if(act != _eblg){
                        label.length = (label.length >100)?100:label.length;
                        elem.lab = "";
                    }else{
                            elem.lab = navigator.userAgent + "stacktrace";
                    }
                    elem.lab += label;
                }
                if(val =+val){
                    elem.val = val;
                }

                if(cat == _blg&&act==_eblg){
                    //由于error信息可能会比较长，所以会单独发送。
                    oThis.send([elem]);
                    return true;
                }
                if(_debug&&console&&console.log){
                    console.log(JSON.stringify(elem));
                }

                oThis.body.push(elem);
                if((cat == _blg&&act=="__##DURATION##__") || oThis.body.length >0){
                    //在duration事件或有5条track后发送
                    oThis.send();
                }
            }
            return false;
        },
        setAppInfo : function(info){
            var oThis = this;
            //设置网页应用的相关信息，包括appName,appVersion,appPacket等.
            if(ba_config.isEmpty(oThis.hdr)){
                oThis.hdr = ba_config.setAppInfo(info);
            }
        }
    }
    var ba_config = {
        version : "js-0.2 for plug",
        hdr : {},
        //userAgent : navigator.userAgent.toLowerCase(),
        isu : "",
        isEmpty : function(o){
            for(k in o){
                return false;
            }
            return true;
        },
        getNetType : function(){
            if(navigator.onLine && (dp = _W.dolphin)&&dp.getActiveNetworkInfo){
                var type = dp.getActiveNetworkInfo();
                //var table = ["UNKNOWN","GPRS" ,"EDGE" ,"UMTS","CDMA","EVDO_0","EVDO_A","1xRTT","HSDPA","HSUPA" ,"HSPA","IDEN","EVDO_B" ,"LTE","EHRPD" ,"HSPAP"];
                var table ="UNKNOWN,GPRS ,EDGE,UMTS,CDMA,EVDO_0,EVDO_A,1xRTT,HSDPA,HSUPA,HSPA,IDEN,EVDO_B,LTE,EHRPD,HSPAP".split(",");
                return type<0?"":type<table.length?table[type]:"WIFI";
            }
            return "";
        },
        setAppInfo : function(info){
            //设置网页应用的相关信息，包括appName,appVersion,appPacket等.
            if(info.app_key == ""){
                return false;
            }
            var hdr = this.hdr;
            hdr.app_id = info.app_key;
            hdr.appvn = (info.version)?info.version:"0.0";
            hdr.chn = info.chn?info.chn:"dolphin-offical";
            if(info.uid){
                _btma = info.uid;
            }
            if(info.target && _rblg.test(info.target.toLowerCase())){
                _bahost = _rblg.exec(info.target.toLowerCase());
                _bahost = "http"+_bahost[1]+"://a"+_bahost[2]+"n"+_bahost[1]+".belugaboost.com/";
                _debug = false;                
            }

            this.setBasicConfig();
        },
        setBasicConfig : function(){
            var hdr = this.hdr,lang = navigator.language.split("-");
            if(!hdr.isu || hdr.isu == ""){
                //this.setUID();
                hdr.isu = _btma;
            }
            hdr.appvc = hdr.did = hdr.model = hdr.cpu = hdr.no = hdr.pn = hdr.os = hdr.osv = "";
            hdr.lon = hdr.lat = 0.0;
            hdr.sdkv = this.version;
            hdr.cc = lang[0]?lang[0]:"";
            hdr.lang = lang[1]?lang[1]:"";
            hdr.res = (_W.innerWidth||_D.body.clientWidth)+"*"+(_W.innerHeight||_D.body.clientHeight);
            //var os = _uaparser.getOS();
            //hdr.os = (os.name == undefined)?"":os.name;
            //hdr.osv = (os.version == undefined)?"":os.version;
            hdr.nt = this.getNetType();
        }
    };
    Math.uuid = function() {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = new Array(36), rnd=0, r;
        for (var i = 0; i < 36; i++) {
            if (i==8 || i==13 ||  i==18 || i==23) {
                uuid[i] = '-';
            } else if (i==14) {
                uuid[i] = '4';
            } else {
                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    };

    //一些要固定执行的代码.    
    if(typeof _ba == "undefined"){
        _ba = new BA();
    }
    var _debug=true,_blg = "__##BELUGA##__", _eblg= "__##ERROR##__",_bahost = "http://10.2.25.8/",_rblg=/^http(s?):\/\/([c|e])n.belugaboost.com\/?/,_W=window,_D=document;
    _ba.track(_blg,"__##ACTIVE##__","-",1);

    function daybegin(){
        var day = new Date();
        day.setHours(0)
        day.setMinutes(0)
        day.setSeconds(0)
        day.setMilliseconds(0)
        return day.getTime();
    }

    _W.onerror = function(msg,url,l){
        _ba.track(_blg,_eblg,msg+"@"+url+":"+l);
        return true;
    }

    _ba.track("pageview",location.href);
})(window,undefined);

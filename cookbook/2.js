test  = function(){
    this.init();
}

test.prototype = {
    init:function(){
	print("This is test:init function.");
    }
}

var demo = new test()

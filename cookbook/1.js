var Duck = function(){};
Duck.prototype = { 
    func1 : function(){
	print("This is in func1");
    },

    func2 : function(){
	print("This is in func2");
    }
}

var overlya = new Duck();
overlya.func1();
overlya.func2();

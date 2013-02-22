var Duck = function(){
    this.func1();
};
Duck.prototype = { 
    func1 : function(){
	print("This is in func1");
    },

    func2 : function(){
	print("This is in func2");
    }
}

var overlya = new Duck();


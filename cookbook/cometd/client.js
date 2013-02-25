var cometd1 = dojox.cometd;
var cometd2 = new dojox.Cometd();

var cometd3 = $.cometd;
var cometd4 = new $.Cometd();

cometd2.registerExtension('ack', new org.cometd.AckExtension());
cometd2.registerExtension('timestamp', new org.cometd.TimeStampExtension());
cometd2.registerExtension('timesync', new org.cometd.TimeSyncExtension());
cometd2.registerExtension('reload', new org.cometd.ReloadExtension());

var subscription1 = cometd.addListener('/meta/connect', function() { ... });
var subscription2 = cometd.subscribe('/foo/bar/', function() { ... });

// Some de-initialization code
cometd.unsubscribe(subscription2);
cometd.removeListener(subscription1);

cometd.publish('/mychannel', { mydata: { foo: 'bar' } });

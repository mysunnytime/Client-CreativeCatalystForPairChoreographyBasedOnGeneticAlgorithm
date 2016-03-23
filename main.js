$(function(){

    // previewFrame
    var previewFrame = document.getElementById("previewFrame");
    previewFrameWidth = previewFrame.width;
    previewFrameHeight = previewFrame.height;
    previewFrameContext = previewFrame.getContext("2d");
    // btns
    // btns for capturing initial poses into pools.
    var btnCaptL = $("#btnCaptureL");
    var btnCaptR = $("#btnCaptureR");

	// set up websocket
	var socket;
	console.log('about to open socket');
	socket = new WebSocket('ws://142.58.213.7:2012/kinect');
	console.log('attempted to open socket');

    socket.onopen = function () {
        console.log('socket opened');
    };
    socket.onclose = function () {
        console.log('socket closed');
    };
    socket.onerror = function (err) {
        console.log('error - ' + err);
    };
    socket.onmessage = function (event) {
        // console.log(event.data);
        var bodies = JSON.parse(event.data);
        updatePose(bodies);
        drawPose(curPose, previewFrameContext, previewFrameWidth, previewFrameHeight);
    }; //socket.onmessage ends

    // btn's on click
    btnCaptL.on("click", function(){
    	capturePose(curPose, poolMPoses);
        redrawPool(poolMPoses, "poolMom");
    });
    btnCaptR.on("click", function(){
    	capturePose(curPose, poolDPoses);
    });

});

// the current pose that we capture.
var curPose;
// the poses in poolMom and poolDad
var poolMPoses = [];
var poolDPoses = [];
// the saved poses
var savedPoses = [];
// update current pose when websocket send a new pose
var updatePose = function(newPose){
	curPose = newPose;
};
// draw pose in the context
var drawPose = function(pose, cxt, canvW, canvH){
    for (var i = 0; i < curPose.length; i++) {
        cxt.clearRect(0, 0, canvW, canvH);
    	
    	cxt.fillStyle = "#31B131";
        var jointDictionary = pose[i];
        for (var joint in jointDictionary) {
            var jnt = jointDictionary[joint];
            var x = jnt.X;
            var y = jnt.Y;
            cxt.fillRect(x - 8, y - 8, 16, 16);
        }
    }
};
// capture curPose into pools. pool = poolMPoses or poolDPoses.
var capturePose = function(pose, pool){
	pool.push(pose);
};
// save a chosen pose to savedPoses
var savePose = function(pose){
	savedPoses.push(pose); 
};
// redraw the pool - used when the content of pools changes
var redrawPool = function(pool, poolDOMid){
    var poolDom = $("#"+poolDOMid);
    var poolPosesDom = poolDom.find(".poolPose");
    for(var i=0; i<pool.length; i++)
    {
        if (i>=poolPosesDom.length)
        { 
            poolDom.append('<canvas class="poolPose" width="1920" height="1080"></canvas>');
        }
        var poolPosesDom = poolDom.find(".poolPose");
        var cnt = poolPosesDom.eq(i).get(0);
        var canvW = cnt.width;
        var canvH = cnt.height;
        var cxt = cnt.getContext("2d");
        drawPose(pool[i], cxt, canvW, canvH);
    }
    console.log(poolDOMid + " updated.")
}

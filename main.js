$(function(){

    // poses in the pools
    var pose1 = document.getElementById("pose1");
    pose1Width = pose1.width;
    pose1Height = pose1.height;
    pose1Context = pose1.getContext("2d");
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
        console.log(event.data);
        var bodies = JSON.parse(event.data);
        updatePose(bodies);
        drawPose(curPose, previewFrameContext, previewFrameWidth, previewFrameHeight);
    }; //socket.onmessage ends

    // btn's on click
    btnCaptL.on("click", function(){
    	capturePose(curPose, poolMPose);
    	drawPose(poolMPose[0], pose1Context, pose1Width, pose1Height);
    });
    btnCaptR.on("click", function(){
    	capturePose(curPose, poolDPose);
    });

});

// the current pose that we capture.
var curPose;
// the poses in poolMom and poolDad
var poolMPose = [];
var poolDPose = [];
// the saved poses
var savedPose = [];
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
// capture curPose into pools. pool = poolMPose or poolDPose.
var capturePose = function(pose, pool){
	pool.push(pose);
};
// save a chosen pose to savedPose
var savePose = function(pose){
	savedPose.push(pose); 
};
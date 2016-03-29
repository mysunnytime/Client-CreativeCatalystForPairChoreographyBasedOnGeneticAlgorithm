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
    // btn for generation
    var btnGenerate = $("#btnGenerate");
    // btn to restart capturing
    var btnRestart = $("#btnRestart");

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
        var bodies = JSON.parse(event.data)[0];
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
        redrawPool(poolDPoses, "poolDad");
    });
    btnGenerate.on("click", function(){
        $("#preview").hide();
        $("#poolBabe").show();
        if(poolMPoses.length==0 || poolDPoses.length==0){
            alert("Please capture pose first.");
            return;
        }
        generatePoses();
    });
    btnRestart.on("click", function(){
        poolMPoses = [];
        poolDPoses = [];
        redrawPool(poolMPoses, "poolMom");
        redrawPool(poolMPoses, "poolDad");

        $("#poolBabe").hide();
        $("#preview").show();
    });

});

// define the skeloton names in the data
var SPINEBASE   = 0;
var SPINEMID    = 1;
var NECK        = 2;
var HEAD        = 3;
var SHOULDERLEFT = 4;
var ELBOWLEFT   = 5;
var WRISTLEFT   = 6;
var HANDLEFT    = 7;
var SHOULDERRIGHT = 8; 
var ELBOWRIGHT  = 9;
var WRISTRIGHT  = 10;
var HANDRIGHT   = 11;
var HIPLEFT     = 12;
var KNEELEFT    = 13;
var ANKLELEFT   = 14;
var FOOTLEFT    = 15;
var HIPRIGHT    = 16;
var KNEEDRIGHT  = 17;
var ANKLERIGHT  = 18;
var FOORRIGHT   = 19;
var SPINESHOULDER = 20;
var HANDTIPLEFT = 21;
var THUMBLEFT   = 22;
var HANDTIPRIGHT = 23;
var THUMBRIGHT  = 24;

// the current pose that we are capturing.
var curPose;
// the poses in poolMom and poolDad
var poolMPoses = [];
var poolDPoses = [];
// the saved poses
var savedPoses = [];
// update current pose when websocket send a new pose
var updatePose = function(newPose){
	curPose = newPose;
    // console.log(curPose);
};
// draw pose in the context
var drawPose = function(pose, cxt, canvW, canvH){
        cxt.clearRect(0, 0, canvW, canvH);
    	
    	cxt.fillStyle = "#31B131";
        var jointDictionary = pose;
        for (var joint in jointDictionary) {
            var jnt = jointDictionary[joint];
            var x = jnt.X * 1000 + 500;
            var y = jnt.Y * -1000 + 500;
            cxt.fillRect(x - 8, y - 8, 16, 16);
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
    poolDom.html("");
    var poolPosesDom = poolDom.find(".poolPose");
    for(var i=0; i<pool.length; i++)
    {
        poolDom.append('<canvas class="poolPose" width="1920" height="1080"></canvas>');
        var poolPosesDom = poolDom.find(".poolPose");
        var cnt = poolPosesDom.eq(i).get(0);
        var canvW = cnt.width;
        var canvH = cnt.height;
        var cxt = cnt.getContext("2d");
        drawPose(pool[i], cxt, canvW, canvH);
    }
    console.log(poolDOMid + " updated.")
}

// generate 10 poses
var generatePoses = function(){
    for(var i=0; i<10; i++){
        var pose1 = poolMPoses[parseInt(Math.random()*poolMPoses.length)];
        var pose2 = poolMPoses[Math.random(poolDPoses.length)];
        generatePose(pose1, pose2);
    }
};
// generate a new pose from two parent poses
var generatePose = function(mom, dad){
    var kid; 
    return kid;
};









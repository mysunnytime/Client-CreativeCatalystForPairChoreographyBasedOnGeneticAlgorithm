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
        $("#poolKid").show();
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

        $("#poolKid").hide();
        $("#preview").show();
    });

});

// the current pose that we are capturing.
var curPose;
// the poses in poolMom and poolDad
var poolMPoses = [];
var poolDPoses = [];
// the poses in poolKid
var poolKPoses = [];
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
    poolKPoses = [];
    for(var i=0; i<10; i++){
        var pose1 = poolMPoses[parseInt(Math.random()*poolMPoses.length)];
        var pose2 = poolMPoses[parseInt(Math.random()*poolDPoses.length)];
        poolKPoses.push(generatePose(pose1, pose2));
    }
    redrawPool(poolKPoses, "poolKid");
};

///////// Here's the genetic algorithm part //////////

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

// generate a new pose from two parent poses
var generatePose = function(mom, dad){

    // initialize gene
    var geneMom = getGene(mom);
    var geneDad = getGene(dad);
    var geneKid = geneMom;

    // crossover
    var crossoverPoint1 = parseInt(Math.random()*25);
    var crossoverPoint2 = crossoverPoint1 + parseInt(Math.random()*(25-crossoverPoint1));
    for (var i=crossoverPoint1; i<crossoverPoint2; i++){
        geneKid[i] = geneDad[i];
    }

    // mutation

    // return
    var kid = getCreatrue(geneKid);
    return kid;
};

// formate the (x,y,z) skeletal data into gene data (related position one) for GA.
var getGene = function(creature){
    var jointCnt = creature.length;
    var gene = creature;
    for(var i=jointCnt-1; i>=0; i--){
        switch(i){
            case 24:
            case 23:
            case 22:
            case 21:
            case 20:
                break;

            // other bodyparts
            // down right
            case 19:
            case 18:
            case 17:
            // down left
            case 15:
            case 14:
            case 13:
            // upper right
            case 11:
            case 10:
            case 9:
            // upper left
            case 7:
            case 6:
            case 5:
            // center
            case 3:
            case 2:
            case 1:
                gene[i] = { X: gene[i].X-gene[i-1].X, Y: gene[i].Y-gene[i-1].Y, Z: gene[i].Z-gene[i-1].Z};
                break;

            // bases
            // down bases
            case 16:
            case 12:
                gene[i] = { X: gene[i].X-gene[SPINEBASE].X, Y: gene[i].Y-gene[SPINEBASE].Y, Z: gene[i].Z-gene[SPINEBASE].Z};
                break;
            // upper bases
            case 8:
            case 4:
                gene[i] = { X: gene[i].X-gene[NECK].X, Y: gene[i].Y-gene[NECK].Y, Z: gene[i].Z-gene[NECK].Z};
                break;
            // final base boss
            case 0:
                // do nothing. he's the biggest.
                break;

            default:
                alert("Oops, your skeleton has wrong number of joints!");
        }
    }
    return gene;
};

// formate gene data, the related position one into the (x,y,z) skeletal data.
var getCreatrue = function(gene){
    var jointCnt = gene.length;
    var creature = gene;
    for(var i=0; i<jointCnt; i++){
        switch(i){

            // bases
            // upper bases
            case 4:
            case 8:
                creature[i] = { X: creature[i].X+creature[NECK].X, Y: creature[i].Y+creature[NECK].Y, Z: creature[i].Z+creature[NECK].Z};
                break;
            // down bases
            case 12:
            case 16:
                creature[i] = { X: creature[i].X+creature[SPINEBASE].X, Y: creature[i].Y+creature[SPINEBASE].Y, Z: creature[i].Z+creature[SPINEBASE].Z};
                break;
            // final base boss
            case 0:
                break;

            // other bodyparts
            // center
            case 1:
            case 2:
            case 3:
            // upper left
            case 5:
            case 6:
            case 7:
            // upper right
            case 9:
            case 10:
            case 11:
            // down left
            case 13:
            case 14:
            case 15:
            // down right
            case 17:
            case 18:
            case 19:
                creature[i] = { X: creature[i].X+creature[i-1].X, Y: creature[i].Y+creature[i-1].Y, Z: creature[i].Z+creature[i-1].Z};
                break;

            case 20:
            case 21:
            case 22:
            case 23:
            case 24:
                break;

            default:
                alert("Oops, your skeleton has wrong number of joints!");
        }
    }
    return creature;
};











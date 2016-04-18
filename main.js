$(function(){
    // preview state
    var isPreview = true;
    // generate new pool state
    var SELECTION_OFF = 0;
    var SELECTION_MOM = 1;
    var SELECTION_DAD = 2;
    var selectionState = SELECTION_OFF;

    // previewFrame
    var previewFrame = document.getElementById("previewFrame");
    var previewFrameWidth = previewFrame.width;
    var previewFrameHeight = previewFrame.height;
    var previewFrameContext = previewFrame.getContext("2d");
    var resulution = previewFrameContext.canvas.clientWidth;
    // btns
    // btns for capturing initial poses into pools.
    var btnCaptL = $("#btnCaptureL");
    var btnCaptR = $("#btnCaptureR");
    // btn for generation
    var btnGenerate = $("#btnGenerate");
    // btn to restart capturing
    var btnRestart = $("#btnRestart");
    // btn to generate new Moms and Dads
    var btnNewMom = $("#btnNewMom");
    var btnNewDad = $("#btnNewDad");
    console.log(btnNewMom);
    var btnNewApply = $("#btnNewApply");
    var btnNewCancel = $("#btnNewCancel");

    // sliders
    var slrView = $("#slrView").find("input");
    var slrInfluence = $("#slrInfluence").find("input");
    var slrIntensity = $("#slrIntensity").find("input");

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
        if(isPreview){
            var bodies = JSON.parse(event.data)[0];
            updatePose(bodies);
            drawPose(curPose, previewFrameContext, previewFrameWidth, previewFrameHeight, resulution);
        }
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
    var callbackForBtnGenerate = function(){
        isPreview = false;
        if(poolMPoses.length==0 || poolDPoses.length==0){
            alert("Please capture pose first.");
            return;
        }

        generatePoses();
        
        $("#preview").fadeOut(1000, function(){
            $("#poolKid").fadeIn();
            $("#generated").fadeIn(1000, function(){
                redrawPool(poolKPoses, "poolKid");
            });
            btnNewMom.fadeIn();
            btnNewDad.fadeIn();
        });
    };
    btnGenerate
    .off("click")
    .on("click", callbackForBtnGenerate);
    btnRestart.on("click", function(){
        isPreview = true;

        $("#poolMom").fadeOut(1000, function(){
            poolMPoses = [];
            redrawPool(poolMPoses, "poolMom");
            $("#poolMom").fadeIn(1000);
        });

        $("#poolDad").fadeOut(1000, function(){
            $("#btnNewCancel").trigger("click");
            poolDPoses = [];
            redrawPool(poolDPoses, "poolDad");
            $("#poolDad").fadeIn(1000);
        });

        $("#generated").fadeOut(1000, function(){
            $("#preview").fadeIn(1000);
        });
    });

    // btns for generate new mom and dad pools
    btnNewMom.on("click", function(){
        selectionState = SELECTION_MOM;

        // disable generate btn
        btnGenerate
        .off("click")
        .on("click", function(){
            alert("Please cancel the capturing before you generate new ones.");
        });

        // hide capture btns
        var left = btnNewMom.css("left");
        btnNewMom.fadeOut();
        btnNewDad.fadeOut();
        $("#poolMom .poolPoseWrap").fadeOut();

        // set positons for apply & cancel btn
        btnNewApply.css({"right":"","left": left, "background":"rgba(255, 160, 17, 1)"});
        btnNewCancel.css({"right":"","left": parseInt(left, 10) + 120 + "px"});

        // set selectable poses to selectable state
        $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").addClass("poolPoseSelectableToMom");
        $(".poolPoseSelectableToMom")
        .off("click")
        .on("click", function(){
            var self = $(this);
            self.toggleClass("poolPoseToMom");
        });

        // display apply & cancel btn
        btnNewApply.fadeIn();
        btnNewCancel.fadeIn();
    });

    btnNewDad.on("click", function(){
        // same machenism as btnNewMom
        selectionState = SELECTION_DAD;
        btnGenerate
        .off("click")
        .on("click", function(){
            alert("please cancel the capture session first.");
        });
        var right = btnNewDad.css("right");
        console.log(right);
        btnNewMom.fadeOut();
        btnNewDad.fadeOut();
        $("#poolDad .poolPoseWrap").fadeOut();
        btnNewApply.css({"left":"", "right": right, "background":"rgba(80, 170, 35, 1)"});
        btnNewCancel.css({"left":"","right": parseInt(right, 10) + 120 + "px"});
        $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").addClass("poolPoseSelectableToDad");
        $(".poolPoseSelectableToDad")
        .off("click")
        .on("click", function(){
            var self = $(this);
            self.toggleClass("poolPoseToDad");
        });
        btnNewApply.fadeIn();
        btnNewCancel.fadeIn();
    });

    btnNewApply.on("click", function(){
        // tmpPose indicates the selected poses. Later we will copy it to the corresponding pool.
        var tmpPoses = [];

        // add the selected poses in the kid pool to the tmpPose array
        var tmpKidSelected;
        tmpKidSelected = $("#poolKid .poolPoseWrap.poolPoseToMom, #poolKid .poolPoseWrap.poolPoseToDad");
        tmpKidSelected.each(function(){
            var self = $(this);
            var index = $("#poolKid .poolPoseWrap").index(self);
            tmpPoses.push(poolKPoses[index]);
        });

        // add the selected poses in the saved field to the tmpPose array
        var tmpSavedSelected;
        tmpSavedSelected = $("#saved .poolPoseWrap.poolPoseToMom, #saved .poolPoseWrap.poolPoseToDad");
        tmpSavedSelected.each(function(){
            var self = $(this);
            var index = $("#saved .poolPoseWrap").index(self);
            tmpPoses.push(poolKPoses[index]);
        });

        if(selectionState==SELECTION_MOM){
            // replace the coresponding pool with the tmpPoses.
            poolMPoses = JSON.parse(JSON.stringify(tmpPoses));
            // redraw the coresponding pool
            redrawPool(poolMPoses, "poolMom");

            // clean up
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseSelectableToMom");
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseToMom");
        }
        else if(selectionState==SELECTION_DAD){
            // replace the coresponding pool with the tmpPoses.
            poolDPoses = JSON.parse(JSON.stringify(tmpPoses));
            // redraw the coresponding pool
            redrawPool(poolDPoses, "poolDad");
            // clean up
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseSelectableToDad");
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseToDad");
        }

        selectionState = SELECTION_OFF;

        // return
        btnGenerate
        .off("click")
        .on("click", callbackForBtnGenerate);
        btnNewCancel.fadeOut();
        btnNewApply.fadeOut();
        btnNewMom.fadeIn();
        btnNewDad.fadeIn();
        $("#poolMom .poolPoseWrap, #poolDad .poolPoseWrap").fadeIn();
    });

    btnNewCancel.on("click", function(){
        if(selectionState==SELECTION_MOM){
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseSelectableToMom");
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseToMom");
        }
        if(selectionState==SELECTION_DAD){
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseSelectableToDad");
            $("#poolKid .poolPoseWrap, #saved .poolPoseWrap").removeClass("poolPoseToDad");
        }
        selectionState = SELECTION_OFF;
        btnNewCancel.fadeOut();
        btnNewApply.fadeOut();
        btnNewMom.fadeIn();
        btnNewDad.fadeIn();
        $("#poolMom .poolPoseWrap, #poolDad .poolPoseWrap").fadeIn();
    });

    // btns on pose canvas
    var setCallbackForBtnClose = function(){

        $(".btnClosePose")
        .off("click")
        .on("click", function(){
            // find the pose index in the pool
            var self = $(this);
            var index = self.parent().parent().find(".btnClosePose").index(self);
            // delete the coresponding pose in the backstage pool (array)
            var poolref;
            if(self.parent().parent().attr("id")=="poolMom") poolref = poolMPoses;
            else if(self.parent().parent().attr("id")=="poolDad") poolref = poolDPoses;
            else if(self.parent().parent().attr("id")=="saved") poolref = savedPoses;
            poolref.splice(index, 1);
            // update the pool
            redrawPool(poolref, self.parent().parent().attr("id"));
        });

    };
    var setCallbackForBtnLike = function(){
      
        $(".btnLikePose")
        .off("click")
        .on("click", function(){
            // find the pose index in the pool
            var self = $(this);
            var index = self.parent().parent().find(".btnLikePose").index(self);
            // add coresponding pose in the backstage pool (array)
            var poolref;
            var poolid = self.parent().parent().attr("id");
            if (poolid=="poolMom") poolref = poolMPoses;
            else if (poolid=="poolDad") poolref = poolDPoses;
            else if (poolid=="poolKid") poolref = poolKPoses;
            else if (poolid=="saved") poolref = savedPoses;
            savePose(poolref[index]);
            // update the pool
            redrawPool(savedPoses, "saved");
        });
    };

    // sliders on mousemove
    slrView.on("mousemove", function(){
        var self = $(this);
        var rot = parseInt(self.val() / 100 * 360 - 180);
        self.parent().find("span").text(rot);
        if(isPreview){
            drawPose(curPose, previewFrameContext, previewFrameWidth, previewFrameHeight, resulution);
        }
        redrawPool(poolKPoses, "poolKid");
        redrawPool(poolMPoses, "poolMom");
        redrawPool(poolDPoses, "poolDad");
        redrawPool(savedPoses, "saved");
    });
    slrInfluence.mousemove(function(){
        var self = $(this);
        self.parent().find("span").text(self.val());
    });
    slrIntensity.mousemove(function(){
        var self = $(this);
        self.parent().find("span").text(self.val());
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
    var drawPose = function(posesource, cxt, canvW, canvH, elemW, color){
        // get the rotation for the view and create a pose copy
        var rotate = - parseInt(slrView.val() / 100 * 360 - 180);
        var pose = JSON.parse(JSON.stringify(posesource));
        // make change for the view rotation on the pose copy
        var axis = { X: pose[SPINEBASE].X, Z: pose[SPINEBASE].Z};
        if(rotate != 0){
            for (var joint in pose){
                if (joint != SPINEBASE){
                    var x0 = pose[joint].X - axis.X;
                    var z0 = pose[joint].Z - axis.Z;
                    //console.log(x0 + ", " + z0);
                    var r = Math.sqrt(Math.pow(x0, 2) + Math.pow(z0, 2));
                    var alpha = Math.acos(x0/r) / Math.PI * 180;
                    pose[joint].X = r * Math.cos((rotate+alpha)/180*Math.PI) + axis.X;
                    pose[joint].Z = r * Math.sin((rotate+alpha)/180*Math.PI) + axis.Z;
                    //console.log("pose["+joint+"].X: " + pose[joint].X + ", " + "Z: " + pose[joint].Z);
                }
            }
        }

        // draw the pose in the context

        cxt.clearRect(0, 0, canvW, canvH);
        if (color == undefined) var color = "rgba(90, 170, 255, 0.7)";
        cxt.fillStyle = color;
        cxt.strokeStyle = color;
        cxt.lineWidth = 4;
        var r = 5*elemW/300*canvW/elemW;
        // draw bones
        for (var joint in pose) {
            var jnt = pose[joint];
            var x = jnt.X * 1.25*elemW + canvW/2;
            var y = jnt.Y * -1.25*elemW + canvH/2 - 100;

            switch(parseInt(joint)){
                // bases
                // final base boss
                case 0:
                    break;
                // upper bases
                case 4:
                case 8:
                    var jntEnd = pose[NECK];
                    var xEnd = jntEnd.X * 1.25*elemW + canvW/2;
                    var yEnd = jntEnd.Y * -1.25*elemW + canvH/2 - 100;
                    cxt.beginPath();
                    cxt.moveTo(x, y);
                    cxt.lineTo(xEnd, yEnd);
                    cxt.stroke();
                    cxt.closePath();
                    break;
                // down bases
                case 12:
                case 16:
                    var jntEnd = pose[SPINEBASE];
                    var xEnd = jntEnd.X * 1.25*elemW + canvW/2;
                    var yEnd = jntEnd.Y * -1.25*elemW + canvH/2 - 100;
                    cxt.beginPath();
                    cxt.moveTo(x, y);
                    cxt.lineTo(xEnd, yEnd);
                    cxt.stroke();
                    cxt.closePath();
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
                    var jntEnd = pose[joint-1];
                    var xEnd = jntEnd.X * 1.25*elemW + canvW/2;
                    var yEnd = jntEnd.Y * -1.25*elemW + canvH/2 - 100;
                    cxt.beginPath();
                    cxt.moveTo(x, y);
                    cxt.lineTo(xEnd, yEnd);
                    cxt.stroke();
                    cxt.closePath();
                    
                    break;

                case 20:
                case 21:
                case 22:
                case 23:
                case 24:
                    break;

                default:
                    // alert("Oops, your skeleton has wrong number of joints!");
            }
        }

        // draw joints
        for (var joint in pose) {
            if (joint>19) return;
            var jnt = pose[joint];
            var x = jnt.X * 1.25*elemW + canvW/2;
            var y = jnt.Y * -1.25*elemW + canvH/2 - 100;
            cxt.beginPath();
            // cxt.fillRect(x - r/2, y - r/2, r, r);
            cxt.arc(x, y, r, 0, 2*Math.PI);
            cxt.fill();
            cxt.closePath();
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
        // color for preview, poolKid
        var color = "rgba(90, 170, 255, 0.7)";
        // color for poolMom, poolDad
        if(pool == poolMPoses) color = "rgba(255, 160, 17, 0.7)";
        if(pool == poolDPoses) color = "rgba(80, 170, 35, 0.7)";
        // color for saved poses
        if(pool == savedPoses) color = "rgba(255, 97, 97, 0.8)";
        // draw pool
        for(var i=0; i<pool.length; i++)
        {
            if(pool==poolMPoses || pool==poolDPoses) 
                poolDom.append('<div class="poolPoseWrap"><canvas class="poolPose" width="360" height="360"></canvas><span class="btnClosePose"></span><span class="btnLikePose"></span></div>');
            else if(pool==poolKPoses)
                poolDom.append('<div class="poolPoseWrap"><canvas class="poolPose" width="430" height="430"></canvas><span class="btnLikePose"></span></div>');
            else if(pool==savedPoses)
                poolDom.append('<div class="poolPoseWrap"><canvas class="poolPose" width="430" height="430"></canvas><span class="btnClosePose"></span></div>');

            var poolPosesDom = poolDom.find(".poolPose");
            var cnt = poolPosesDom.eq(i).get(0);
            var canvW = cnt.width;
            var canvH = cnt.height;
            var cxt = cnt.getContext("2d");
            var resulution = cxt.canvas.clientWidth;
            drawPose(pool[i], cxt, canvW, canvH, resulution, color);
        }

        setCallbackForBtnClose();
        setCallbackForBtnLike();

        console.log(poolDOMid + " updated.")
    }

    // generate 10 poses
    var generatePoses = function(){
        poolKPoses = [];
        for(var i=0; i<9; i++){
            console.log("////////// #" + i + " photos /////////");
            var pose1 = poolMPoses[parseInt(Math.random()*poolMPoses.length)];
            var pose2 = poolDPoses[parseInt(Math.random()*poolDPoses.length)];
            poolKPoses.push(generatePose(pose1, pose2));
        }
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
        var geneKid = JSON.parse(JSON.stringify(geneMom));

        // crossover
        var crossoverPoint1 = parseInt(Math.random()*25);
        var crossoverPoint2 = crossoverPoint1 + 1 + parseInt(Math.random()*(24-crossoverPoint1));
        console.log("1 " + crossoverPoint1);
        console.log("2 " + crossoverPoint2);
        for (var i=crossoverPoint1; i<crossoverPoint2; i++){
            geneKid[i] = geneDad[i];
        }

        // mutation

        // influence means the range (persontage) of joints which will be mutated. 
        // varies from 0.1 to 1
        var influence = parseInt(slrInfluence.val()) / 100 * 0.9 + 0.1;
        // intensity means the variation range of the mutation for each mutated joint or to what degree the mutated joint is changed.
        // varies from 0 to sqrt(2) (0 to 45 degree's change range)
        var intensity = parseInt(slrIntensity.val()) / 100 * Math.sqrt(2) + 0.5;

        for (var i=1; i<20; i++){
            // give each joint (except SPINEBASE) a chance to mutate
            if(Math.random()<=influence){
                // change it by keep the bone length the same but direction different

                // method one: give it a random direction - result not good
                // var magnitude = Math.sqrt(Math.pow(geneKid[i].X, 2) + Math.pow(geneKid[i].Y, 2) + Math.pow(geneKid[i].Z, 2));
                // var newX = Math.random() * Math.pow(-1, parseInt(Math.random()*2));
                // var varY = Math.random() * Math.sqrt(1 - Math.pow(varX, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                // var newZ = Math.sqrt(1 - Math.pow(newX, 2) - Math.pow(newY, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                // geneKid[i] = {X: newX * magnitude, Y: newY * magnitude, Z: newZ * magnitude};

                // method two: limit the direction variation with in 30 degree
                // var X = geneKid[i].X;
                // var Y = geneKid[i].Y;
                // var Z = geneKid[i].Z;
                // var magnitude = Math.sqrt(Math.pow(X, 2) + Math.pow(Y, 2) + Math.pow(Z, 2));
                // var varX = Math.random() * Math.pow(-1, parseInt(Math.random()*2));
                // var varY = Math.random() * Math.sqrt(1 - Math.pow(varX, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                // var varZ = Math.sqrt(1 - Math.pow(varX, 2) - Math.pow(varY, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                // // variation vector (mag/2 + varX, mag/2 + varY, mag/2 + varZ); add it to the original vector (X, Y, Z)
                // var newX = X + magnitude/2 * varX;
                // var newY = Y + magnitude/2 * varY;
                // var newZ = Z + magnitude/2 * varZ;
                // // normalnize (newX, newY, newZ) to get the direction, and multiple it with mag to ger the final
                // var tmpMagnitude = Math.sqrt(Math.pow(newX, 2) + Math.pow(newY, 2) + Math.pow(newZ, 2));
                // newX = newX/tmpMagnitude*magnitude;
                // newY = newY/tmpMagnitude*magnitude;
                // newZ = newZ/tmpMagnitude*magnitude;
                // geneKid[i] = {X:newX, Y:newY, Z:newZ};

                // method three: limit the direction variation with in desired range degree (intensity)
                var X = geneKid[i].X;
                var Y = geneKid[i].Y;
                var Z = geneKid[i].Z;
                var magnitude = Math.sqrt(Math.pow(X, 2) + Math.pow(Y, 2) + Math.pow(Z, 2));
                var varX = Math.random() * Math.pow(-1, parseInt(Math.random()*2));
                var varY = Math.random() * Math.sqrt(1 - Math.pow(varX, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                var varZ = Math.sqrt(1 - Math.pow(varX, 2) - Math.pow(varY, 2))  * Math.pow(-1, parseInt(Math.random()*2));
                // variation vector (mag/2 + varX, mag/2 + varY, mag/2 + varZ); add it to the original vector (X, Y, Z)
                var newX = X + intensity*magnitude * varX;
                var newY = Y + intensity*magnitude * varY;
                var newZ = Z + intensity*magnitude * varZ;
                // normalnize (newX, newY, newZ) to get the direction, and multiple it with mag to ger the final
                var tmpMagnitude = Math.sqrt(Math.pow(newX, 2) + Math.pow(newY, 2) + Math.pow(newZ, 2));
                newX = newX/tmpMagnitude*magnitude;
                newY = newY/tmpMagnitude*magnitude;
                newZ = newZ/tmpMagnitude*magnitude;
                
                console.log("mutation method two: ");
                console.log("changing joint " + i + ": (" + newX +", "+ newY +", "+ newZ + ")");

                geneKid[i] = {X:newX, Y:newY, Z:newZ};
            }
        }

        // return
        var kid = getCreatrue(geneKid);
        return kid;
    };

    // formate the (x,y,z) skeletal data into gene data (related position one) for GA.
    var getGene = function(creature){
        var jointCnt = creature.length;
        var gene = JSON.parse(JSON.stringify(creature));
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
        var creature = JSON.parse(JSON.stringify(gene));
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

});











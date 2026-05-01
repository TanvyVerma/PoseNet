let video;
let poseNet;
let poses = [];

let squatDown = false;
let squatCount = 0;

let lastMessage = "";
let lastUpdateTime = 0;

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  poseNet = ml5.poseNet(video, {
    detectionType: "single"
  }, modelLoaded);

  poseNet.on("pose", function(results) {
    poses = results;
  });
}

function modelLoaded() {
  updateMessage("PoseNet Loaded!");
}

function draw() {
  image(video, 0, 0);
  drawKeypoints();
  detectSquat();
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;

    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];

      if (keypoint.score > 0.5) {
        fill(0, 255, 0);
        noStroke();
        circle(
          keypoint.position.x,
          keypoint.position.y,
          10
        );
      }
    }
  }
}

function updateMessage(msg) {
  let now = millis();

  if (msg !== lastMessage && now - lastUpdateTime > 700) {
    document.getElementById("feedback").innerText = msg;
    lastMessage = msg;
    lastUpdateTime = now;
  }
}

function detectSquat() {
  if (poses.length === 0) {
    updateMessage("No Person Detected");
    return;
  }

  let pose = poses[0].pose;

  let hip = pose.leftHip;
  let knee = pose.leftKnee;
  let shoulder = pose.leftShoulder;

  // Priority 1: Back posture
  if (shoulder.x > hip.x + 60) {
    updateMessage("Keep Back Straight ⚠️");
    return;
  }

  // Priority 2: Going down
  if (hip.y > knee.y - 10) {
    squatDown = true;
    updateMessage("Good Depth ✅");
    return;
  }

  // Priority 3: Coming up = rep counted
  if (hip.y < knee.y - 90 && squatDown) {
    squatDown = false;
    squatCount++;
    updateMessage("Squat Count: " + squatCount + " 🔥");
    return;
  }

  // Priority 4: Need more depth
  updateMessage("Go Lower ⬇️");
}
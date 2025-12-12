import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer;
let avatar, jawMesh;
let audio, analyser, dataArray;

init();
loadAvatar();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e11);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / (window.innerHeight * 0.6),
    0.1,
    100
  );
  camera.position.set(0, 1.6, 2.5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
  document.getElementById("viewer").appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(light);

  animate();
}

function loadAvatar() {
  const loader = new GLTFLoader();
  loader.load("avatar.glb", (gltf) => {
    avatar = gltf.scene;
    scene.add(avatar);

    avatar.traverse((obj) => {
      if (obj.morphTargetDictionary && obj.morphTargetDictionary["jawOpen"] !== undefined) {
        jawMesh = obj;
      }
    });
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (analyser && jawMesh) {
    analyser.getByteFrequencyData(dataArray);
    const avg =
      dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    jawMesh.morphTargetInfluences[
      jawMesh.morphTargetDictionary["jawOpen"]
    ] = avg * 1.2;
  }

  renderer.render(scene, camera);
}

document.getElementById("talkBtn").onclick = () => {
  audio = new Audio("demo-voice.mp3");
  const ctx = new AudioContext();
  const src = ctx.createMediaElementSource(audio);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  src.connect(analyser);
  analyser.connect(ctx.destination);
  audio.play();
};

document.getElementById("stopBtn").onclick = () => {
  if (audio) audio.pause();
};
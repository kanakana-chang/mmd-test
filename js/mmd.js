import * as THREE from 'three';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';
import { MMDAnimationHelper } from 'three/addons/animation/MMDAnimationHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let scene, camera, renderer, helper;

// 時間を数えるためのオブジェクト
// アニメーションを更新するときに使う
const clock = new THREE.Clock();

Ammo().then((AmmoLib) => {
  Ammo = AmmoLib;

  init();
  animate();
});

function init() {
  // シーンを作成する
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000f1e);

  // カメラを作成する
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 30;

  // レンダラーを作成する
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // 環境光を作成してシーンに追加する
  const ambientLight = new THREE.AmbientLight(0x666666);
  scene.add(ambientLight);

  // 平行光を作成してシーンに追加する
  const directionalLight = new THREE.DirectionalLight(0x666666);
  directionalLight.position.set(-1, 1, 1).normalize();
  scene.add(directionalLight);

  // グリッドを作成してシーンに追加する
  const gridHelper = new THREE.GridHelper(50, 15, 0x00aeeb, 0x00aeeb);
  gridHelper.position.y = -10;
  scene.add(gridHelper);

  // モデルファイル
  const modelFile = 'models/mmd/alicia/Alicia_solid.pmx';

  // モーションファイル
  const vmdFiles = [
    'models/mmd/vmds/2分ループステップ1.vmd',
    'models/mmd/vmds/2分ループステップ5.vmd',
    'models/mmd/vmds/2分ループステップ7.vmd',
    'models/mmd/vmds/2分ループステップ8.vmd',
    'models/mmd/vmds/2分ループステップ10.vmd',
    'models/mmd/vmds/2分ループステップ17.vmd',
    'models/mmd/vmds/2分ループステップ19.vmd',
    'models/mmd/vmds/2分ループステップ20.vmd',
    'models/mmd/vmds/2分ループステップ21.vmd',
    'models/mmd/vmds/2分ループステップ22.vmd',
    'models/mmd/vmds/2分ループステップ23.vmd',
    'models/mmd/vmds/2分ループステップ28.vmd',
    'models/mmd/vmds/2分ループステップ29.vmd',
    'models/mmd/vmds/2分ループステップ31.vmd',
    'models/mmd/vmds/2分ループステップ36.vmd',
    'models/mmd/vmds/2分ループステップ37.vmd'
  ];

  // MMD モデルのアニメーションを処理するためのオブジェクト
  helper = new MMDAnimationHelper({ afterglow: 2.0 });

  // MMD モデルを読み込んでシーンに追加する
  const loader = new MMDLoader();
  loader.load(modelFile, (mesh) => {
    mesh.position.y = -10;

    /** @type {Array<THREE.AnimationClip>} */
    mesh.animations = mesh.animations ?? [];

    // モーションファイルを個別に読み込む
    vmdFiles.forEach((vmdFile, index) => {
      loader.loadAnimation(vmdFile, mesh, (clip) => {
        mesh.animations.push(clip);
        if (index === 0) initGui(mesh);
      });
    });

    // モデルをシーンに追加する
    scene.add(mesh);

    // モデルをヘルパーに追加する
    helper.add(mesh, { animation: mesh.animations, physics: true });
  });

  // カメラの軌道を制御するためのオブジェクト
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 10;
  controls.maxDistance = 100;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  // アニメーションを更新する
  helper.update(clock.getDelta());

  // シーンとカメラをレンダリングする
  renderer.render(scene, camera);
}

function initGui(mesh) {
  const api = {
    // シーンの背景色
    color: scene.background,

    // アニメーションの再生状態
    animation: false,

    // モーションのインデックス
    motionIndex: 0,

    // 次のモーションに切り替え
    changeMotion() {
      this.motionIndex = (this.motionIndex + 1) % mesh.animations.length;
      playMotion(mesh.animations[this.motionIndex]);
    }
  };

  const gui = new GUI();

  // アニメーションを再生・停止するチェックボックスを追加する
  const animationController = gui.add(api, 'animation');
  animationController.name('アニメーション');

  animationController.onChange(() => {
    helper.enable('animation', api.animation);
  });

  // シーンの背景色を変更するカラーピッカーを追加する
  const colorController = gui.addColor(api, 'color');
  colorController.name('背景色');

  colorController.onChange(() => {
    scene.background = new THREE.Color(api.color);
  });

  // モーションを切り替えるボタンを追加する
  const motionController = gui.add(api, 'changeMotion');
  motionController.name('モーションを切り替える');

  // アニメーションプレイヤー
  const mixer = helper.objects.get(mesh).mixer;

  // アニメーションを再生する関数
  function playMotion(clip) {
    mixer.stopAllAction();
    mixer.clipAction(clip).play();
    animationController.setValue(true);
  }
}

// ウィンドウの大きさが変更されたときに実行される
// カメラのアスペクト比と <canvas> のサイズを更新する
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

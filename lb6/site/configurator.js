const stage = document.querySelector('#car-stage');
const start = document.querySelector('#start-3d');
const status = document.querySelector('#car-status');
const paintContact = document.querySelector('#paint-contact');
const paintOptions = document.querySelector('#paint-options');
const angleButtons = document.querySelectorAll('#car-angles button');

async function initialize() {
  start.hidden = true;
  start.disabled = true;
  status.textContent = 'Загружаем 3D-модель…';
  let renderer;
  let environment;

  try {
    const [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('./three/examples/jsm/loaders/GLTFLoader.js'),
      import('./three/examples/jsm/controls/OrbitControls.js'),
      import('./three/examples/jsm/environments/RoomEnvironment.js')
    ]);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
    const generator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = generator.fromScene(room, .08);
    scene.environment = environment.texture;
    room.dispose();
    generator.dispose();

    const { scene: car } = await new GLTFLoader().loadAsync('./models/porsche/car1.gltf');
    const bounds = new THREE.Box3().setFromObject(car);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    car.position.sub(center);
    scene.add(car);

    const materials = new Set();
    car.traverse(object => {
      if (object.isMesh && object.material.name === 'Main_Paint') materials.add(object.material);
    });
    if (!materials.size) throw new Error('Paint material missing');

    function draw() {
      renderer.render(scene, camera);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = size.length() * .72;
    controls.maxDistance = size.length() * 4;
    controls.minPolarAngle = .6;
    controls.maxPolarAngle = Math.PI / 2;
    controls.addEventListener('change', draw);

    const corners = [];
    for (const x of [-size.x / 2, size.x / 2]) {
      for (const y of [-size.y / 2, size.y / 2]) {
        for (const z of [-size.z / 2, size.z / 2]) corners.push(new THREE.Vector3(x, y, z));
      }
    }

    function frameCar(direction) {
      const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
      const up = new THREE.Vector3().crossVectors(direction, right);
      const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const horizontal = vertical * camera.aspect;
      const distance = Math.max(...corners.map(corner =>
        corner.dot(direction) + Math.max(
          Math.abs(corner.dot(right)) / (.80 * horizontal),
          Math.abs(corner.dot(up)) / (.76 * vertical)
        )
      ));
      controls.maxDistance = Math.max(size.length() * 4, distance * 1.5);
      camera.position.copy(direction).multiplyScalar(distance);
      controls.update();
      draw();
    }

    function resize() {
      camera.aspect = stage.clientWidth / stage.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stage.clientWidth, stage.clientHeight, false);
      frameCar(camera.position.clone().normalize());
    }

    camera.position.set(Math.sin(.9), .34, Math.cos(.9));
    function paint() {
      const chosen = paintOptions.querySelector('input:checked');
      materials.forEach(material => material.color.set(chosen.value));
      const color = chosen.closest('label').title;
      const message = `Здравствуйте, Дмитрий! Подбираю автомобиль. В 3D-примере Porsche Carrera GT мне понравился цвет «${color}». Хочу рассмотреть похожий оттенок.`;
      paintContact.href = 'https://t.me/dmittrixx?text=' + encodeURIComponent(message);
      paintContact.hidden = false;
      draw();
    }

    stage.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Интерактивная 3D-модель Porsche Carrera GT');
    start.hidden = true;
    status.textContent = '';
    paintOptions.disabled = false;
    paintOptions.addEventListener('change', paint);
    angleButtons.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        const angle = Number(button.dataset.angle);
        frameCar(new THREE.Vector3(Math.sin(angle), .34, Math.cos(angle)).normalize());
      });
    });
    resize();
    paint();
    new ResizeObserver(resize).observe(stage);
  } catch (error) {
    environment?.dispose();
    renderer?.dispose();
    console.error(error);
    status.textContent = '3D не загрузилось. Проверьте поддержку WebGL и попробуйте снова.';
    start.hidden = false;
    start.disabled = false;
  }
}

start.addEventListener('click', initialize);
const observer = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  observer.disconnect();
  initialize();
}, { rootMargin: '300px' });
observer.observe(stage);

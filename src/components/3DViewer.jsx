import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
// Asegúrate de importar ambos cargadores
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'; // ¡Nuevo!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // ¡Importar Controles!

const ThreeDViewer = ({ modelPath }) => {
  const mountRef = useRef(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    let renderer, scene, camera, controls, object; // Declarar variables fuera del alcance local

    // 1. Configuración de la Escena
    scene = new THREE.Scene();
   //scene.background = new THREE.Color(0xf0f0f0); // Fondo para visibilidad

    // 2. Configuración de la Cámara
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.z = 8;
    camera.position.y = 2.3;

    // 3. Configuración del Renderizador
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    //renderer.setClearColor(0x000000, 0); 

    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);


    // 4. Agregar Luces (necesario para ver el modelo)
    const ambientLight = new THREE.AmbientLight(0xffffff,3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // 5. Cargar el Modelo .obj
    // Asegúrate de que modelPath solo apunte al .obj, por ejemplo: '/models/HSWBottle.obj'
// y que el .mtl esté en el mismo directorio.

// Extrae la ruta base y el nombre del archivo
const modelUrl = new URL(modelPath, window.location.origin);
const modelDir = modelUrl.pathname.substring(0, modelUrl.pathname.lastIndexOf('/') + 1);
const mtlFileName = modelPath.replace('.obj', '.mtl').substring(modelPath.lastIndexOf('/') + 1);
const mtlPath = modelDir + mtlFileName;


const mtlLoader = new MTLLoader();
mtlLoader.setPath(modelDir); // Establece la ruta base para buscar texturas si las hay
mtlLoader.load(
  mtlFileName, // Solo el nombre del archivo .mtl (por ejemplo: 'HSWBottle.mtl')
  (materials) => {
    // 1. Prepara y pre-carga los materiales
    materials.preload();

    // 2. Instancia el OBJLoader y vincula los materiales
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials); // <--- ¡Aplica los materiales cargados!

    // 3. Carga el OBJ
    objLoader.load(
      modelPath, // La ruta completa del .obj
      (object) => {
        // *** IMPORTANTE: No necesitas el 'object.traverse' para aplicar un material básico
        // si el .mtl se cargó correctamente, ya que los materiales de .mtl se aplican automáticamente.
        
        // Si quieres asegurarte de que todo se vea bien (sombreado)
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Asegúrate de que el material usa el modo Standard (Physically Based Rendering - PBR)
            // Si el material cargado es un tipo diferente (ej. MeshLambertMaterial), puedes mantenerlo.
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        object.position.set(0, 0, 0);
        scene.add(object);
      },
      (xhr) => {
        // Progreso de carga del OBJ
        console.log(`OBJ: ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error('Error al cargar el OBJ', error);
      }
    );
  },
  () => {}, // Progreso de carga del MTL (generalmente muy rápido)
  (error) => {
    console.error('Error al cargar el MTL. El modelo se cargará sin materiales.', error);
    // Opcional: Si el MTL falla, puedes cargar el OBJ sin materiales aquí y aplicar un básico.
  }
);

    // 6. Loop de Animación
    const animate = () => {
      requestAnimationFrame(animate);
      if (object) {
let rotationSpeed = 0.01; 
        
        // 2. Modular la velocidad con la posición del ratón
        // Si mousePosition.x es -1, rotationSpeed será -0.01.
        // Si mousePosition.x es 1, rotationSpeed será 0.01.
        // Si mousePosition.x es 0 (centro), rotationSpeed será 0.
        rotationSpeed *= mousePosition.x; 

        // 3. Aplicar la rotación (sin Lerp)
        object.rotation.z += rotationSpeed;       
    };
    renderer.render(scene, camera);
    // Es importante iniciar el loop después de cargar el objeto si quieres usar la rotación
    // Para este ejemplo, la inicialización sin rotación es suficiente.
  }
    animate();

    const handleMouseMove = (event) => {
        if (!mountRef.current) return;

        // Calcula las coordenadas del ratón normalizadas de -1 a 1
        const rect = mountRef.current.getBoundingClientRect();
        const x = ( (event.clientX - rect.left) / rect.width ) * 2 - 1;
        const y = - ( (event.clientY - rect.top) / rect.height ) * 2 + 1;
        
        // Actualiza el estado
        setMousePosition({ x, y });
    };

    const handleResize = () => {
    if (!mountRef.current || !camera || !renderer) return;

    // 1. Obtener las nuevas dimensiones del contenedor (el div con mountRef)
    const newWidth = mountRef.current.clientWidth;
    const newHeight = mountRef.current.clientHeight;

    // 2. Actualizar la relación de aspecto (aspect ratio) de la cámara
    // Esto es crucial para evitar que el modelo se estire o comprima.
    camera.aspect = newWidth / newHeight;

    // 3. Notificar a la cámara que sus parámetros han cambiado
    camera.updateProjectionMatrix();

    // 4. Actualizar el tamaño del renderizador para que coincida con el contenedor
    renderer.setSize(newWidth, newHeight);
};

    window.addEventListener('resize', handleResize);
    mountRef.current.addEventListener('mousemove', handleMouseMove); // Añadir listener

 return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
        // Quitar listener de mouse al desmontar
        mountRef.current.removeEventListener('mousemove', handleMouseMove); 
      }
    };
  }, [modelPath, mousePosition.x, mousePosition.y]); // Dependencias: Asegurarse de que el efecto sepa cuando el ratón se mueve

  // Aplica estilos de Tailwind para el tamaño del contenedor
  return <div ref={mountRef} className="w-full h-96" />;
};

export default ThreeDViewer;

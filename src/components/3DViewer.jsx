import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
// Necesario para convertir la textura 2D en un mapa de entorno optimizado (PMREM)

// Eliminamos la importación de OrbitControls, ya no es necesaria.

const ThreeDViewer = ({ modelPath, bgImageUrl }) => {
  const mountRef = useRef(null);
  // NEW: Ref para guardar el valor de rotación objetivo basado en el scroll
  const scrollRotationRef = useRef(0);
  
  // Eliminamos el estado mousePosition, ya no es necesario.

  useEffect(() => {
    let renderer, scene, camera, object; // Hemos eliminado 'controls'

    // 1. Configuración de la Escena
    scene = new THREE.Scene();
    scene.background = null; // Fondo transparente
    
    // 2. Configuración de la Cámara
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.z = 8;
    camera.position.y = 2.3;

    // 3. Configuración del Renderizador
    renderer = new THREE.WebGLRenderer({
      alpha: true, // Habilita la transparencia
      antialias: true
    });
    renderer.setClearColor(0x000000, 0); // Establece el fondo transparente
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // 4. Agregar Luces (configuración conservada)
    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

   /*  // ⭐ CARGA Y CONFIGURACIÓN DEL MAPA DE ENTORNO (IBL)
    if (bgImageUrl) {
        pmremGenerator = new PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader(); // Necesario en algunas versiones
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            bgImageUrl,
            (texture) => {
                // 1. Configurar la textura como Equirectangular
                texture.mapping = THREE.EquirectangularReflectionMapping;

                // 2. Convertir a un Mapa de Entorno Pre-filtrado (IBL)
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                
                // Limpieza de la textura original
                texture.dispose();

                // 3. Asignar el mapa de entorno a la escena (lo usarán los materiales PBR)
                scene.environment = envMap; 

                // Si el objeto ya cargó, aplicamos el envMap inmediatamente
                if (object) {
                    object.traverse((child) => {
                        if (child instanceof THREE.Mesh && child.material) {
                            child.material.envMap = envMap;
                            child.material.needsUpdate = true;
                        }
                    });
                }
            },
            undefined,
            (error) => {
                console.error('Error al cargar la imagen de fondo para IBL:', error);
            }
        );
    } */

    // --- CARGA DE MODELO (MTL + OBJ) ---
    const modelUrl = new URL(modelPath, window.location.origin);
    const modelDir = modelUrl.pathname.substring(0, modelUrl.pathname.lastIndexOf('/') + 1);
    const mtlFileName = modelPath.replace('.obj', '.mtl').substring(modelPath.lastIndexOf('/') + 1);

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(modelDir);
    mtlLoader.setMaterialOptions({ materialType: THREE.MeshStandardMaterial });

    mtlLoader.load(
      mtlFileName,
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load(
          modelPath,
          (loadedObject) => {
            object = loadedObject; 
            
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // ⭐⭐⭐ MODIFICACIONES CLAVE PARA EL VIDRIO ⭐⭐⭐
                if (child.material) {
                    // 1. Habilitar la transparencia
                    child.material.transparent = true;

                    // 2. Usar un modo de mezcla (Blending) adecuado
                    // THREE.NormalBlending es un buen punto de partida para la mayoría de los casos.
                    child.material.blending = THREE.NormalBlending; 

                    // 3. (Opcional) Fuerza el orden de renderizado
                    // Esto ayuda a evitar artefactos de transparencia (los objetos transparentes deben dibujarse después de los opacos).
                    child.material.depthWrite = false;
                    child.material.needsUpdate = true;
                }
                // ⭐⭐⭐ FIN DE MODIFICACIONES CLAVE ⭐⭐⭐


                }
            });

            object.position.set(0, 0, 0);
            scene.add(object);
          },
          () => {}, 
          (error) => { console.error('Error al cargar el OBJ', error); }
        );
      },
      () => {}, 
      (error) => { console.error('Error al cargar el MTL', error); }
    );

    // --- MANEJADOR DE SCROLL ---
    const handleScroll = () => {
      // Obtenemos la posición vertical de scroll
      const scrollY = window.scrollY;
      
      // Convertimos la posición de scroll a un ángulo de rotación
      // El factor 0.005 controla la sensibilidad. Si es muy rápido, bájalo (ej. 0.002).
      scrollRotationRef.current = scrollY * 0.005; 
    };
    
    // 6. Loop de Animación
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (object) {
        const targetRotationY = scrollRotationRef.current;
        
        // Aplicamos interpolación (Lerp) para rotación suave en el eje Y (vertical)
        // El factor 0.1 controla la suavidad/velocidad de respuesta.
        object.rotation.y += (targetRotationY - object.rotation.y) * 0.1;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // --- MANEJADOR DE REDIMENSIONAMIENTO ---
    const handleResize = () => {
        if (!mountRef.current || !camera || !renderer) return;

        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };

    // --- ADICIÓN Y LIMPIEZA DE LISTENERS ---
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll); // Nuevo Listener

    // Eliminamos: mountRef.current.addEventListener('mousemove', handleMouseMove);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll); // Limpieza
        
        if (mountRef.current && renderer) {
            mountRef.current.removeChild(renderer.domElement);
            // Eliminamos: mountRef.current.removeEventListener('mousemove', handleMouseMove);
        }
    };
  }, [modelPath]); // Las dependencias de mousePosition ya no son necesarias

  // Aplica estilos de Tailwind para el tamaño del contenedor
  return <div ref={mountRef} className="w-full h-96" />;
};

export default ThreeDViewer;
/** Small studio lights reflected by the cornea; no marks painted on the iris. */
export function applyEyeLighting(THREE, root) {
  let reflection;
  root.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material?.name !== 'Morfeu | moist amber eyes') continue;
      if (!reflection) {
        const width = 256, height = 128, pixels = new Float32Array(width * height * 4);
        const key = new THREE.Vector3(-.38, .55, 1).normalize();
        const fill = new THREE.Vector3(.55, .25, 1).normalize();
        for (let y = 0; y < height; y++) {
          const latitude = ((y + .5) / height - .5) * Math.PI;
          for (let x = 0; x < width; x++) {
            const longitude = ((x + .5) / width - .5) * Math.PI * 2;
            const direction = new THREE.Vector3(Math.cos(longitude) * Math.cos(latitude), Math.sin(latitude), Math.sin(longitude) * Math.cos(latitude));
            const radiance = .055 + 22 * Math.exp(-2 * (1 - direction.dot(key)) / .0036) + 3 * Math.exp(-2 * (1 - direction.dot(fill)) / .005);
            const index = (y * width + x) * 4;
            pixels[index] = radiance;
            pixels[index + 1] = radiance * .98;
            pixels[index + 2] = radiance * .93;
            pixels[index + 3] = 1;
          }
        }
        reflection = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
        reflection.name = 'Morfeu | small reflected studio lights';
        reflection.mapping = THREE.EquirectangularReflectionMapping;
        reflection.colorSpace = THREE.LinearSRGBColorSpace;
        reflection.needsUpdate = true;
      }
      material.envMap = reflection;
      material.envMapIntensity = 1;
      material.needsUpdate = true;
    }
  });
}

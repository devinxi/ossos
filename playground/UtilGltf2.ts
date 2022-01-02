import * as THREE from "three";
import { Material } from "three";
import Gltf2 from "../src/parsers/gltf2/index";
import { Primitive } from "../src/parsers/gltf2/Mesh";

class UtilGltf2 {
  static primitiveGeo(prim: Primitive) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(prim.position!.data!, prim.position!.componentLen)
    );

    //console.log( prim );

    if (prim.indices) geo.setIndex(new THREE.BufferAttribute(prim.indices!.data!, 1));
    if (prim.normal)
      geo.setAttribute(
        "normal",
        new THREE.BufferAttribute(prim.normal!.data!, prim.normal.componentLen)
      );
    if (prim.texcoord_0)
      geo.setAttribute(
        "uv",
        new THREE.BufferAttribute(prim.texcoord_0!.data!, prim.texcoord_0.componentLen)
      );

    if (prim.joints_0 && prim.weights_0) {
      geo.setAttribute(
        "skinWeight",
        new THREE.BufferAttribute(prim.weights_0!.data!, prim.weights_0.componentLen)
      );
      geo.setAttribute(
        "skinIndex",
        new THREE.BufferAttribute(prim.joints_0!.data!, prim.joints_0.componentLen)
      );
    }

    return geo;
  }

  static loadMesh(gltf: Gltf2, name: string | undefined = undefined, mat: Material | null = null) {
    const o = gltf.getMesh(name)!;
    let geo, prim, pmat;

    if (o.primitives.length == 1) {
      prim = o.primitives[0];

      if (mat) pmat = mat;
      else if (prim.materialIdx != null) pmat = this.loadMaterial(gltf, prim.materialIdx);

      geo = this.primitiveGeo(prim);
      return new THREE.Mesh(geo, pmat);
    } else {
      let mesh, m, c;
      const grp = new THREE.Group();
      for (prim of o.primitives) {
        if (mat) {
          pmat = mat;
        } else if (prim.materialIdx != null) {
          pmat = this.loadMaterial(gltf, prim.materialIdx);
        }

        geo = this.primitiveGeo(prim);
        mesh = new THREE.Mesh(geo, pmat);

        grp.add(mesh);
      }
      return grp;
    }
  }

  static loadMaterial(gltf: Gltf2, id: number) {
    const config = {
      color: null as any
    };
    const m = gltf.getMaterial(id);

    if (m) {
      if (m.baseColorFactor) {
        config.color = new THREE.Color(
          m.baseColorFactor[0],
          m.baseColorFactor[1],
          m.baseColorFactor[2]
        );
      }
    }

    return new THREE.MeshPhongMaterial(config);
  }
}

export { UtilGltf2, Gltf2 };

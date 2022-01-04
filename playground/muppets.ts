import { quat, vec3 } from "gl-matrix";
import { Material, RawShaderMaterial } from "three";
import { Armature, Gltf2, Pose, Animator, Clip, SkinMTX } from "../src/ossos";

export const Skeleton = Armature;

import BoneViewMesh from "./skeleton/BoneViewMesh";
import SkinMTXMaterial from "./skeleton/SkinMTXMaterial";
import { UtilGltf2 } from "./UtilGltf2.js";

export class CharacterUtils {
  static newBoneView(arm: Armature, pose?: Pose | null, meshScl?: number, dirScl?: number) {
    const boneView = new BoneViewMesh(arm);

    // Because of the transform on the Armature itself, need to scale up the bones
    // to offset the massive scale down of the model
    if (meshScl) (boneView.material as RawShaderMaterial).uniforms.meshScl.value = meshScl;
    if (dirScl) (boneView.material as RawShaderMaterial).uniforms.dirScl.value = dirScl;

    // Set Initial Data So it Renders
    boneView.updateFromPose(pose || (arm as unknown as Pose)); // arm.newPose().updateWorld( true )

    return boneView;
  }

  static skinMtxMesh(gltf: Gltf2, arm: Armature, base = "cyan") {
    const mat = new SkinMTXMaterial(base, arm.getSkinOffsets()![0]); // 3JS Example of Matrix Skinning GLSL Code
    return UtilGltf2.loadMesh(gltf, undefined, mat); // Pull Skinned Mesh from GLTF
  }

  static animationClipFromGltf(gltf: Gltf2) {
    return Clip.fromGLTF2(gltf.getAnimation(0));
  }

  static skeletonFromGltf(gltf: Gltf2, defaultBoneLen = 0.07) {
    const skin = gltf.getSkin(undefined)!;
    const arm = new Armature();

    // Create Armature
    for (let j of skin.joints) {
      arm.addBone(j.name!, j.parentIndex!, j.rotation as quat, j.position as vec3, j.scale as vec3);
    }

    // Bind
    arm.bind(SkinMTX, 0.07);

    // Save Offsets if available
    arm.offset.set(skin.rotation as quat, skin.position as vec3, skin.scale as vec3);
    //if( skin.rotation ) arm.offset.rot.copy( skin.rotation );
    //if( skin.position ) arm.offset.pos.copy( skin.position );
    //if( skin.scale )    arm.offset.scl.copy( skin.scale );

    return arm;
  }
}

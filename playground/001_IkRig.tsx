// App.add((debug.pnt = new ShapePointsMesh()));
// App.add((debug.ln = new DynLineMesh()));

import { Gltf2 } from "../examples/threejs/_lib/UtilGltf2.js";
import UtilArm from "../examples/threejs/_lib/UtilArm.js";

import { BipedRig } from "../src/ikrig/index";

import { createEffect, extend, prepare, useContext } from "solid-three";
import ShapePointsMesh from "../examples/threejs/_lib/ShapePointsMesh";
import { Pose } from "../src/parsers/gltf2/Pose.js";
import { DebugPointsContext, DebugPoint } from "./debug/debug";

function createCharacter(gltf: Gltf2) {
  const arm = UtilArm.armFromGltf(gltf); // Armature Setup Boiler Plate Abstracted
  const boneView = UtilArm.newBoneView(arm); // BoneView for 3JS Boiler Plate Abstracted
  const mesh = UtilArm.skinMtxMesh(gltf, arm); // Create a Skinned Mesh for 3JS Boiler Plate Abstracted
  const pose = arm.newPose(); // Working Pose to save IK Results
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const gltf = await Gltf2.fetch("../examples/_res/models/nabba/nabba.gltf");
const arm = UtilArm.armFromGltf(gltf); // Armature Setup Boiler Plate Abstracted
const boneView = UtilArm.newBoneView(arm); // BoneView for 3JS Boiler Plate Abstracted
const mesh = UtilArm.skinMtxMesh(gltf, arm); // Create a Skinned Mesh for 3JS Boiler Plate Abstracted
const pose = arm.newPose(); // Working Pose to save IK Results

export function Example() {
  const value = useContext(DebugPointsContext);
  const apos = [0.3, 0.6, -0.1];
  const lpos = [0.2, 0.1, 0.1];
  createEffect(() => {
    const rig = new BipedRig();
    rig.autoRig(arm);

    // When Skinning BindPose is not a TPose, Need to create or set it
    // somehow, then use that to load the rig
    //   createOrLoad_TPose( pose );
    //   pose.updateWorld();
    //   rig.bindPose( pose );
    //   rig.useSolversForRetarget( pose );

    // BUT if The Skin BindPose is a TPose, Can get away using Armature instead of pose.
    rig.bindPose(pose); // Late Binding of TPose for the chains: Rigs only work with TPoses
    rig.useSolversForRetarget(pose); // Use Default Solvers for known chains, Should Happen After Bind

    rig.armL!.solver.setTargetPos(apos).setTargetPole([0, 0, -1]);
    rig.legL!.solver.setTargetPos(lpos).setTargetPole([0.5, 0, 0.5]);
    rig.footL!.solver.setTargetDir([0, 0, 1], [0, 1, 0]);
    rig.spine!.solver.setEndDir([0, 1, 0], [0, 0, 1]).setEndDir([0, 1, 0], [0.5, 0, 0.5]);
    rig.head!.solver.setTargetDir([0, 0.5, 0.5], [0, 1, 0]);

    rig.hip!.solver.setMovePos([0, -0.3, 0], false).setTargetDir([-0.5, 0, 0.5], [0, 1, 0]);

    rig.resolveToPose(pose, {
      pnt: value
    }); // Run All Solvers, Store Results in a Pose
    boneView.updateFromPose(pose.updateWorld()); // Update BoneView with new Pose
    arm.updateSkinFromPose(pose);
  });
  return (
    <>
      {prepare(value)}
      {prepare(boneView)}
      {prepare(mesh)}
      <DebugPoint point={apos} size={1} />
      <DebugPoint point={lpos} size={1} />
    </>
  );
}

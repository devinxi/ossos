import { Gltf2 } from "./UtilGltf2";
import { CharacterUtils as ArmatureUtils } from "./muppets";
import { vec3 } from "gl-matrix";
import Transform from "../src/maths/Transform";
import { Animator } from "../src/animation/index";
import { BipedRig } from "../src/ikrig/index";
import BipedIKPose from "../src/ikrig/animation/BipedIKPose";
import { Accessor, createResource, prepare, Show, useFrame } from "solid-three";
import { Armature, Pose } from "../src/ossos";
import BoneViewMesh from "./BoneViewMesh";
import { IKPoseVisualize } from "./IKPoseVisualize";
import {
  AnimationAction,
  AnimationBlendMode,
  AnimationClip,
  AnimationMixer,
  AnimationObjectGroup,
  Event,
  EventListener,
  Object3D
} from "three";

export const V0 = vec3.create();
export const V1 = vec3.create();
export const T0 = new Transform();

class MixamoAnimator extends Animator {
  constructor() {
    super();
  }

  async load(url: string) {
    const gltf = await Gltf2.fetch(url);
    const clip = ArmatureUtils.animationClipFromGltf(gltf!);

    this.setClip(clip);
    this.inPlace = true;
  }
}

class BipedAnimationMixer {
  //#region MAIN
  animator = new Animator();
  ikPose = new BipedIKPose();
  arm: Armature | null = null;
  rig: BipedRig | null = null;
  boneView: BoneViewMesh | null = null;

  // current state of the animation
  pose: Pose | null = null;

  debug: boolean = false;
  onTick = null;
  constructor() {}

  root: Object3D<Event> | AnimationObjectGroup | null = null;

  time!: number;
  timeScale!: number;

  clipAction(
    clip: AnimationClip,
    root?: Object3D<Event> | AnimationObjectGroup,
    blendMode?: AnimationBlendMode
  ): AnimationAction {
    throw new Error("Method not implemented.");
  }
  existingAction(
    clip: AnimationClip,
    root?: Object3D<Event> | AnimationObjectGroup
  ): AnimationAction | null {
    throw new Error("Method not implemented.");
  }
  stopAllAction(): AnimationMixer {
    throw new Error("Method not implemented.");
  }
  setTime(timeInSeconds: number): AnimationMixer {
    throw new Error("Method not implemented.");
  }
  getRoot(): Object3D<Event> | AnimationObjectGroup {
    throw new Error("Method not implemented.");
  }
  uncacheClip(clip: AnimationClip): void {
    throw new Error("Method not implemented.");
  }
  uncacheRoot(root: Object3D<Event> | AnimationObjectGroup): void {
    throw new Error("Method not implemented.");
  }
  uncacheAction(clip: AnimationClip, root?: Object3D<Event> | AnimationObjectGroup): void {
    throw new Error("Method not implemented.");
  }
  addEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): void {
    throw new Error("Method not implemented.");
  }
  hasEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): boolean {
    throw new Error("Method not implemented.");
  }
  removeEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): void {
    throw new Error("Method not implemented.");
  }
  dispatchEvent(event: Event): void {
    throw new Error("Method not implemented.");
  }

  setClipFromGltf(name: string, gltf: Gltf2) {
    const clip = ArmatureUtils.animationClipFromGltf(gltf!);

    this.animator.setClip(clip);
    this.animator.inPlace = true;
  }
  //#endregion
  async load(url: string) {
    const gltf = await Gltf2.fetch(url);
    const clip = ArmatureUtils.animationClipFromGltf(gltf!);

    this.animator.setClip(clip);
    this.animator.inPlace = true;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    this.arm = ArmatureUtils.skeletonFromGltf(gltf!, 0.07);
    this.pose = this.arm.newPose();
    this.pose
      .updateWorld() // Mixamo Stuff has an Offset Transform, Compute Proper WS Transforms...
      .updateBoneLengths(0.01); // Then use it to get the correct bone lengths for use in IK

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    this.rig = new BipedRig();
    if (!this.rig.autoRig(this.arm)) console.log("AutoRig was Incomplete");

    this.rig
      .bindPose(this.pose) // Setup Chains & Alt Directions, Pose should be a TPose of the character
      .updateBoneLengths(this.pose) // Apply BoneLengths to Rig since they're different from ARM.
      .useSolversForRetarget(this.pose); // Setup Solvers

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // this.boneView = ArmatureUtils.newBoneView(this.arm, this.pose!, 2, 1);

    return this;
  }

  update(dt: number) {
    // uses gltf animation to drive pose
    this.animator
      .update(dt) // Move Animation Forward
      .applyPose(this.pose!); // Apply Animation local space transform to Pose

    this.pose!.updateWorld(); // Update the Pose's WorldSpace Transforms

    // this.boneView!.updateFromPose(this.pose); // Update Source's Bone View Rendering

    this.ikPose.computeFromRigPose(this.rig!, this.pose!); // Compute IK Pose Data from Animation Pose
    if (this.debug) {
      IKPoseVisualize.show(this.rig!, this.pose!, this.ikPose); // Visualize IK Data Over Src Bone View
    }
  }
}

export function createMixamoRig(url: Accessor<string>) {
  const rig = new BipedAnimationMixer();
  const [s, props] = createResource(url, async url => {
    await rig.load(url);
    return rig;
  });

  useFrame((_, dt) => {
    if (!s.loading) {
      rig.update(dt);
    }
  });

  return [rig, s, props] as const;
}

import { Gltf2 } from "./UtilGltf2";
import { CharacterUtils as ArmatureUtils } from "./muppets";
import { vec3 } from "gl-matrix";
import Transform from "../src/maths/Transform";
import { Animator, Clip } from "../src/animation/index";
import { BipedRig } from "../src/ikrig/index";
import BipedIKPose from "../src/ikrig/animation/BipedIKPose";
import { Accessor, createResource, prepare, Show, useFrame } from "solid-three";
import { Armature, Pose } from "../src/ossos";
import BoneViewMesh from "./skeleton/BoneViewMesh";
import { IKPoseKelper } from "./IKPoseVisualize";
import {
  AnimationAction,
  AnimationBlendMode,
  AnimationClip,
  AnimationMixer,
  AnimationObjectGroup,
  Event,
  EventListener,
  KeyframeTrack,
  Object3D,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack
} from "three";
import { GLTFLoader } from "three-stdlib";
import QuatTrack from "../src/animation/tracks/QuatTrack";
import { Character } from "./character";

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

class CharacterAnimationMixer extends AnimationMixer {
  constructor(character: Character) {
    super(undefined as any);
    this.character = character;
  }

  character: Character;
  ikPose = new BipedIKPose();

  update(delta: number) {
    super.update(delta);
    this.character.update(delta);
  }
}

class CharacterAnimationClip extends AnimationClip {
  constructor(
    name?: string,
    duration?: number,
    tracks?: KeyframeTrack[],
    blendMode?: AnimationBlendMode
  ) {
    super(name, duration, tracks, blendMode);
  }
}

class IKSkeleton {
  constructor(
    public pose: Pose,
    public rig: BipedRig,
    public armature: Armature,
    public ikPose: BipedIKPose
  ) {}
}

export function createAnimations<T extends { [key: string]: string }>(obj: T) {
  const [data] = createResource(
    async () =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(obj).map(async ([name, url]) => {
            const gltf = await Gltf2.fetch(url);
            const clip = ArmatureUtils.animationClipFromGltf(gltf!);
            let threejsClip = BipedAnimationMixer.toThreeJSClip(clip);
            threejsClip.name = name;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            let arm = ArmatureUtils.skeletonFromGltf(gltf!, 0.07);
            let pose = arm.newPose();
            pose
              .updateWorld() // Mixamo Stuff has an Offset Transform, Compute Proper WS Transforms...
              .updateBoneLengths(0.01); // Then use it to get the correct bone lengths for use in IK

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            let rig = new BipedRig();
            if (!rig.autoRig(arm)) console.log("AutoRig was Incomplete");

            rig
              .bindPose(pose) // Setup Chains & Alt Directions, Pose should be a TPose of the character
              .updateBoneLengths(pose) // Apply BoneLengths to Rig since they're different from ARM.
              .useSolversForRetarget(pose); // Setup Solvers

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // this.boneView = ArmatureUtils.newBoneView(this.arm, this.pose!, 2, 1);
            threejsClip.name;
            return [name, [threejsClip, arm, rig, pose]];
          })
        )
      ) as { [key in keyof T]: AnimationClip | null }
  );

  // clips.forEach(clip =>
  //   Object.defineProperty(actions, clip.name, {
  //     enumerable: true,
  //     get() {
  //       if (actualRef.current) {
  //         return (
  //           lazyActions.current[clip.name] ||
  //           (lazyActions.current[clip.name] = mixer.clipAction(clip, actualRef.current))
  //         );
  //       }
  //     }
  //   })
  // );

  effect: {
    console.log(data());
  }

  return [data] as const;
}

type Api<T extends AnimationClip> = {
  ref: React.MutableRefObject<Object3D | undefined | null>;
  clips: AnimationClip[];
  mixer: AnimationMixer;
  names: T["name"][];
  actions: { [key in T["name"]]: AnimationAction | null };
};

export function useAnimations<T extends AnimationClip>(
  clips: T[]
  // root?: React.MutableRefObject<Object3D | undefined | null> | Object3D
): Api<T> {
  let ref = { current: null as Object3D | undefined | null };

  const setRef = (o: Object3D) => {
    ref.current = o;
  };
  // eslint-disable-next-line prettier/prettier
  let mixer = new AnimationMixer(undefined as unknown as Object3D);
  const lazyActions: any = {};
  const api = (() => {
    const actions = {} as { [key in T["name"]]: AnimationAction | null };
    clips.forEach(clip => {
      console.log(clip);
      Object.defineProperty(actions, clip[0].name, {
        enumerable: true,
        get() {
          ref.current;
          if (ref) {
            return (
              lazyActions[clip[0].name] ||
              (lazyActions[clip[0].name] = mixer.clipAction(clip[0], ref.current!))
            );
          }
        }
      });
    });
    return { ref: setRef, clips, actions, names: clips.map(c => c[0].name), mixer };
  })();

  useFrame((state, delta) => mixer.update(delta));

  // React.useEffect(() => {
  //   const currentRoot = actualRef.current;
  //   return () => {
  //     // Clean up only when clips change, wipe out lazy actions and uncache clips
  //     lazyActions.current = {};
  //     Object.values(api.actions).forEach(action => {
  //       if (currentRoot) {
  //         mixer.uncacheAction(action as AnimationClip, currentRoot);
  //       }
  //     });
  //   };
  // }, [clips]);
  return api as any;
}

class BipedAnimationMixer {
  //#region MAIN

  animator: AnimationMixer;
  ikPose = new BipedIKPose();
  arm: Armature | null = null;
  rig: BipedRig | null = null;
  boneView: BoneViewMesh | null = null;

  // current state of the animation
  pose: Pose | null = null;

  debug: boolean = false;
  onTick = null;
  constructor() {
    this.object = {};
    this.animator = new AnimationMixer(this.object);
  }

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

    // this.animator.setClip(clip);
    // this.animator.inPlace = true;
  }
  obj = { skeleton: null };
  //#endregion
  async load(url: string) {
    const gltf = await Gltf2.fetch(url);
    const clip = ArmatureUtils.animationClipFromGltf(gltf!);

    // const data = new GLTFLoader().load(url, console.log, console.log, console.error);

    // console.log(clip, Clip.toThreeJSClip(clip));

    // this.animator.setClip(clip);
    // this.animator.inPlace = true;

    if (!this.pose) {
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
      this.obj.skeleton = this.pose;

      //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      // this.boneView = ArmatureUtils.newBoneView(this.arm, this.pose!, 2, 1);
    }

    let threejsClip = BipedAnimationMixer.toThreeJSClip(clip);

    this.animator.stopAllAction();
    this.animator.clipAction(threejsClip, this.obj).play();
    return this;
  }

  static toThreeJSClip(clip: Clip): AnimationClip {
    const tracks = clip.tracks
      .map(track => {
        if (track instanceof QuatTrack) {
          return new QuaternionKeyframeTrack(
            `.bones[${track.boneIndex}].rot`,
            clip.timeStamps[track.timeStampIndex] as unknown as any[],
            track.values as unknown as any[]
          );
        } else {
          return new VectorKeyframeTrack(
            `.bones[${track.boneIndex}].pos`,
            clip.timeStamps[track.timeStampIndex] as unknown as any[],
            track.values as unknown as any[]
          );
        }
      })
      .filter(Boolean);
    const clip3 = new AnimationClip(clip.name, clip.duration, tracks);
    return clip3;
  }

  update(dt: number) {
    this.animator?.update(dt);
    // uses gltf animation to drive pose
    // this.animator
    //   .update(dt) // Move Animation Forward
    //   .applyPose(this.pose!); // Apply Animation local space transform to Pose

    this.pose!.updateWorld(); // Update the Pose's WorldSpace Transforms

    // this.boneView!.updateFromPose(this.pose); // Update Source's Bone View Rendering

    this.ikPose.computeFromRigPose(this.rig!, this.pose!); // Compute IK Pose Data from Animation Pose
    // if (this.debug) {
    IKPoseKelper.show(this.rig!, this.pose!, this.ikPose); // Visualize IK Data Over Src Bone View
    // }
  }
}

export function createMixamoRig(url: Accessor<string>) {
  const rig = new BipedAnimationMixer();
  const [s, props] = createResource(url, async url => {
    try {
      await rig.load(url);
      return rig;
    } catch (e) {
      console.error(e);
    }
  });

  useFrame((_, dt) => {
    if (!s.loading) {
      rig.update(dt);
    }
  });

  return [rig, s, props] as const;
}

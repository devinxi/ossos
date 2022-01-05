import {
  Accessor,
  ComponentProps,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  Show
} from "solid-js";
import { extend, GroupProps, Overwrite, prepare, useFrame, useThree } from "solid-three";
import BoneViewMesh from "./skeleton/BoneViewMesh";
import { CharacterUtils } from "./muppets";
import BoneSpring from "../src/bonespring";
import { BipedIKPose, BipedRig, IKRig } from "../src/ikrig";
import { Animator, Armature, Gltf2, Pose } from "../src/ossos";
import Util3js from "./Util.js";
import {
  AnimationClip,
  Object3D,
  Event,
  AnimationObjectGroup,
  AnimationBlendMode,
  AnimationAction,
  AnimationMixer,
  EventListener,
  AnimationActionLoopStyles,
  Group
} from "three";

// class ArmatureAnimationMixer extends Animator implements THREE.AnimationMixer {
//   time: number;
//   timeScale: number;
//   clipAction(
//     clip: AnimationClip,
//     root?: Object3D<Event> | AnimationObjectGroup,
//     blendMode?: AnimationBlendMode
//   ): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   existingAction(
//     clip: AnimationClip,
//     root?: Object3D<Event> | AnimationObjectGroup
//   ): AnimationAction | null {
//     throw new Error("Method not implemented.");
//   }
//   stopAllAction(): AnimationMixer {
//     throw new Error("Method not implemented.");
//   }
//   setTime(timeInSeconds: number): AnimationMixer {
//     throw new Error("Method not implemented.");
//   }
//   getRoot(): Object3D<Event> | AnimationObjectGroup {
//     throw new Error("Method not implemented.");
//   }
//   uncacheClip(clip: AnimationClip): void {
//     throw new Error("Method not implemented.");
//   }
//   uncacheRoot(root: Object3D<Event> | AnimationObjectGroup): void {
//     throw new Error("Method not implemented.");
//   }
//   uncacheAction(clip: AnimationClip, root?: Object3D<Event> | AnimationObjectGroup): void {
//     throw new Error("Method not implemented.");
//   }
//   addEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): void {
//     throw new Error("Method not implemented.");
//   }
//   hasEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): boolean {
//     throw new Error("Method not implemented.");
//   }
//   removeEventListener<T extends string>(type: T, listener: EventListener<Event, T, this>): void {
//     throw new Error("Method not implemented.");
//   }
//   dispatchEvent(event: Event): void {
//     throw new Error("Method not implemented.");
//   }
// }

// class CharacterAnimationAction implements AnimationAction {
//   blendMode: AnimationBlendMode;
//   loop: AnimationActionLoopStyles;
//   time: number;
//   timeScale: number;
//   weight: number;
//   repetitions: number;
//   paused: boolean;
//   enabled: boolean;
//   clampWhenFinished: boolean;
//   zeroSlopeAtStart: boolean;
//   zeroSlopeAtEnd: boolean;
//   play(): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   stop(): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   reset(): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   isRunning(): boolean {
//     throw new Error("Method not implemented.");
//   }
//   isScheduled(): boolean {
//     throw new Error("Method not implemented.");
//   }
//   startAt(time: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   setLoop(mode: AnimationActionLoopStyles, repetitions: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   setEffectiveWeight(weight: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   getEffectiveWeight(): number {
//     throw new Error("Method not implemented.");
//   }
//   fadeIn(duration: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   fadeOut(duration: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   crossFadeFrom(fadeOutAction: AnimationAction, duration: number, warp: boolean): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   crossFadeTo(fadeInAction: AnimationAction, duration: number, warp: boolean): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   stopFading(): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   setEffectiveTimeScale(timeScale: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   getEffectiveTimeScale(): number {
//     throw new Error("Method not implemented.");
//   }
//   setDuration(duration: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   syncWith(action: AnimationAction): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   halt(duration: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   warp(statTimeScale: number, endTimeScale: number, duration: number): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   stopWarping(): AnimationAction {
//     throw new Error("Method not implemented.");
//   }
//   getMixer(): AnimationMixer {
//     throw new Error("Method not implemented.");
//   }
//   getClip(): AnimationClip {
//     throw new Error("Method not implemented.");
//   }
//   getRoot(): Object3D<Event> {
//     throw new Error("Method not implemented.");
//   }
// }

export class Character extends Group {
  //#region MAIN
  skeleton: Armature | null = null;
  rig: BipedRig | null = null;
  mesh: THREE.Object3D | null = null;
  pose: Pose | null = null;
  springs: BoneSpring | null = null;

  constructor() {
    super();
  }
  //#endregion

  setSkeleton(skeleton: Armature) {
    this.skeleton = skeleton;
    return this;
  }

  //#region LOADERS
  setSkeletonFromGltf(gltf: Gltf2, loadTPose = false) {
    // will include skin information if available
    this.skeleton = CharacterUtils.skeletonFromGltf(gltf);
    this.pose = this.skeleton!.newPose();

    if (loadTPose) {
      this.pose.fromGLTF2(gltf.getPose()!);
      this.skeleton!.updateSkinFromPose(this.pose);
    }

    this.pose.updateWorld();
    return this;
  }

  autoRig() {
    this.rig = new BipedRig();
    if (!this.rig.autoRig(this.skeleton!)) console.log("AutoRigging Incomplete");

    this.rig.bindPose(this.pose!); // Late Binding of TPose for the chains: Rigs only work with TPoses
    this.rig.useSolversForRetarget(this.pose!); // Use Default Solvers for known chains, Should Happen After Bind

    return this;
  }

  loadSkinnedMeshFromGltf(gltf: Gltf2, base = "cyan") {
    this.mesh = CharacterUtils.skinMtxMesh(gltf, this.skeleton!, base);
    this.add(this.mesh!);
    return this;
  }

  applyIKPose(ikPose: BipedIKPose) {
    if (!this.pose || !this.rig) {
      return;
    }
    ikPose.applyToRig(this.rig!); // Set IK Data to Solvers on the Rig
    this.rig!.resolveToPose(this.pose); // Execute Solvers & Store Local Space results to Pose
  }

  update(dt: number) {
    if (!this.pose || !this.skeleton) {
      return;
    }

    this.pose!.updateWorld(); // Update the pose's WorldSpace transform

    if (this.springs) {
      this.springs.updatePose(dt, this.pose!, true); // Apply Springs to Pose
    }

    this.skeleton!.updateSkinFromPose(this.pose!); // Update Armature Skinning for Mesh Rendering
  }
}
export class CharacterHelper {
  character!: Character;
  boneView!: BoneViewMesh;

  constructor(character?: Character) {
    if (character) {
      this.setCharacter(character);
    }
  }

  setCharacter(character: Character) {
    this.character = character;
    this.boneView = CharacterUtils.newBoneView(this.character.skeleton!);
    this.boneView.visible = false;
    this.boneView.updateFromPose(this.character.pose!);
  }

  update(dt: number) {
    if (this.boneView) this.boneView.updateFromPose(this.character.pose!); // Update BoneView with new Pose
  }
}
extend({
  Character,
  CharacterHelper
});

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      character: Overwrite<
        GroupProps,
        {
          ref: Character | ((ref: Character) => void);
        }
      >;
      characterHelper: {};
    }
  }
}

import { createControls } from "solid-leva";

export function GLTFCharacter(
  props: ComponentProps<"character"> & { onLoad?: (rig: Character) => void; url: string }
) {
  let rig: Character;
  const controls = createControls(props.name ?? "character", {
    view: {
      options: ["mesh", "bones"]
    }
  });
  const [data] = createResource(
    () => props.url,
    async url => {
      const gltf = await Gltf2.fetch(props.url);
      rig.setSkeletonFromGltf(gltf!, false).autoRig().loadSkinnedMeshFromGltf(gltf!);
      if (props.onLoad) props.onLoad(rig);
      return gltf;
    }
  );

  createEffect(() => {
    let view = controls.view;
    // if (rig && helper.boneView) {
    // helper.boneView.visible = view === "bones";
    // }

    if (rig && rig?.mesh) {
      rig!.mesh!.visible = view === "mesh";
    }
  });

  useHelper(
    () => !data.loading && controls.view === "bones",
    (visible: boolean) => {
      console.log(rig.skeleton);
      if (!rig.skeleton) {
        return null;
      }
      const m = CharacterUtils.newBoneView(rig.skeleton!, rig.pose);

      // @ts-ignore
      m.update = () => m.updateFromPose(rig.pose!);
      console.log(m);
      return m as any;
    }
  );

  return (
    <character
      {...props}
      ref={el => {
        rig = el;
        if (typeof props.ref === "function") {
          props.ref(el);
        }
      }}
    />
  );
}

type Helper = Object3D & {
  update: (dt: number) => void;
};

export function useHelper<T>(o: () => T, getHelper: (args: T) => Helper | null) {
  const helper = {
    current: null as Helper | null
  };

  const scene = useThree(state => state.scene);
  createEffect(() => {
    let object = typeof o === "function" ? (o as any)() : o;
    if (object) {
      helper.current = getHelper(object as T);
      if (helper.current) {
        console.log("hereee");
        scene().add(helper.current);
      }
    }

    onCleanup(() => {
      if (helper.current) {
        scene().remove(helper.current);
      }
    });
  });

  useFrame((_, dt) => {
    if (helper.current?.update) {
      helper.current.update(dt);
    }
  });

  return helper;
}

export function Tina(props: ComponentProps<"character"> & { onLoad?: (rig: Character) => void }) {
  const [rig, setRig] = createSignal<Character | null>(null);

  const controls = createControls("tina", {
    debug: true,
    mesh: true,
    bones: false
  });
  const helper = new CharacterHelper();
  const [data] = createResource(rig, async char => {
    const url = "../examples/_res/models/tina/";
    const gltf = await Gltf2.fetch(url + "tina.gltf");
    char.setSkeletonFromGltf(gltf!, true).autoRig();

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // if (config?.mesh != false) {
    let base = "cyan";
    // if (config.tex)
    base = (await Util3js.loadTexture(url + "initialShadingGroup_albedo.jpg")) as string;

    char.loadSkinnedMeshFromGltf(gltf!, base);
    // }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // if (config.springs) {
    char.springs = new BoneSpring(char.skeleton!);
    char.springs
      .addRotChain("braidr", ["hair.L.002", "hair.L.004", "hair.L.003", "hair.L.005"], 3, 0.8)
      .addRotChain("braidl", ["hair.R.002", "hair.R.004", "hair.R.003", "hair.R.005"], 3, 0.8)
      .addPosChain("boot1", ["breast.L"], 3, 0.2)
      .addPosChain("boot2", ["breast.R"], 3, 0.2);

    char.springs.setRestPose(char.pose!); // Set the resting pose of the springs
    // }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // if (config?.boneView) this._boneView();

    // return this;

    helper.setCharacter(char);
    if (props.onLoad) props.onLoad(char);
    return char;
  });

  return (
    <>
      <character {...props} ref={setRig}></character>
    </>
  );
}

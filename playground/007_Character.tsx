import { Character, GLTFCharacter, Tina, useHelper } from "./character";
import { createAnimations, createMixamoRig, useAnimations } from "./MixamoAnimator";
import { createSignal, Show } from "solid-js";
import { prepare, useFrame } from "solid-three";
import { createControls } from "solid-leva";
import { useGLTF } from "solid-drei";
import { IKPoseKelper } from "./IKPoseVisualize";
import BoneViewMesh from "./skeleton/BoneViewMesh";
import { PoseHelper } from "./PoseHelper";

function Nabba() {
  return;
}

export function Example() {
  const controls = createControls("animation", {
    animation: {
      options: ["Walking", "Rumba", "Running", "Standing", "Ready", "Catwalk"]
    }
  });

  const [clips] = createAnimations({
    Walking: "../examples/_res/anim/Walking.gltf",
    Rumba: "../examples/_res/anim/Rumba.gltf"
  });
  // const [animation, state] = createMixamoRig(
  //   () => `../examples/_res/anim/${controls.animation}.gltf`
  // );

  const [data] = useGLTF(`../examples/_res/anim/Walking.gltf`);

  const [state, setState] = createSignal();
  effect: {
    console.log(data());
    if (clips()) {
      console.log(clips());
      let [clip, arm, rig, pose] = clips()["Walking"];
      const api = useAnimations(Object.values(clips()));
      api.ref({ skeleton: pose });
      setState({
        arm,
        rig,
        pose
      });

      useHelper(
        () => {
          arm, pose;
        },
        ({ arm, pose }) => {
          const boneView = new PoseHelper(pose, arn);
          return boneView;
        }
      );

      console.log(api.actions.Walking?.play());
    }
  }

  // animation.debug = true;

  let tina: Character;
  let nabba: Character;
  let vegeta: Character;

  useFrame((_, dt) => {
    // if (arm)
    // IKPoseKelper.show();
    // if (tina && !state.loading) {
    //   tina.applyIKPose(animation.ikPose);
    //   tina.update(dt);
    // }
    // if (nabba && !state.loading) {
    //   nabba.applyIKPose(animation.ikPose);
    //   nabba.update(dt);
    // }
    // if (vegeta && !state.loading) {
    //   vegeta.applyIKPose(animation.ikPose);
    //   vegeta.update(dt);
    // }
  }, -100);
  return (
    <>
      <GLTFCharacter
        url={"../examples/_res/models/nabba/nabba.gltf"}
        ref={nabba!}
        position={[2, 0, 0]}
      />
      {/* <GLTFCharacter
        url={"../examples/_res/models/vegeta/vegeta.gltf"}
        ref={vegeta!}
        position={[-2, 0, 0]}
      />
      <GLTFCharacter
        url={"../examples/_res/models/tina/tina.gltf"}
        ref={tina!}
        position={[-4, 0, 0]}
      /> */}
    </>
  );
}

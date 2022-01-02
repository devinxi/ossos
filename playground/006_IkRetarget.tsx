import { Nabba, Tina } from "./character";
import { createMixamoRig } from "./MixamoAnimator";
import { createSignal, Show } from "solid-js";
import { prepare, useFrame } from "solid-three";

// window.addEventListener("load", async _ => {
//   App = new Starter({ webgl2: true, grid: true });
//   App.setCamera(0, 20, 4, [0, 0.8, 0]);
//   App.onRender = onRender;

//   App.add((debug.pnt = new ShapePointsMesh()));
//   App.add((debug.ln = new DynLineMesh()));

//   //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   Ref.rigs = [];
//   const aryLoader = [

//     new NabbaRig().load({ boneView: true, mesh: true }).then(rig => {
//       rig.mesh.position.x = 1;
//       rig.boneView.position.x = 2;
//       App.add(rig.mesh);
//       App.add(rig.boneView);
//       Ref.rigs.push(rig);
//     }),

//     new TinaRig().load({ boneView: true, mesh: true, tex: true, springs: true }).then(rig => {
//       rig.mesh.position.x = -1;
//       rig.boneView.position.x = -2;
//       App.add(rig.mesh);
//       App.add(rig.boneView);
//       Ref.rigs.push(rig);
//     })
//   ];

//   await Promise.all(aryLoader);

//   //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   App.render();
// });
// //#endregion

// //#region IK VISUALIZER

// const V0 = vec3.create();
// const V1 = vec3.create();
// const T0 = new Transform();

// class IKPoseVisualize {
//   static show(rig, pose, ikpose) {
//     debug.pnt.reset();
//     debug.ln.reset();

//     this.limb(rig.legL, pose, ikpose.legL);
//     this.limb(rig.legR, pose, ikpose.legR);
//     this.limb(rig.armR, pose, ikpose.armR);
//     this.limb(rig.armL, pose, ikpose.armL);

//     this.swingTwist(rig.footL, pose, ikpose.footL);
//     this.swingTwist(rig.footR, pose, ikpose.footR);
//     this.swingTwist(rig.handR, pose, ikpose.handR);
//     this.swingTwist(rig.handL, pose, ikpose.handL);
//     this.swingTwist(rig.head, pose, ikpose.head);

//     this.swingTwistEnds(rig.spine, pose, ikpose.spine);

//     this.hip(rig.hip, pose, ikpose.hip);
//   }

//   static limb(chain, pose, ik) {
//     const p0 = chain.getStartPosition(pose);

//     //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     // Effector
//     vec3.scaleAndAdd(V0, p0, ik.effectorDir, ik.lenScale * chain.length);

//     debug.pnt.add(p0, 0x00ff00, 1.3);
//     debug.pnt.add(V0, 0x00ffff, 1.3);
//     debug.ln.add(p0, V0, 0x00ff00, 0x00ffff, true);

//     //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     // Pole
//     vec3.scaleAndAdd(V0, p0, ik.poleDir, 0.2);
//     debug.ln.add(p0, V0, 0x00ff00);
//   }

export function Example() {
  const [walking, state] = createMixamoRig(() => "../examples/_res/anim/Walking.gltf");
  const [catwalkRig, catwalkstate] = createMixamoRig(() => "../examples/_res/anim/Catwalk.gltf");

  walking.debug = true;

  const [tina, setTine] = createSignal(null);
  const [nabba, setNabba] = createSignal(null);

  useFrame((_, dt) => {
    if (tina() && !state.loading) {
      tina().applyIKPose(walking.ikPose);
      tina().update(dt);
    }
    if (nabba() && !catwalkstate.loading) {
      nabba().applyIKPose(walking.ikPose);
      nabba().update(dt);
    }
  }, -100);
  return (
    <>
      <Nabba onLoad={setNabba} position={[2, 0, 0]} />
      <Tina onLoad={setTine} position={[-2, 0, 0]} />
      <group>
        {/* <Show when={!state.loading} fallback={<></>}>
          {prepare(walking.boneView)}
        </Show> */}
      </group>
    </>
  );
}

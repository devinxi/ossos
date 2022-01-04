import { vec3 } from "gl-matrix";
import { BipedRig, IKChain } from "../src/ikrig/index";
import BipedIKPose from "../src/ikrig/animation/BipedIKPose";
import { debug } from "./debug/debug";
import { Pose } from "../src/ossos";
import * as IK from "../src/ikrig/IKData";
import { V0, T0, V1 } from "./MixamoAnimator";

export class IKPoseKelper {
  static show(rig: BipedRig, pose: Pose, ikpose: BipedIKPose) {
    debug.pnt.reset();
    debug.ln.reset();

    this.limb(rig.legL!, pose, ikpose.legL);
    this.limb(rig.legR!, pose, ikpose.legR);
    this.limb(rig.armR!, pose, ikpose.armR);
    this.limb(rig.armL!, pose, ikpose.armL);

    this.swingTwist(rig.footL!, pose, ikpose.footL);
    this.swingTwist(rig.footR!, pose, ikpose.footR);
    this.swingTwist(rig.handR!, pose, ikpose.handR);
    this.swingTwist(rig.handL!, pose, ikpose.handL);
    this.swingTwist(rig.head!, pose, ikpose.head);

    this.swingTwistEnds(rig.spine!, pose, ikpose.spine);

    this.hip(rig.hip!, pose, ikpose.hip);
  }

  static limb(
    chain: { getStartPosition: (arg0: any) => any; length: number; },
    pose: any,
    ik: IK.DirScale
  ) {
    const p0 = chain.getStartPosition(pose);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Effector
    vec3.scaleAndAdd(V0, p0, ik.effectorDir, ik.lenScale * chain.length);

    debug.pnt.add(p0, 0x00ff00, 1.3);
    debug.pnt.add(V0 as number[], 0x00ffff, 1.3);
    debug.ln.add(p0, V0, 0x00ff00, 0x00ffff, true);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Pole
    vec3.scaleAndAdd(V0, p0, ik.poleDir, 0.2);
    debug.ln.add(p0, V0, 0x00ff00);
  }

  static swingTwist(chain: { getStartPosition: (arg0: any) => any; }, pose: any, ik: any) {
    const p0 = chain.getStartPosition(pose);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Effector
    vec3.scaleAndAdd(V0, p0, ik.effectorDir, 0.2);
    debug.ln.add(p0, V0, 0x00ffff);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Pole
    vec3.scaleAndAdd(V0, p0, ik.poleDir, 0.2);
    debug.ln.add(p0, V0, 0x00ff00);
  }

  static swingTwistEnds(
    chain: { getStartPosition: (arg0: any) => any; getLastPosition: (arg0: any) => any; },
    pose: any,
    ik: IK.DirEnds
  ) {
    const p0 = chain.getStartPosition(pose);
    const p1 = chain.getLastPosition(pose);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3.scaleAndAdd(V0, p0, ik.startEffectorDir, 0.12); // Effector
    debug.ln.add(p0, V0, 0x00ffff);

    vec3.scaleAndAdd(V0, p0, ik.startPoleDir, 0.12); // Pole
    debug.ln.add(p0, V0, 0x00ff00);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3.scaleAndAdd(V0, p1, ik.endEffectorDir, 0.12); // Effector
    debug.ln.add(p1, V0, 0x00ffff);

    vec3.scaleAndAdd(V0, p1, ik.endPoleDir, 0.12); // Pole
    debug.ln.add(p1, V0, 0x00ff00);
  }

  static hip(chain: IKChain, pose: Pose, ik: IK.Hip) {
    const lnk = chain.first();
    const b = pose.bones[lnk.idx];

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Position Offset
    if (b.pidx == null)
      T0.fromMul(pose.offset, lnk.bind);

    // Use Offset if there is no parent
    else
      pose.getWorldTransform(lnk.pidx, T0).mul(lnk.bind); // Compute Parent's WorldSpace transform, then add local bind pose to it.

    vec3.scaleAndAdd(V0, T0.pos, ik.pos, ik.bindHeight / T0.pos[1]);

    debug.pnt.add(T0.pos as number[], 0x00ff00, 0.5); // Bind Position
    debug.pnt.add(b.world.pos as number[], 0x00ffff, 0.5); // Pose Position
    debug.pnt.add(V0 as number[], 0x000000, 0.3); // Scaled Offset plus Bind Position
    debug.ln.add(T0.pos, V0, 0x00ff00, 0x000000); // Original to Animated Position



    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // IK Direction
    vec3.scaleAndAdd(V1, V0, ik.effectorDir, 0.1);
    debug.ln.add(V0, V1, 0x00ffff);

    vec3.scaleAndAdd(V1, V0, ik.poleDir, 0.1);
    debug.ln.add(V0, V1, 0x00ff00);
  }
}

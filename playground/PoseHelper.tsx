import { Armature, Pose } from "../src/ossos";
import BoneViewMesh from "./skeleton/BoneViewMesh";

class PoseHelper extends BoneViewMesh {
  constructor(pose: Pose, armature: Armature) {
    super(armature);
    this.pose = pose;
  }
  pose: Pose;

  update(dt: number) {
    this.updateFromPose(this.pose); // Update Source's Bone View Rendering
  }
}

- Get Character data from gltf

  - Mesh for what its shape
  - Armature/bones in a T-pose for how to make it stand and move
  - Skin/material for how to render it (skinning depends on bones and stuff)

- Get animation data from somewhere else
  - Armature/bones in a T-pose for how to make it stand and move
  - AnimationClip: data about the animation like frameCount, duration
    - Animation Tracks (actual data about position, rotation and scale by timestamp)


Three Animation Mixer
 - takes three Clips
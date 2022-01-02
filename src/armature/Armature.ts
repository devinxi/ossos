//#region IMPORTS
import type { ISkin }   from './skins/ISkin'
import { vec3, quat }   from 'gl-matrix'
import Transform        from '../maths/Transform'
import Vec3Util         from '../maths/Vec3Util'
import Bone             from './Bone';
import Pose             from './Pose';
//#endregion

class Armature{
    //#region MAIN
    names  : Map<string, number>    = new Map();        // Map Bone Names to The Index in the Bones Array
    bones  : Array<Bone>            = [];               // List of Bones, Will hold resting pose transforms
    skin  ?: ISkin;                                     // Which Skinning System to use?
    offset : Transform              = new Transform();  // Sometimes the Armatures have a Transform Applied to them to render correctly in webgl.
    //#endregion

    //#region METHODS
	addBone( name: string, pidx ?: number, rot ?: quat, pos ?: vec3, scl ?: vec3 ): Bone{
		const idx   = this.bones.length;
		const bone  = new Bone( name, idx );
        
        this.bones.push( bone );
        this.names.set( name, idx );

        if( pos || rot || scl )                 bone.setLocal( rot, pos, scl );
        if( pidx != null && pidx != undefined ) bone.pidx = pidx;
		
		return bone;
    }

    bind( skin ?: new()=>ISkin, defaultBoneLen=1.0 ): this{
        this.updateWorld();                             // Compute WorldSpace Transform for all the bones
        this.updateBoneLengths( defaultBoneLen );       // Compute the length of all the Bones
        if( skin ) this.skin = new skin().init( this ); // Setup Skin BindPose
        return this;
    }
    //#endregion

    //#region GETTERS
    newPose(): Pose{ return new Pose( this ); }

    getBone( bName: string ): Bone | null {
        const idx = this.names.get( bName );
        if( idx == undefined ) return null;
        return this.bones[ idx ];
    }

    getSkinOffsets( ): Array<unknown> | null{
        return ( this.skin )? this.skin.getOffsets() : null;
    }
    //#endregion

    //#region COMPUTE
    updateSkinFromPose( pose: Pose ): Array<unknown> | null{
        if( this.skin ){
            this.skin.updateFromPose( pose );
            return this.skin.getOffsets();
        }
        return null;
    }

    updateWorld(): this{
        const bCnt = this.bones.length;
        let b;

        for( let i=0; i < bCnt; i++ ){
            b = this.bones[ i ];
            if( b.pidx != null ) b.world.fromMul( this.bones[ b.pidx ].world, b.local );
            else                 b.world.copy( b.local );
        }

        return this;
    }

    updateBoneLengths( defaultBoneLen=0 ): this{
        const bCnt = this.bones.length;
        let b: Bone;
        let p: Bone;
        //let v = vec3.create();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=bCnt-1; i >= 0; i-- ){
            //-------------------------------
            b = this.bones[ i ];
            if( b.pidx == null ) continue;  // No Parent to compute its length.

            //-------------------------------
            // Parent Bone, Compute its length based on its position and the current bone.
            p = this.bones[ b.pidx ];       
            
            //p.len = Vec3.len( p.world.pos, b.world.pos ); // Oito
            
            //vec3.sub( v, p.world.pos, b.world.pos );      // gl-matrix
            //p.len = vec3.len( v );
            
            p.len = Vec3Util.len( p.world.pos, b.world.pos ); // Compromise
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( defaultBoneLen != 0 ){
            for( let i=0; i < bCnt; i++ ){
                b = this.bones[ i ];
                if( b.len == 0 ) b.len = defaultBoneLen;
            }
        }

        return this;
    }
    //#endregion
}

export default Armature;
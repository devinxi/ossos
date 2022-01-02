//#region IMPORTS
import type { Pose as GLPose, PoseJoint as GLPoseJoint }   from '../parsers/gltf2/Pose';
import type Armature    from './Armature';
import type Bone        from './Bone';
import { vec3, quat }   from 'gl-matrix';
import Transform        from '../maths/Transform';
import Vec3Util from '../maths/Vec3Util';
//#endregion

class Pose{
    //#region MAIN
    arm     !: Armature;
    bones   !: Bone[];          // Clone of Armature Bones
    offset  = new Transform();  // Pose Transform Offset, useful to apply parent mesh transform

    constructor( arm ?: Armature ){
        if( arm ){
            const bCnt = arm.bones.length;
            this.bones = new Array( bCnt );
            this.arm   = arm;

            for( let i=0; i < bCnt; i++ ){
                this.bones[ i ] = arm.bones[ i ].clone();
            }

            this.offset.copy( this.arm.offset );
        }
    }
    //#endregion


    //#region GETTERS
    /** Get Bone by Name */
    get( bName: string ) : Bone | null{
        const bIdx = this.arm.names.get( bName );
        return ( bIdx !== undefined )? this.bones[ bIdx ] : null;
    }

    clone() : Pose{
        const bCnt  = this.bones.length;
        const p     = new Pose();
        
        p.arm   = this.arm;
        p.bones = new Array( bCnt );
        p.offset.copy( this.offset );

        for( let i=0; i < bCnt; i++ ){
            p.bones[ i ] = this.bones[ i ].clone();
        }

        return p;
    }
    //#endregion


    //#region SETTERS

    setLocalPos( bone: number|string, v: vec3 ): this{
        const bIdx = ( typeof bone === 'string' )? this.arm.names.get( bone ) : bone;        
        //if( bIdx != undefined ) this.bones[ bIdx ].local.pos.copy( v );
        if( bIdx != undefined ) vec3.copy( this.bones[ bIdx ].local.pos, v );
        return this;
    }
    
    setLocalRot( bone: number|string, v: quat ): this{
        const bIdx = ( typeof bone === 'string' )? this.arm.names.get( bone ) : bone;        
        //if( bIdx != undefined ) this.bones[ bIdx ].local.rot.copy( v );
        if( bIdx != undefined ) quat.copy( this.bones[ bIdx ].local.rot, v );
        return this;
    }

    fromGLTF2( glPose: GLPose ): this{
        let jnt : GLPoseJoint;
        let b   : Bone;
        for( jnt of glPose.joints ){
            b = this.bones[ jnt.index ];
            //if( jnt.rot ) b.local.rot.copy( jnt.rot );
            //if( jnt.pos ) b.local.pos.copy( jnt.pos );
            //if( jnt.scl ) b.local.scl.copy( jnt.scl );
            if( jnt.rot ) quat.copy( b.local.rot, jnt.rot as quat );
            if( jnt.pos ) vec3.copy( b.local.pos, jnt.pos as vec3 );
            if( jnt.scl ) vec3.copy( b.local.scl, jnt.scl as vec3 );
        }
        return this;
    }

    copy( pose: Pose ): this{
        const bLen = this.bones.length;

        for( let i=0; i < bLen; i++ ){
            this.bones[ i ].local.copy( pose.bones[ i ].local );
            this.bones[ i ].world.copy( pose.bones[ i ].world );
        }

        return this;
    }

    //#endregion
    

    //#region OPERATIONS
    rotLocal( bone: number|string, deg:number, axis='x' ): this{
        const bIdx = (typeof bone === 'string' )? this.arm.names.get( bone ) : bone;        
        if( bIdx != undefined ){
            const q     = this.bones[ bIdx ].local.rot;
            const rad   = deg * Math.PI / 180;
            switch( axis ){
                //case 'y'    : q.rotY( rad ); break;
                //case 'z'    : q.rotZ( rad ); break;
                //default     : q.rotX( rad ); break;
                case 'y' : quat.rotateY( q, q, rad ); break;
                case 'z' : quat.rotateZ( q, q, rad ); break;
                default  : quat.rotateX( q, q, rad ); break;
            } 
        }else console.warn( 'Bone not found, ', bone );
        return this;
    }

    moveLocal( bone: number|string, offset:vec3 ): this{
        const bIdx = (typeof bone === 'string' )? this.arm.names.get( bone ) : bone;        
        //if( bIdx != undefined ) this.bones[ bIdx ].local.pos.add( offset );
        
        if( bIdx != undefined ){
            const v = this.bones[ bIdx ].local.pos;
            vec3.add( v, v, offset );
        }else console.warn( 'Bone not found, ', bone );
        
        return this;
    }

    sclLocal( bone: number|string, v: number | vec3 ): this{
        const bIdx = (typeof bone === 'string' )? this.arm.names.get( bone ) : bone;        
        if( bIdx != undefined ){
            const scl = this.bones[ bIdx ].local.scl;
            if( v instanceof Array || v instanceof Float32Array )
                //this.bones[ bIdx ].local.scl.copy( v );
                vec3.copy( scl, v as vec3 );
            else
                vec3.set( scl, v, v, v );
                //this.bones[ bIdx ].local.scl.xyz( v, v, v );
        }else console.warn( 'Bone not found, ', bone );

        return this;
    }
    //#endregion


    //#region COMPUTE
    updateWorld( useOffset=true ): this{
        let i, b;
        for( i=0; i < this.bones.length; i++ ){
            b = this.bones[ i ];

            if( b.pidx != null ) b.world.fromMul( this.bones[ b.pidx ].world, b.local );
            else if( useOffset ) b.world.fromMul( this.offset, b.local );
            else                 b.world.copy( b.local );                      
        }

        return this;
    }

    getWorldTransform( bIdx: number, out ?: Transform ): Transform{
        out ??= new Transform();
        
        let bone = this.bones[ bIdx ];  // get Initial Bone
        out.copy( bone.local );         // Starting Transform

        // Loop up the heirarchy till we hit the root bone
        while( bone.pidx != null ){
            bone = this.bones[ bone.pidx ];
            out.pmul( bone.local );
        }

        // Add offset at the end
        out.pmul( this.offset );
        return out;
    }

    getWorldRotation( bIdx: number, out ?: quat ): quat{
        out ??= quat.create();
        
        let bone = this.bones[ bIdx ];      // get Initial Bone
        //out.copy( bone.local.rot );     // Starting Rotation
        quat.copy( out, bone.local.rot );   // Starting Rotation

        // Loop up the heirarchy till we hit the root bone
        while( bone.pidx != null ){
            bone = this.bones[ bone.pidx ];
            //out.pmul( bone.local.rot );
            quat.mul( out, bone.local.rot, out );
        }

        // Add offset at the end
        //out.pmul( this.offset.rot );
        quat.mul( out, this.offset.rot, out );
        return out;
    }

    updateBoneLengths( defaultBoneLen=0 ): this{
        const bCnt = this.bones.length;
        let b: Bone, p: Bone;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute Bone Length from Children to Parent Bones
        // Leaf bones don't have children, so no way to determine this length
        for( let i=bCnt-1; i >= 0; i-- ){
            //-------------------------------
            b = this.bones[ i ];
            if( b.pidx == null ) continue;  // No Parent to compute its length.

            //-------------------------------
            // Parent Bone, Compute its length based on its position and the current bone.
            p       = this.bones[ b.pidx ];       
            p.len   = Vec3Util.len( p.world.pos, b.world.pos );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set a default size for Leaf bones
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

export default Pose;
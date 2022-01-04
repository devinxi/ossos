import { vec3, quat }   from 'gl-matrix';
import Transform        from '../maths/Transform';

class Bone{
    name    : string;           // Name of Bone
    idx     : number;           // Bone Index
    pidx    : number | null;    // Index to Parent Bone if not root
    len     : number;           // Length of the Bone

    local   = new Transform();  // Local Transform of Resting Pose
    world   = new Transform();  // World Transform of Resting Pose

    constructor( name: string, idx: number, len=0 ){
        this.name   = name;
        this.idx    = idx;
        this.pidx   = null;
        this.len    = len;
        // @ts-ignore
        this.local.pos.fromArray = (buf, offset) => {
            vec3.copy(  this.local.pos, buf.subarray(offset, offset+3) );
        }
        
        // @ts-ignore
        this.local.pos.toArray = () => {
            return [...this.local.pos]; 
        }

        // @ts-ignore
        this.local.rot.fromArray = (buf, offset) => {
            quat.copy(  this.local.rot, buf.subarray(offset, offset+4) );
        }
        
        // @ts-ignore
        this.local.rot.toArray = () => {
            return [...this.local.rot]; 
        }
    }

    
    // get _rot() {
    //     return [this.local.rot[0], this.local.rot[1], this.local.rot[2], this.local.rot[3]];
    // }
    // get _pos() {
    //     return [this.local.pos[0], this.local.pos[1], this.local.pos[2]];
    // }

    get pos() {
        return this.local.pos;
    }

    get rot() {
        return this.local.rot;
    }



    setLocal( rot ?: quat, pos ?: vec3, scl ?: vec3 ): this{
        if( rot ) quat.copy( this.local.rot, rot ); // this.local.rot.copy( rot );
        if( pos ) vec3.copy( this.local.pos, pos ); // this.local.pos.copy( pos );
        if( scl ) vec3.copy( this.local.scl, scl ); // this.local.scl.copy( scl );
        return this;
    }


    clone(): Bone{
        const b = new Bone( this.name, this.idx, this.len );
        
        b.pidx = this.pidx;
        b.local.copy( this.local );
        b.world.copy( this.world );
        return b;
    }
}

export default Bone;
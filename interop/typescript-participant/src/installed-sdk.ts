// Operator/package composition, not request data. No mutable registrations.
import {createCodec} from './sdk.js';
import {NS,EXT,GIT} from './codec.js';
export const sdk=createCodec({namespace:NS,
 participant:{schema:EXT,fields:{call_id:'identifier',process_instance_id:'identifier'}},
 effect:{schema:GIT,fields:{workcell_effect_id:'identifier',transaction_sha256:'sha256'}}});

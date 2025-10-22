import{c as o,u as l,k as s}from"./index-BJDVYPr2.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=o("CircleHelp",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function r(){const{user:i}=l(),{viewingClientId:e}=s(),t=(i==null?void 0:i.role)==="therapist"&&e?e:i==null?void 0:i.id,a=`/api/users/${t}`,n=t===(i==null?void 0:i.id),c=(i==null?void 0:i.role)==="therapist"||(i==null?void 0:i.role)==="admin";return{user:i,activeUserId:t,apiPath:a,isViewingSelf:n,isViewingClientData:!n,hasElevatedPermissions:c,isTherapist:(i==null?void 0:i.role)==="therapist",isAdmin:(i==null?void 0:i.role)==="admin",isClient:(i==null?void 0:i.role)==="client"}}export{h as C,r as u};

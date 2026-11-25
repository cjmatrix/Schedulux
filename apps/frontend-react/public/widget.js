(function(j){Object.defineProperty(j,Symbol.toStringTag,{value:"Module"});var Tt,C,mn,_i,be,bn,xn,vn,_r,At,at,yn,mr,br,xr,kn,It={},Ot=[],mi=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ot=Array.isArray;function ue(e,t){for(var r in t)e[r]=t[r];return e}function vr(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function lt(e,t,r){var n,s,i,a={};for(i in t)i=="key"?n=t[i]:i=="ref"?s=t[i]:a[i]=t[i];if(arguments.length>2&&(a.children=arguments.length>3?Tt.call(arguments,2):r),typeof e=="function"&&e.defaultProps!=null)for(i in e.defaultProps)a[i]===void 0&&(a[i]=e.defaultProps[i]);return Et(e,a,n,s,null)}function Et(e,t,r,n,s){var i={type:e,props:t,key:r,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:s??++mn,__i:-1,__u:0};return s==null&&C.vnode!=null&&C.vnode(i),i}function Qe(e){return e.children}function he(e,t){this.props=e,this.context=t}function Pe(e,t){if(t==null)return e.__?Pe(e.__,e.__i+1):null;for(var r;t<e.__k.length;t++)if((r=e.__k[t])!=null&&r.__e!=null)return r.__e;return typeof e.type=="function"?Pe(e):null}function bi(e){if(e.__P&&e.__d){var t=e.__v,r=t.__e,n=[],s=[],i=ue({},t);i.__v=t.__v+1,C.vnode&&C.vnode(i),kr(e.__P,i,t,e.__n,e.__P.namespaceURI,32&t.__u?[r]:null,n,r??Pe(t),!!(32&t.__u),s),i.__v=t.__v,i.__.__k[i.__i]=i,Mn(n,i,s),t.__e=t.__=null,i.__e!=r&&wn(i)}}function wn(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),wn(e)}function yr(e){(!e.__d&&(e.__d=!0)&&be.push(e)&&!Ft.__r++||bn!=C.debounceRendering)&&((bn=C.debounceRendering)||xn)(Ft)}function Ft(){try{for(var e,t=1;be.length;)be.length>t&&be.sort(vn),e=be.shift(),t=be.length,bi(e)}finally{be.length=Ft.__r=0}}function Sn(e,t,r,n,s,i,a,o,l,u,d){var p,h,f,m,y,b,v=n&&n.__k||Ot,g=t.length;for(l=xi(r,t,v,l,g),p=0;p<g;p++)(f=r.__k[p])!=null&&(h=f.__i!=-1&&v[f.__i]||It,f.__i=p,b=kr(e,f,h,s,i,a,o,l,u,d),m=f.__e,f.ref&&h.ref!=f.ref&&(h.ref&&wr(h.ref,null,f),d.push(f.ref,f.__c||m,f)),y==null&&m!=null&&(y=m),4&f.__u?(l=$n(f,l,e),h.__e&&(h.__e=null)):typeof f.type=="function"&&b!==void 0?l=b:m&&(l=m.nextSibling),f.__u&=-7);return r.__e=y,l}function xi(e,t,r,n,s){var i,a,o,l,u,d=r.length,p=d,h=0;for(e.__k=new Array(s),i=0;i<s;i++)(a=t[i])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=e.__k[i]=Et(null,a,null,null,null):ot(a)?a=e.__k[i]=Et(Qe,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=e.__k[i]=Et(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):e.__k[i]=a,l=i+h,a.__=e,a.__b=e.__b+1,o=null,(u=a.__i=vi(a,r,l,p))!=-1&&(p--,(o=r[u])&&(o.__u|=2)),o==null||o.__v==null?(u==-1&&(s>d?h--:s<d&&h++),typeof a.type!="function"&&(a.__u|=4)):u!=l&&(u==l-1?h--:u==l+1?h++:(u>l?h--:h++,a.__u|=4))):e.__k[i]=null;if(p)for(i=0;i<d;i++)(o=r[i])!=null&&(2&o.__u)==0&&(o.__e==n&&(n=Pe(o)),An(o,o));return n}function $n(e,t,r){var n,s;if(typeof e.type=="function"){for(n=e.__k,s=0;n&&s<n.length;s++)n[s]&&(n[s].__=e,t=$n(n[s],t,r));return t}e.__e!=t&&(t&&e.type&&!t.parentNode&&(t=Pe(e)),t=r.insertBefore(e.__e,t||null));do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Lt(e,t){return t=t||[],e==null||typeof e=="boolean"||(ot(e)?e.some(function(r){Lt(r,t)}):t.push(e)),t}function vi(e,t,r,n){var s,i,a,o=e.key,l=e.type,u=t[r],d=u!=null&&(2&u.__u)==0;if(u===null&&o==null||d&&o==u.key&&l==u.type)return r;if(n>(d?1:0)){for(s=r-1,i=r+1;s>=0||i<t.length;)if((u=t[a=s>=0?s--:i++])!=null&&(2&u.__u)==0&&o==u.key&&l==u.type)return a}return-1}function Pn(e,t,r){t[0]=="-"?e.setProperty(t,r??""):e[t]=r==null?"":typeof r!="number"||mi.test(t)?r:r+"px"}function zt(e,t,r,n,s){var i,a;e:if(t=="style")if(typeof r=="string")e.style.cssText=r;else{if(typeof n=="string"&&(e.style.cssText=n=""),n)for(t in n)r&&t in r||Pn(e.style,t,"");if(r)for(t in r)n&&r[t]==n[t]||Pn(e.style,t,r[t])}else if(t[0]=="o"&&t[1]=="n")i=t!=(t=t.replace(yn,"$1")),a=t.toLowerCase(),t=a in e||t=="onFocusOut"||t=="onFocusIn"?a.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+i]=r,r?n?r[at]=n[at]:(r[at]=mr,e.addEventListener(t,i?xr:br,i)):e.removeEventListener(t,i?xr:br,i);else{if(s=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=r??"";break e}catch{}typeof r=="function"||(r==null||r===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&r==1?"":r))}}function Rn(e){return function(t){if(this.l){var r=this.l[t.type+e];if(t[At]==null)t[At]=mr++;else if(t[At]<r[at])return;return r(C.event?C.event(t):t)}}}function kr(e,t,r,n,s,i,a,o,l,u){var d,p,h,f,m,y,b,v,g,P,O,T,D,k,E,$,M=t.type;if(t.constructor!==void 0)return null;128&r.__u&&(l=!!(32&r.__u),i=[o=t.__e=r.__e]),(d=C.__b)&&d(t);e:if(typeof M=="function"){p=a.length;try{if(g=t.props,P=M.prototype&&M.prototype.render,O=(d=M.contextType)&&n[d.__c],T=d?O?O.props.value:d.__:n,r.__c?v=(h=t.__c=r.__c).__=h.__E:(P?t.__c=h=new M(g,T):(t.__c=h=new he(g,T),h.constructor=M,h.render=ki),O&&O.sub(h),h.state||(h.state={}),h.__n=n,f=h.__d=!0,h.__h=[],h._sb=[]),P&&h.__s==null&&(h.__s=h.state),P&&M.getDerivedStateFromProps!=null&&(h.__s==h.state&&(h.__s=ue({},h.__s)),ue(h.__s,M.getDerivedStateFromProps(g,h.__s))),m=h.props,y=h.state,h.__v=t,f)P&&M.getDerivedStateFromProps==null&&h.componentWillMount!=null&&h.componentWillMount(),P&&h.componentDidMount!=null&&h.__h.push(h.componentDidMount);else{if(P&&M.getDerivedStateFromProps==null&&g!==m&&h.componentWillReceiveProps!=null&&h.componentWillReceiveProps(g,T),t.__v==r.__v||!h.__e&&h.shouldComponentUpdate!=null&&h.shouldComponentUpdate(g,h.__s,T)===!1){t.__v!=r.__v&&(h.props=g,h.state=h.__s,h.__d=!1),t.__e=r.__e,t.__k=r.__k,t.__k.some(function(F){F&&(F.__=t)}),Ot.push.apply(h.__h,h._sb),h._sb=[],h.__h.length&&a.push(h),o=Pe(r);break e}h.componentWillUpdate!=null&&h.componentWillUpdate(g,h.__s,T),P&&h.componentDidUpdate!=null&&h.__h.push(function(){h.componentDidUpdate(m,y,b)})}if(h.context=T,h.props=g,h.__P=e,h.__e=!1,D=C.__r,k=0,P)h.state=h.__s,h.__d=!1,D&&D(t),d=h.render(h.props,h.state,h.context),Ot.push.apply(h.__h,h._sb),h._sb=[];else do h.__d=!1,D&&D(t),d=h.render(h.props,h.state,h.context),h.state=h.__s;while(h.__d&&++k<25);h.state=h.__s,h.getChildContext!=null&&(n=ue(ue({},n),h.getChildContext())),P&&!f&&h.getSnapshotBeforeUpdate!=null&&(b=h.getSnapshotBeforeUpdate(m,y)),E=d!=null&&d.type===Qe&&d.key==null?Tn(d.props.children):d,o=Sn(e,ot(E)?E:[E],t,r,n,s,i,a,o,l,u),h.base=t.__e,t.__u&=-161,h.__h.length&&a.push(h),v&&(h.__E=h.__=null)}catch(F){if(a.length=p,t.__v=null,l||i!=null){if(F.then){for(t.__u|=l?160:128;o&&o.nodeType==8&&o.nextSibling;)o=o.nextSibling;i!=null&&(i[i.indexOf(o)]=null),t.__e=o}else if(i!=null)for($=i.length;$--;)vr(i[$])}else t.__e=r.__e;t.__k??(t.__k=r.__k||[]),F.then||Cn(t),C.__e(F,t,r)}}else i==null&&t.__v==r.__v?(t.__k=r.__k,t.__e=r.__e):o=t.__e=yi(r.__e,t,r,n,s,i,a,l,u);return(d=C.diffed)&&d(t),128&t.__u?void 0:o}function Cn(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Cn))}function Mn(e,t,r){for(var n=0;n<r.length;n++)wr(r[n],r[++n],r[++n]);C.__c&&C.__c(t,e),e.some(function(s){try{e=s.__h,s.__h=[],e.some(function(i){i.call(s)})}catch(i){C.__e(i,s.__v)}})}function Tn(e){return typeof e!="object"||e==null||e.__b>0?e:ot(e)?e.map(Tn):e.constructor!==void 0?null:ue({},e)}function yi(e,t,r,n,s,i,a,o,l){var u,d,p,h,f,m,y,b=r.props||It,v=t.props,g=t.type;if(g=="svg"?s="http://www.w3.org/2000/svg":g=="math"?s="http://www.w3.org/1998/Math/MathML":s||(s="http://www.w3.org/1999/xhtml"),i!=null){for(u=0;u<i.length;u++)if((f=i[u])&&"setAttribute"in f==!!g&&(g?f.localName==g:f.nodeType==3)){e=f,i[u]=null;break}}if(e==null){if(g==null)return document.createTextNode(v);e=document.createElementNS(s,g,v.is&&v),o&&(C.__m&&C.__m(t,i),o=!1),i=null}if(g==null)b===v||o&&e.data==v||(e.data=v);else{if(i=g=="textarea"&&v.defaultValue!=null?null:i&&Tt.call(e.childNodes),!o&&i!=null)for(b={},u=0;u<e.attributes.length;u++)b[(f=e.attributes[u]).name]=f.value;for(u in b)f=b[u],u=="dangerouslySetInnerHTML"?p=f:u=="children"||u in v||u=="value"&&"defaultValue"in v||u=="checked"&&"defaultChecked"in v||zt(e,u,null,f,s);for(u in v)f=v[u],u=="children"?h=f:u=="dangerouslySetInnerHTML"?d=f:u=="value"?m=f:u=="checked"?y=f:o&&typeof f!="function"||b[u]===f||zt(e,u,f,b[u],s);if(d)o||p&&(d.__html==p.__html||d.__html==e.innerHTML)||(e.innerHTML=d.__html),t.__k=[];else if(p&&(e.innerHTML=""),Sn(t.type=="template"?e.content:e,ot(h)?h:[h],t,r,n,g=="foreignObject"?"http://www.w3.org/1999/xhtml":s,i,a,i?i[0]:r.__k&&Pe(r,0),o,l),i!=null)for(u=i.length;u--;)vr(i[u]);o&&g!="textarea"||(u="value",g=="progress"&&m==null?e.removeAttribute("value"):m!=null&&(m!==e[u]||g=="progress"&&!m||g=="option"&&m!=b[u])&&zt(e,u,m,b[u],s),u="checked",y!=null&&y!=e[u]&&zt(e,u,y,b[u],s))}return e}function wr(e,t,r){try{if(typeof e=="function"){var n=typeof e.__u=="function";n&&e.__u(),n&&t==null||(e.__u=e(t))}else e.current=t}catch(s){C.__e(s,r)}}function An(e,t,r){var n,s;if(C.unmount&&C.unmount(e),(n=e.ref)&&(n.current&&n.current!=e.__e||wr(n,null,t)),(n=e.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(i){C.__e(i,t)}n.base=n.__P=n.__n=null}if(n=e.__k)for(s=0;s<n.length;s++)n[s]&&An(n[s],t,r||typeof e.type!="function");r||vr(e.__e),e.__c=e.__=e.__e=void 0}function ki(e,t,r){return this.constructor(e,r)}function In(e,t,r){var n,s,i,a;t==document&&(t=document.documentElement),C.__&&C.__(e,t),s=(n=typeof r=="function")?null:r&&r.__k||t.__k,i=[],a=[],kr(t,e=(!n&&r||t).__k=lt(Qe,null,[e]),s||It,It,t.namespaceURI,!n&&r?[r]:s?null:t.firstChild?Tt.call(t.childNodes):null,i,!n&&r?r:s?s.__e:t.firstChild,n,a),Mn(i,e,a),e.props.children=null}function Sr(e){function t(r){var n,s;return this.getChildContext||(n=new Set,(s={})[t.__c]=this,this.getChildContext=function(){return s},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(i){this.props.value!=i.value&&n.forEach(function(a){a.__e=!0,yr(a)})},this.sub=function(i){n.add(i);var a=i.componentWillUnmount;i.componentWillUnmount=function(){n&&n.delete(i),a&&a.call(i)}}),r.children}return t.__c="__cC"+kn++,t.__=e,t.Provider=t.__l=(t.Consumer=function(r,n){return r.children(n)}).contextType=t,t}Tt=Ot.slice,C={__e:function(e,t,r,n){for(var s,i,a;t=t.__;)if((s=t.__c)&&!s.__)try{if((i=s.constructor)&&i.getDerivedStateFromError!=null&&(s.setState(i.getDerivedStateFromError(e)),a=s.__d),s.componentDidCatch!=null&&(s.componentDidCatch(e,n||{}),a=s.__d),a)return s.__E=s}catch(o){e=o}throw e}},mn=0,_i=function(e){return e!=null&&e.constructor===void 0},he.prototype.setState=function(e,t){var r=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=ue({},this.state);typeof e=="function"&&(e=e(ue({},r),this.props)),e&&ue(r,e),e!=null&&this.__v&&(t&&this._sb.push(t),yr(this))},he.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),yr(this))},he.prototype.render=Qe,be=[],xn=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,vn=function(e,t){return e.__v.__b-t.__v.__b},Ft.__r=0,_r=Math.random().toString(8),At="__d"+_r,at="__a"+_r,yn=/(PointerCapture)$|Capture$/i,mr=0,br=Rn(!1),xr=Rn(!0),kn=0;var Re,B,$r,On,ct=0,En=[],N=C,Fn=N.__b,Ln=N.__r,zn=N.diffed,Bn=N.__c,Wn=N.unmount,Dn=N.__;function ut(e,t){N.__h&&N.__h(B,e,ct||t),ct=0;var r=B.__H||(B.__H={__:[],__h:[]});return e>=r.__.length&&r.__.push({}),r.__[e]}function de(e){return ct=1,wi(Qn,e)}function wi(e,t,r){var n=ut(Re++,2);if(n.t=e,!n.__c&&(n.__=[r?r(t):Qn(void 0,t),function(o){var l=n.__N?n.__N[0]:n.__[0],u=n.t(l,o);l!==u&&(n.__N=[u,n.__[1]],n.__c.setState({}))}],n.__c=B,!B.__f)){var s=function(o,l,u){if(!n.__c.__H)return!0;var d=!1,p=n.__c.props!==o;if(n.__c.__H.__.some(function(f){if(f.__N){d=!0;var m=f.__[0];f.__=f.__N,f.__N=void 0,m!==f.__[0]&&(p=!0)}}),i){var h=i.call(this,o,l,u);return d?h||p:h}return!d||p};B.__f=!0;var i=B.shouldComponentUpdate,a=B.componentWillUpdate;B.componentWillUpdate=function(o,l,u){if(this.__e){var d=i;i=void 0,s(o,l,u),i=d}a&&a.call(this,o,l,u)},B.shouldComponentUpdate=s}return n.__N||n.__}function pe(e,t){var r=ut(Re++,3);!N.__s&&Cr(r.__H,t)&&(r.__=e,r.u=t,B.__H.__h.push(r))}function Si(e,t){var r=ut(Re++,4);!N.__s&&Cr(r.__H,t)&&(r.__=e,r.u=t,B.__h.push(r))}function qe(e){return ct=5,ht(function(){return{current:e}},[])}function ht(e,t){var r=ut(Re++,7);return Cr(r.__H,t)&&(r.__=e(),r.__H=t,r.__h=e),r.__}function Ce(e,t){return ct=8,ht(function(){return e},t)}function Pr(e){var t=B.context[e.__c],r=ut(Re++,9);return r.c=e,t?(r.__??(r.__=!0,t.sub(B)),t.props.value):e.__}function $i(){for(var e;e=En.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(Bt),t.__h.some(Rr),t.__h=[]}catch(r){t.__h=[],N.__e(r,e.__v)}}}N.__b=function(e){B=null,Fn&&Fn(e)},N.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Dn&&Dn(e,t)},N.__r=function(e){Ln&&Ln(e),Re=0;var t=(B=e.__c).__H;t&&($r===B?(t.__h=[],B.__h=[],t.__.some(function(r){r.__N&&(r.__=r.__N),r.u=r.__N=void 0})):(t.__h.some(Bt),t.__h.some(Rr),t.__h=[],Re=0)),$r=B},N.diffed=function(e){zn&&zn(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(En.push(t)!==1&&On===N.requestAnimationFrame||((On=N.requestAnimationFrame)||Pi)($i)),t.__H.__.some(function(r){r.u&&(r.__H=r.u,r.u=void 0)})),$r=B=null},N.__c=function(e,t){t.some(function(r){try{r.__h.some(Bt),r.__h=r.__h.filter(function(n){return!n.__||Rr(n)})}catch(n){t.some(function(s){s.__h&&(s.__h=[])}),t=[],N.__e(n,r.__v)}}),Bn&&Bn(e,t)},N.unmount=function(e){Wn&&Wn(e);var t,r=e.__c;r&&r.__H&&(r.__H.__.some(function(n){try{Bt(n)}catch(s){t=s}}),r.__H=void 0,t&&N.__e(t,r.__v))};var Nn=typeof requestAnimationFrame=="function";function Pi(e){var t,r=function(){clearTimeout(n),Nn&&cancelAnimationFrame(t),setTimeout(e)},n=setTimeout(r,35);Nn&&(t=requestAnimationFrame(r))}function Bt(e){var t=B,r=e.__c;typeof r=="function"&&(e.__c=void 0,r()),B=t}function Rr(e){var t=B;e.__c=e.__(),B=t}function Cr(e,t){return!e||e.length!==t.length||t.some(function(r,n){return r!==e[n]})}function Qn(e,t){return typeof t=="function"?t(e):t}function Ri(e,t){for(var r in t)e[r]=t[r];return e}function qn(e,t){for(var r in e)if(r!=="__source"&&!(r in t))return!0;for(var n in t)if(n!=="__source"&&e[n]!==t[n])return!0;return!1}function jn(e,t){var r=t(),n=de({t:{__:r,u:t}}),s=n[0].t,i=n[1];return Si(function(){s.__=r,s.u=t,Mr(s)&&i({t:s})},[e,r,t]),pe(function(){return Mr(s)&&i({t:s}),e(function(){Mr(s)&&i({t:s})})},[e]),r}function Mr(e){try{return!((t=e.__)===(r=e.u())&&(t!==0||1/t==1/r)||t!=t&&r!=r)}catch{return!0}var t,r}function Un(e,t){this.props=e,this.context=t}(Un.prototype=new he).isPureReactComponent=!0,Un.prototype.shouldComponentUpdate=function(e,t){return qn(this.props,e)||qn(this.state,t)};var Hn=C.__b;C.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Hn&&Hn(e)};var rl=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.forward_ref")||3911,Ci=C.__e;C.__e=function(e,t,r,n){if(e.then){for(var s,i=t;i=i.__;)if((s=i.__c)&&s.__c)return t.__e??(t.__e=r.__e,t.__k=r.__k||[]),s.__c(e,t)}Ci(e,t,r,n)};var Kn=C.unmount;function Zn(e,t,r){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(n){typeof n.__c=="function"&&n.__c()}),e.__c.__H=null),(e=Ri({},e)).__c!=null&&(e.__c.__P===r&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(n){return Zn(n,t,r)})),e}function Gn(e,t,r){return e&&r&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(n){return Gn(n,t,r)}),e.__c&&e.__c.__P===t&&(e.__e&&r.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=r)),e}function Tr(){this.__u=0,this.o=null,this.__b=null}function Vn(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function Wt(){this.i=null,this.l=null}C.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),Kn&&Kn(e)},(Tr.prototype=new he).__c=function(e,t){var r=t.__c,n=this;n.o??(n.o=[]),n.o.push(r);var s=Vn(n.__v),i=!1,a=function(){i||n.__z||(i=!0,r.__R=null,s?s(l):l())};r.__R=a;var o=r.__P;r.__P=null;var l=function(){if(!--n.__u){if(n.state.__a){var u=n.state.__a;n.__v.__k[0]=Gn(u,u.__c.__P,u.__c.__O)}var d;for(n.setState({__a:n.__b=null});d=n.o.pop();)d.__P=o,d.forceUpdate()}};n.__u++||32&t.__u||n.setState({__a:n.__b=n.__v.__k[0]}),e.then(a,a)},Tr.prototype.componentWillUnmount=function(){this.o=[]},Tr.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var r=document.createElement("div"),n=this.__v.__k[0].__c;this.__v.__k[0]=Zn(this.__b,r,n.__O=n.__P)}this.__b=null}var s=t.__a&&lt(Qe,null,e.fallback);return s&&(s.__u&=-33),[lt(Qe,null,t.__a?null:e.children),s]};var Jn=function(e,t,r){if(++r[1]===r[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!=="t"||!e.l.size))for(r=e.i;r;){for(;r.length>3;)r.pop()();if(r[1]<r[0])break;e.i=r=r[2]}};(Wt.prototype=new he).__a=function(e){var t=this,r=Vn(t.__v),n=t.l.get(e);return n[0]++,function(s){var i=function(){t.props.revealOrder?(n.push(s),Jn(t,e,n)):s()};r?r(i):i()}},Wt.prototype.render=function(e){this.i=null,this.l=new Map;var t=Lt(e.children);e.revealOrder&&e.revealOrder[0]==="b"&&t.reverse();for(var r=t.length;r--;)this.l.set(t[r],this.i=[1,0,this.i]);return e.children},Wt.prototype.componentDidUpdate=Wt.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,r){Jn(e,r,t)})};var Mi=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,Ti=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,Ai=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Ii=/[A-Z0-9]/g,Oi=typeof document<"u",Ei=function(e){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(e)};he.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(he.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Xn=C.event;C.event=function(e){return Xn&&(e=Xn(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Yn,Fi={configurable:!0,get:function(){return this.class}},es=C.vnode;C.vnode=function(e){typeof e.type=="string"&&(function(t){var r=t.props,n=t.type,s={},i=n.indexOf("-")==-1;for(var a in r){var o=r[a];if(!(a==="value"&&"defaultValue"in r&&o==null||Oi&&a==="children"&&n==="noscript"||a==="class"||a==="className")){var l=a.toLowerCase();a==="defaultValue"&&"value"in r&&r.value==null?a="value":a==="download"&&o===!0?o="":l==="translate"&&o==="no"?o=!1:l[0]==="o"&&l[1]==="n"?l==="ondoubleclick"?a="ondblclick":l!=="onchange"||n!=="input"&&n!=="textarea"||Ei(r.type)?l==="onfocus"?a="onfocusin":l==="onblur"?a="onfocusout":Ai.test(a)&&(a=l):l=a="oninput":i&&Ti.test(a)?a=a.replace(Ii,"-$&").toLowerCase():o===null&&(o=void 0),l==="oninput"&&s[a=l]&&(a="oninputCapture"),s[a]=o}}n=="select"&&(s.multiple&&Array.isArray(s.value)&&(s.value=Lt(r.children).forEach(function(u){u.props.selected=s.value.indexOf(u.props.value)!=-1})),s.defaultValue!=null&&(s.value=Lt(r.children).forEach(function(u){u.props.selected=s.multiple?s.defaultValue.indexOf(u.props.value)!=-1:s.defaultValue==u.props.value}))),r.class&&!r.className?(s.class=r.class,Object.defineProperty(s,"className",Fi)):r.className&&(s.class=s.className=r.className),t.props=s})(e),e.$$typeof=Mi,es&&es(e)};var ts=C.__r;C.__r=function(e){ts&&ts(e),Yn=e.__c};var rs=C.diffed;C.diffed=function(e){rs&&rs(e);var t=e.props,r=e.__e;r!=null&&e.type==="textarea"&&"value"in t&&t.value!==r.value&&(r.value=t.value==null?"":t.value),Yn=null};var Li=0,nl=Array.isArray;function _(e,t,r,n,s,i){t||(t={});var a,o,l=t;if("ref"in l)for(o in l={},t)o=="ref"?a=t[o]:l[o]=t[o];var u={type:e,props:l,key:r,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Li,__i:-1,__u:0,__source:s,__self:i};if(typeof e=="function"&&(a=e.defaultProps))for(o in a)l[o]===void 0&&(l[o]=a[o]);return C.vnode&&C.vnode(u),u}var ns=Sr(void 0),Ar=e=>{const t=Pr(ns);if(e)return e;if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t},zi=({client:e,children:t})=>(pe(()=>(e.mount(),()=>{e.unmount()}),[e]),_(ns.Provider,{value:e,children:t}));function ss(e,t){if(t.has(e))throw new TypeError("Cannot initialize the same private elements twice on an object")}function w(e,t,r){ss(e,t),t.set(e,r)}function S(e,t,r){if(typeof e=="function"?e===t:e.has(t))return arguments.length<3?t:r;throw new TypeError("Private element is not present on this object")}function c(e,t){return e.get(S(e,t))}function x(e,t,r){return e.set(S(e,t),r),r}var Me,is,Bi={setTimeout:(e,t)=>setTimeout(e,t),clearTimeout:e=>clearTimeout(e),setInterval:(e,t)=>setInterval(e,t),clearInterval:e=>clearInterval(e)},Wi=(Me=new WeakMap,is=new WeakMap,class{constructor(){w(this,Me,Bi),w(this,is,!1)}setTimeoutProvider(e){x(Me,this,e)}setTimeout(e,t){return c(Me,this).setTimeout(e,t)}clearTimeout(e){c(Me,this).clearTimeout(e)}setInterval(e,t){return c(Me,this).setInterval(e,t)}clearInterval(e){c(Me,this).clearInterval(e)}}),Te=new Wi;function Di(e){setTimeout(e,0)}var Ni=typeof window>"u"||"Deno"in globalThis;function G(){}function Qi(e,t){return typeof e=="function"?e(t):e}function as(e){return typeof e=="number"&&e>=0&&e!==1/0}function os(e,t){return Math.max(e+(t||0)-Date.now(),0)}function W(e,t){return typeof e=="function"?e(t):e}function ls(e,t){const{type:r="all",exact:n,fetchStatus:s,predicate:i,queryKey:a,stale:o}=e;if(a){if(n){if(t.queryHash!==Ir(a,t.options))return!1}else if(!je(t.queryKey,a))return!1}if(r!=="all"){const l=t.isActive();if(r==="active"&&!l||r==="inactive"&&l)return!1}return!(typeof o=="boolean"&&t.isStale()!==o||s&&s!==t.state.fetchStatus||i&&!i(t))}function cs(e,t){const{exact:r,status:n,predicate:s,mutationKey:i}=e;if(i){if(!t.options.mutationKey)return!1;if(r){if(Ae(t.options.mutationKey)!==Ae(i))return!1}else if(!je(t.options.mutationKey,i))return!1}return!(n&&t.state.status!==n||s&&!s(t))}function Ir(e,t){return(t?.queryKeyHashFn||Ae)(e)}function Ae(e){return JSON.stringify(e,(t,r)=>Or(r)?Object.keys(r).sort().reduce((n,s)=>(n[s]=r[s],n),{}):r)}function je(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(Array.isArray(e)&&Array.isArray(t)){if(t.length>e.length)return!1;for(let n=0;n<t.length;n++)if(!je(e[n],t[n]))return!1;return!0}const r=Object.keys(t);for(const n of r)if(!je(e[n],t[n]))return!1;return!0}return!1}var qi=Object.prototype.hasOwnProperty;function us(e,t,r=0){if(e===t)return e;if(r>500)return t;const n=hs(e)&&hs(t);if(!n&&!(Or(e)&&Or(t)))return t;const s=(n?e:Object.keys(e)).length,i=n?t:Object.keys(t),a=i.length,o=n?new Array(a):{};let l=0;for(let u=0;u<a;u++){const d=n?u:i[u],p=e[d],h=t[d];if(p===h){o[d]=p,(n?u<s:qi.call(e,d))&&l++;continue}if(p===null||h===null||typeof p!="object"||typeof h!="object"){o[d]=h;continue}const f=us(p,h,r+1);o[d]=f,f===p&&l++}return s===a&&l===s?e:o}function Dt(e,t){if(!t||Object.keys(e).length!==Object.keys(t).length)return!1;for(const r in e)if(e[r]!==t[r])return!1;return!0}function hs(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function Or(e){if(!ds(e))return!1;const t=Object.getPrototypeOf(e),r=t?.constructor;if(r===void 0)return!0;if(typeof r!="function")return!1;const n=r.prototype;return!(!ds(n)||!n.hasOwnProperty("isPrototypeOf")||t!==Object.prototype)}function ds(e){return Object.prototype.toString.call(e)==="[object Object]"}function ji(e){return new Promise(t=>{Te.setTimeout(t,e)})}function Er(e,t,r){return typeof r.structuralSharing=="function"?r.structuralSharing(e,t):r.structuralSharing!==!1?us(e,t):t}function Ui(e,t,r=0){const n=[...e,t];return r&&n.length>r?n.slice(1):n}function Hi(e,t,r=0){const n=[t,...e];return r&&n.length>r?n.slice(0,-1):n}var Fr=Symbol();function ps(e,t){return!e.queryFn&&t?.initialPromise?()=>t.initialPromise:!e.queryFn||e.queryFn===Fr?()=>Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)):e.queryFn}function Lr(e,t){return typeof e=="function"?e(...t):!!e}function Ki(e,t,r){let n=!1,s;return Object.defineProperty(e,"signal",{enumerable:!0,get:()=>(s??(s=t()),n||(n=!0,s.aborted?r():s.addEventListener("abort",r,{once:!0})),s)}),e}var Zi=()=>Ni,zr=()=>Zi(),Ue=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(e){return this.listeners.add(e),this.onSubscribe(),()=>{this.listeners.delete(e),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}},dt=new WeakMap,He=new WeakMap,Nt=new WeakMap,Gi=class extends Ue{constructor(){super(),w(this,dt,void 0),w(this,He,void 0),w(this,Nt,void 0),x(Nt,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}})}onSubscribe(){c(He,this)||this.setEventListener(c(Nt,this))}onUnsubscribe(){this.hasListeners()||(c(He,this)?.call(this),x(He,this,void 0))}setEventListener(e){x(Nt,this,e),c(He,this)?.call(this),x(He,this,e(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()}))}setFocused(e){c(dt,this)!==e&&(x(dt,this,e),this.onFocus())}onFocus(){const e=this.isFocused();this.listeners.forEach(t=>{t(e)})}isFocused(){return typeof c(dt,this)=="boolean"?c(dt,this):globalThis.document?.visibilityState!=="hidden"}},Br=new Gi,Vi=Di;function Ji(){let e=[],t=0,r=o=>{o()},n=o=>{o()},s=Vi;const i=o=>{t?e.push(o):s(()=>{r(o)})},a=()=>{const o=e;e=[],o.length&&s(()=>{n(()=>{o.forEach(l=>{r(l)})})})};return{batch:o=>{let l;t++;try{l=o()}finally{t--,t||a()}return l},batchCalls:o=>(...l)=>{i(()=>{o(...l)})},schedule:i,setNotifyFunction:o=>{r=o},setBatchNotifyFunction:o=>{n=o},setScheduler:o=>{s=o}}}var U=Ji(),Qt=new WeakMap,Ke=new WeakMap,qt=new WeakMap,Xi=class extends Ue{constructor(){super(),w(this,Qt,!0),w(this,Ke,void 0),w(this,qt,void 0),x(qt,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e(!0),r=()=>e(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",r,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",r)}}})}onSubscribe(){c(Ke,this)||this.setEventListener(c(qt,this))}onUnsubscribe(){this.hasListeners()||(c(Ke,this)?.call(this),x(Ke,this,void 0))}setEventListener(e){x(qt,this,e),c(Ke,this)?.call(this),x(Ke,this,e(this.setOnline.bind(this)))}setOnline(e){c(Qt,this)!==e&&(x(Qt,this,e),this.listeners.forEach(t=>{t(e)}))}isOnline(){return c(Qt,this)}},jt=new Xi;function Yi(e){return Math.min(1e3*2**e,3e4)}function fs(e){return(e??"online")==="online"?jt.isOnline():!0}var Wr=class extends Error{constructor(e){super("CancelledError"),this.revert=e?.revert,this.silent=e?.silent}};function gs(e){let t=!1,r=0,n,s="pending",i,a;const o=new Promise((g,P)=>{i=g,a=P});o.catch(G);const l=()=>s!=="pending",u=g=>{if(!l()){const P=new Wr(g);y(P),e.onCancel?.(P)}},d=()=>{t=!0},p=()=>{t=!1},h=()=>Br.isFocused()&&(e.networkMode==="always"||jt.isOnline())&&e.canRun(),f=()=>fs(e.networkMode)&&e.canRun(),m=g=>{l()||(n?.(),s="resolved",i(g))},y=g=>{l()||(n?.(),s="rejected",a(g))},b=()=>new Promise(g=>{n=P=>{(l()||h())&&g(P)},e.onPause?.()}).then(()=>{n=void 0,l()||e.onContinue?.()}),v=()=>{if(l())return;let g;const P=r===0?e.initialPromise:void 0;try{g=P??e.fn()}catch(O){g=Promise.reject(O)}Promise.resolve(g).then(m).catch(O=>{if(l())return;const T=e.retry??(zr()?0:3),D=e.retryDelay??Yi,k=typeof D=="function"?D(r,O):D,E=T===!0||typeof T=="number"&&r<T||typeof T=="function"&&T(r,O);if(t||!E){y(O);return}r++,e.onFail?.(r,O),ji(k).then(()=>h()?void 0:b()).then(()=>{t?y(O):v()})})};return{promise:o,status:()=>s,cancel:u,continue:()=>(n?.(),o),cancelRetry:d,continueRetry:p,canStart:f,start:()=>(f()?v():b().then(v),o)}}var pt=new WeakMap,_s=class{constructor(){w(this,pt,void 0)}destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),as(this.gcTime)&&x(pt,this,Te.setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(e){this.gcTime=Math.max(this.gcTime||0,e??(zr()?1/0:3e5))}clearGcTimeout(){c(pt,this)!==void 0&&(Te.clearTimeout(c(pt,this)),x(pt,this,void 0))}};function ea(e){return{onFetch:(t,r)=>{const n=t.options,s=t.fetchOptions?.meta?.fetchMore?.direction,i=t.state.data?.pages||[],a=t.state.data?.pageParams||[];let o={pages:[],pageParams:[]},l=0;const u=async()=>{let d=!1;const p=m=>{Ki(m,()=>t.signal,()=>d=!0)},h=ps(t.options,t.fetchOptions),f=async(m,y,b)=>{if(d)return Promise.reject(t.signal.reason);if(y==null&&m.pages.length)return Promise.resolve(m);const g=(()=>{const D={client:t.client,queryKey:t.queryKey,pageParam:y,direction:b?"backward":"forward",meta:t.options.meta};return p(D),D})(),P=await h(g),{maxPages:O}=t.options,T=b?Hi:Ui;return{pages:T(m.pages,P,O),pageParams:T(m.pageParams,y,O)}};if(s&&i.length){const m=s==="backward",y=m?ms:Dr,b={pages:i,pageParams:a};o=await f(b,y(n,b),m)}else{const m=e??i.length;do{const y=l===0?a[0]??n.initialPageParam:Dr(n,o);if(l>0&&y==null)break;o=await f(o,y),l++}while(l<m)}return o};t.options.persister?t.fetchFn=()=>t.options.persister?.(u,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},r):t.fetchFn=u}}}function Dr(e,{pages:t,pageParams:r}){const n=t.length-1;return t.length>0?e.getNextPageParam(t[n],t,r[n],r):void 0}function ms(e,{pages:t,pageParams:r}){return t.length>0?e.getPreviousPageParam?.(t[0],t,r[0],r):void 0}function ta(e,t){return t?Dr(e,t)!=null:!1}function ra(e,t){return!t||!e.getPreviousPageParam?!1:ms(e,t)!=null}function ft(e,t){ss(e,t),t.add(e)}var Ut=new WeakMap,gt=new WeakMap,Ht=new WeakMap,le=new WeakMap,_t=new WeakMap,Z=new WeakMap,Nr=new WeakMap,mt=new WeakMap,fe=new WeakSet,na=class extends _s{constructor(e){super(),ft(this,fe),w(this,Ut,void 0),w(this,gt,void 0),w(this,Ht,void 0),w(this,le,void 0),w(this,_t,void 0),w(this,Z,void 0),w(this,Nr,void 0),w(this,mt,void 0),x(mt,this,!1),x(Nr,this,e.defaultOptions),this.setOptions(e.options),this.observers=[],x(_t,this,e.client),x(le,this,c(_t,this).getQueryCache()),this.queryKey=e.queryKey,this.queryHash=e.queryHash,x(gt,this,vs(this.options)),this.state=e.state??c(gt,this),this.scheduleGc()}get meta(){return this.options.meta}get queryType(){return c(Ut,this)}get promise(){return c(Z,this)?.promise}setOptions(e){if(this.options={...c(Nr,this),...e},e?._type&&x(Ut,this,e._type),this.updateGcTime(this.options.gcTime),this.state&&this.state.data===void 0){const t=vs(this.options);t.data!==void 0&&(this.setState(xs(t.data,t.dataUpdatedAt)),x(gt,this,t))}}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&c(le,this).remove(this)}setData(e,t){const r=Er(this.state.data,e,this.options);return S(fe,this,xe).call(this,{data:r,type:"success",dataUpdatedAt:t?.updatedAt,manual:t?.manual}),r}setState(e){S(fe,this,xe).call(this,{type:"setState",state:e})}cancel(e){const t=c(Z,this)?.promise;return c(Z,this)?.cancel(e),t?t.then(G).catch(G):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}get resetState(){return c(gt,this)}reset(){this.destroy(),this.setState(this.resetState)}isActive(){return this.observers.some(e=>W(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===Fr||!this.isFetched()}isFetched(){return this.state.dataUpdateCount+this.state.errorUpdateCount>0}isStatic(){return this.getObserversCount()>0?this.observers.some(e=>W(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!os(this.state.dataUpdatedAt,e)}onFocus(){this.observers.find(e=>e.shouldFetchOnWindowFocus())?.refetch({cancelRefetch:!1}),c(Z,this)?.continue()}onOnline(){this.observers.find(e=>e.shouldFetchOnReconnect())?.refetch({cancelRefetch:!1}),c(Z,this)?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),c(le,this).notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){const t=this.observers.indexOf(e);t!==-1&&(this.observers.splice(t,1),this.observers.length||(c(Z,this)&&(c(mt,this)||this.state.fetchStatus==="paused"&&this.state.status==="pending"?c(Z,this).cancel({revert:!0}):c(Z,this).cancelRetry()),this.scheduleGc()),c(le,this).notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||S(fe,this,xe).call(this,{type:"invalidate"})}async fetch(e,t){if(this.state.fetchStatus!=="idle"&&c(Z,this)?.status()!=="rejected"){if(this.state.data!==void 0&&t?.cancelRefetch)this.cancel({silent:!0});else if(c(Z,this))return c(Z,this).continueRetry(),c(Z,this).promise}if(e&&this.setOptions(e),!this.options.queryFn){const l=this.observers.find(u=>u.options.queryFn);l&&this.setOptions(l.options)}const r=new AbortController,n=l=>{Object.defineProperty(l,"signal",{enumerable:!0,get:()=>(x(mt,this,!0),r.signal)})},s=()=>{const l=ps(this.options,t),d=(()=>{const p={client:c(_t,this),queryKey:this.queryKey,meta:this.meta};return n(p),p})();return x(mt,this,!1),this.options.persister?this.options.persister(l,d,this):l(d)},a=(()=>{const l={fetchOptions:t,options:this.options,queryKey:this.queryKey,client:c(_t,this),state:this.state,fetchFn:s};return n(l),l})();(c(Ut,this)==="infinite"?ea(this.options.pages):this.options.behavior)?.onFetch(a,this),x(Ht,this,this.state),(this.state.fetchStatus==="idle"||this.state.fetchMeta!==a.fetchOptions?.meta)&&S(fe,this,xe).call(this,{type:"fetch",meta:a.fetchOptions?.meta});const o=x(Z,this,gs({initialPromise:t?.initialPromise,fn:a.fetchFn,onCancel:l=>{l instanceof Wr&&l.revert&&this.setState({...c(Ht,this),fetchStatus:"idle"}),r.abort()},onFail:(l,u)=>{S(fe,this,xe).call(this,{type:"failed",failureCount:l,error:u})},onPause:()=>{S(fe,this,xe).call(this,{type:"pause"})},onContinue:()=>{S(fe,this,xe).call(this,{type:"continue"})},retry:a.options.retry,retryDelay:a.options.retryDelay,networkMode:a.options.networkMode,canRun:()=>!0}));try{const l=await o.start();if(l===void 0)throw new Error(`${this.queryHash} data is undefined`);return this.setData(l),c(le,this).config.onSuccess?.(l,this),c(le,this).config.onSettled?.(l,this.state.error,this),l}catch(l){if(l instanceof Wr){if(l.silent)return c(Z,this).promise;if(l.revert){if(this.state.data===void 0)throw l;return this.state.data}}throw S(fe,this,xe).call(this,{type:"error",error:l}),c(le,this).config.onError?.(l,this),c(le,this).config.onSettled?.(this.state.data,l,this),l}finally{c(Z,this)===o&&x(Z,this,void 0),this.scheduleGc()}}};function xe(e){const t=r=>{switch(e.type){case"failed":return{...r,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...r,fetchStatus:"paused"};case"continue":return{...r,fetchStatus:"fetching"};case"fetch":return{...r,...bs(r.data,this.options),fetchMeta:e.meta??null};case"success":const n={...r,...xs(e.data,e.dataUpdatedAt),dataUpdateCount:r.dataUpdateCount+1,...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return x(Ht,this,e.manual?n:void 0),n;case"error":const s=e.error;return{...r,error:s,errorUpdateCount:r.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:r.fetchFailureCount+1,fetchFailureReason:s,fetchStatus:"idle",status:"error",isInvalidated:!0};case"invalidate":return{...r,isInvalidated:!0};case"setState":return{...r,...e.state}}};this.state=t(this.state),U.batch(()=>{this.observers.slice().forEach(r=>{r.onQueryUpdate()}),c(le,this).notify({query:this,type:"updated",action:e})})}function bs(e,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:fs(t.networkMode)?"fetching":"paused",...e===void 0&&{error:null,status:"pending"}}}function xs(e,t){return{data:e,dataUpdatedAt:t??Date.now(),error:null,isInvalidated:!1,status:"success"}}function vs(e){const t=typeof e.initialData=="function"?e.initialData():e.initialData,r=t!==void 0,n=r?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:r?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:r?"success":"pending",fetchStatus:"idle"}}var te=new WeakMap,I=new WeakMap,Qr=new WeakMap,re=new WeakMap,bt=new WeakMap,Kt=new WeakMap,Ie=new WeakMap,qr=new WeakMap,Zt=new WeakMap,Gt=new WeakMap,xt=new WeakMap,vt=new WeakMap,Ze=new WeakMap,Vt=new WeakMap,Q=new WeakSet,sa=class extends Ue{constructor(e,t){super(),ft(this,Q),w(this,te,void 0),w(this,I,void 0),w(this,Qr,void 0),w(this,re,void 0),w(this,bt,void 0),w(this,Kt,void 0),w(this,Ie,void 0),w(this,qr,void 0),w(this,Zt,void 0),w(this,Gt,void 0),w(this,xt,void 0),w(this,vt,void 0),w(this,Ze,void 0),w(this,Vt,new Set),this.options=t,x(te,this,e),x(Ie,this,null),this.bindMethods(),this.setOptions(t)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(c(I,this).addObserver(this),Ms(c(I,this),this.options)?S(Q,this,Jt).call(this):this.updateResult(),S(Q,this,$s).call(this))}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return jr(c(I,this),this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return jr(c(I,this),this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,S(Q,this,Ps).call(this),S(Q,this,Rs).call(this),c(I,this).removeObserver(this)}setOptions(e){const t=this.options,r=c(I,this);if(this.options=c(te,this).defaultQueryOptions(e),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof W(this.options.enabled,c(I,this))!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");S(Q,this,Cs).call(this),c(I,this).setOptions(this.options),t._defaulted&&!Dt(this.options,t)&&c(te,this).getQueryCache().notify({type:"observerOptionsUpdated",query:c(I,this),observer:this});const n=this.hasListeners();n&&Ts(c(I,this),r,this.options,t)&&S(Q,this,Jt).call(this),this.updateResult(),n&&(c(I,this)!==r||W(this.options.enabled,c(I,this))!==W(t.enabled,c(I,this))||W(this.options.staleTime,c(I,this))!==W(t.staleTime,c(I,this)))&&S(Q,this,ks).call(this);const s=S(Q,this,ws).call(this);n&&(c(I,this)!==r||W(this.options.enabled,c(I,this))!==W(t.enabled,c(I,this))||s!==c(Ze,this))&&S(Q,this,Ss).call(this,s)}getOptimisticResult(e){const t=c(te,this).getQueryCache().build(c(te,this),e),r=this.createResult(t,e);return Dt(this.getCurrentResult(),r)||(x(re,this,r),x(Kt,this,this.options),x(bt,this,c(I,this).state)),r}getCurrentResult(){return c(re,this)}trackResult(e,t){return new Proxy(e,{get:(r,n)=>(this.trackProp(n),t?.(n),Reflect.get(r,n))})}trackProp(e){c(Vt,this).add(e)}getCurrentQuery(){return c(I,this)}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){const t=c(te,this).defaultQueryOptions(e),r=c(te,this).getQueryCache().build(c(te,this),t);let n=()=>{},s;const i=new Promise(a=>{s=a,n=c(te,this).getQueryCache().subscribe(o=>{o.type==="updated"&&o.query.queryHash===r.queryHash&&r.state.data!==void 0&&(n(),a(this.createResult(r,t)))})});return Promise.race([r.fetch().then(()=>{const a=this.createResult(r,t);return s?.(a),a}).finally(()=>{n()}),i])}fetch(e){return S(Q,this,Jt).call(this,{...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),c(re,this)))}createResult(e,t){const r=c(I,this),n=this.options,s=c(re,this),i=c(bt,this),a=c(Kt,this),o=e!==r?e.state:c(Qr,this),{state:l}=e;let u={...l},d=!1,p;if(t._optimisticResults){const T=this.hasListeners(),D=!T&&Ms(e,t),k=T&&Ts(e,r,t,n);(D||k)&&(u={...u,...bs(l.data,e.options)}),t._optimisticResults==="isRestoring"&&(u.fetchStatus="idle")}let{error:h,errorUpdatedAt:f,status:m}=u;p=u.data;let y=!1;if(t.placeholderData!==void 0&&p===void 0&&m==="pending"){let T;s?.isPlaceholderData&&t.placeholderData===a?.placeholderData?(T=s.data,y=!0):T=typeof t.placeholderData=="function"?t.placeholderData(c(Gt,this)?.state.data,c(Gt,this)):t.placeholderData,T!==void 0&&(m="success",p=Er(s?.data,T,t),d=!0)}if(t.select&&p!==void 0&&!y)if(s&&p===i?.data&&t.select===c(qr,this))p=c(Zt,this);else try{x(qr,this,t.select),p=t.select(p),p=Er(s?.data,p,t),x(Zt,this,p),x(Ie,this,null)}catch(T){x(Ie,this,T)}else p===void 0&&x(Ie,this,null);c(Ie,this)&&(h=c(Ie,this),p=c(Zt,this),f=Date.now(),m="error",d=!1);const b=u.fetchStatus==="fetching",v=m==="pending",g=m==="error",P=v&&b,O=p!==void 0;return{status:m,fetchStatus:u.fetchStatus,isPending:v,isSuccess:m==="success",isError:g,isInitialLoading:P,isLoading:P,data:p,dataUpdatedAt:u.dataUpdatedAt,error:h,errorUpdatedAt:f,failureCount:u.fetchFailureCount,failureReason:u.fetchFailureReason,errorUpdateCount:u.errorUpdateCount,isFetched:e.isFetched(),isFetchedAfterMount:u.dataUpdateCount>o.dataUpdateCount||u.errorUpdateCount>o.errorUpdateCount,isFetching:b,isRefetching:b&&!v,isLoadingError:g&&!O,isPaused:u.fetchStatus==="paused",isPlaceholderData:d,isRefetchError:g&&O,isStale:Ur(e,t),refetch:this.refetch,isEnabled:W(t.enabled,e)!==!1}}updateResult(){const e=c(re,this),t=this.createResult(c(I,this),this.options);if(x(bt,this,c(I,this).state),x(Kt,this,this.options),c(bt,this).data!==void 0&&x(Gt,this,c(I,this)),Dt(t,e))return;x(re,this,t);const n=(()=>{if(!e)return!0;const{notifyOnChangeProps:s}=this.options,i=typeof s=="function"?s():s;if(i==="all"||!i&&!c(Vt,this).size)return!0;const a=new Set(i??c(Vt,this));return this.options.throwOnError&&a.add("error"),Object.keys(c(re,this)).some(o=>{const l=o;return c(re,this)[l]!==e[l]&&a.has(l)})})();U.batch(()=>{n&&this.listeners.forEach(s=>{s(c(re,this))}),c(te,this).getQueryCache().notify({query:c(I,this),type:"observerResultsUpdated"})})}onQueryUpdate(){this.updateResult(),this.hasListeners()&&S(Q,this,$s).call(this)}};function Jt(e){S(Q,this,Cs).call(this);let t=c(I,this).fetch(this.options,e);return e?.throwOnError||(t=t.catch(G)),t}function ys(e){return!zr()&&W(this.options.enabled,c(I,this))!==!1&&as(e)}function ks(){S(Q,this,Ps).call(this);const e=W(this.options.staleTime,c(I,this));if(c(re,this).isStale||!S(Q,this,ys).call(this,e))return;const t=os(c(re,this).dataUpdatedAt,e)+1;x(xt,this,Te.setTimeout(()=>{c(re,this).isStale||this.updateResult()},t))}function ws(){return W(this.options.refetchInterval,c(I,this))??!1}function Ss(e){S(Q,this,Rs).call(this),x(Ze,this,e),!(c(Ze,this)===0||!S(Q,this,ys).call(this,c(Ze,this)))&&x(vt,this,Te.setInterval(()=>{(this.options.refetchIntervalInBackground||Br.isFocused())&&S(Q,this,Jt).call(this)},c(Ze,this)))}function $s(){S(Q,this,ks).call(this),S(Q,this,Ss).call(this,S(Q,this,ws).call(this))}function Ps(){c(xt,this)!==void 0&&(Te.clearTimeout(c(xt,this)),x(xt,this,void 0))}function Rs(){c(vt,this)!==void 0&&(Te.clearInterval(c(vt,this)),x(vt,this,void 0))}function Cs(){const e=c(te,this).getQueryCache().build(c(te,this),this.options);if(e===c(I,this))return;const t=c(I,this);x(I,this,e),x(Qr,this,e.state),this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}function ia(e,t){return W(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&W(t.retryOnMount,e)===!1)}function Ms(e,t){return ia(e,t)||e.state.data!==void 0&&jr(e,t,t.refetchOnMount)}function jr(e,t,r){if(W(t.enabled,e)!==!1&&W(t.staleTime,e)!=="static"){const n=W(r,e);return n==="always"||n!==!1&&Ur(e,t)}return!1}function Ts(e,t,r,n){return(e!==t||W(n.enabled,e)===!1)&&(!r.suspense||e.state.status!=="error")&&Ur(e,r)}function Ur(e,t){return W(t.enabled,e)!==!1&&e.isStaleByTime(W(t.staleTime,e))}var aa=class extends sa{constructor(e,t){super(e,t)}bindMethods(){super.bindMethods(),this.fetchNextPage=this.fetchNextPage.bind(this),this.fetchPreviousPage=this.fetchPreviousPage.bind(this)}setOptions(e){e._type="infinite",super.setOptions(e)}getOptimisticResult(e){return e._type="infinite",super.getOptimisticResult(e)}fetchNextPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"forward"}}})}fetchPreviousPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"backward"}}})}createResult(e,t){const{state:r}=e,n=super.createResult(e,t),{isFetching:s,isRefetching:i,isError:a,isRefetchError:o}=n,l=r.fetchMeta?.fetchMore?.direction,u=a&&l==="forward",d=s&&l==="forward",p=a&&l==="backward",h=s&&l==="backward";return{...n,fetchNextPage:this.fetchNextPage,fetchPreviousPage:this.fetchPreviousPage,hasNextPage:ta(t,r.data),hasPreviousPage:ra(t,r.data),isFetchNextPageError:u,isFetchingNextPage:d,isFetchPreviousPageError:p,isFetchingPreviousPage:h,isRefetchError:o&&!u&&!p,isRefetching:i&&!d&&!h}}},Hr=new WeakMap,ve=new WeakMap,J=new WeakMap,yt=new WeakMap,ye=new WeakSet,oa=class extends _s{constructor(e){super(),ft(this,ye),w(this,Hr,void 0),w(this,ve,void 0),w(this,J,void 0),w(this,yt,void 0),x(Hr,this,e.client),this.mutationId=e.mutationId,x(J,this,e.mutationCache),x(ve,this,[]),this.state=e.state||As(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){c(ve,this).includes(e)||(c(ve,this).push(e),this.clearGcTimeout(),c(J,this).notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){x(ve,this,c(ve,this).filter(t=>t!==e)),this.scheduleGc(),c(J,this).notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){c(ve,this).length||(this.state.status==="pending"?this.scheduleGc():c(J,this).remove(this))}continue(){return c(yt,this)?.continue()??(this.state.status==="pending"?this.execute(this.state.variables):Promise.resolve())}async execute(e){const t=()=>{S(ye,this,Oe).call(this,{type:"continue"})},r={client:c(Hr,this),meta:this.options.meta,mutationKey:this.options.mutationKey},n=x(yt,this,gs({fn:()=>this.options.mutationFn?this.options.mutationFn(e,r):Promise.reject(new Error("No mutationFn found")),onFail:(a,o)=>{S(ye,this,Oe).call(this,{type:"failed",failureCount:a,error:o})},onPause:()=>{S(ye,this,Oe).call(this,{type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>c(J,this).canRun(this)})),s=this.state.status==="pending",i=!n.canStart();try{if(s)t();else{S(ye,this,Oe).call(this,{type:"pending",variables:e,isPaused:i}),c(J,this).config.onMutate&&await c(J,this).config.onMutate(e,this,r);const o=await this.options.onMutate?.(e,r);o!==this.state.context&&S(ye,this,Oe).call(this,{type:"pending",context:o,variables:e,isPaused:i})}const a=await n.start();return await c(J,this).config.onSuccess?.(a,e,this.state.context,this,r),await this.options.onSuccess?.(a,e,this.state.context,r),await c(J,this).config.onSettled?.(a,null,this.state.variables,this.state.context,this,r),await this.options.onSettled?.(a,null,e,this.state.context,r),S(ye,this,Oe).call(this,{type:"success",data:a}),a}catch(a){try{await c(J,this).config.onError?.(a,e,this.state.context,this,r)}catch(o){Promise.reject(o)}try{await this.options.onError?.(a,e,this.state.context,r)}catch(o){Promise.reject(o)}try{await c(J,this).config.onSettled?.(void 0,a,this.state.variables,this.state.context,this,r)}catch(o){Promise.reject(o)}try{await this.options.onSettled?.(void 0,a,e,this.state.context,r)}catch(o){Promise.reject(o)}throw S(ye,this,Oe).call(this,{type:"error",error:a}),a}finally{c(yt,this)===n&&x(yt,this,void 0),c(J,this).runNext(this)}}};function Oe(e){const t=r=>{switch(e.type){case"failed":return{...r,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...r,isPaused:!0};case"continue":return{...r,isPaused:!1};case"pending":return{...r,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...r,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...r,data:void 0,error:e.error,failureCount:r.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=t(this.state),U.batch(()=>{c(ve,this).forEach(r=>{r.onMutationUpdate(e)}),c(J,this).notify({mutation:this,type:"updated",action:e})})}function As(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var Ee=new WeakMap,ge=new WeakMap,Xt=new WeakMap,la=class extends Ue{constructor(e={}){super(),w(this,Ee,void 0),w(this,ge,void 0),w(this,Xt,void 0),this.config=e,x(Ee,this,new Set),x(ge,this,new Map),x(Xt,this,0)}build(e,t,r){var n;const s=new oa({client:e,mutationCache:this,mutationId:x(Xt,this,(n=c(Xt,this),++n)),options:e.defaultMutationOptions(t),state:r});return this.add(s),s}add(e){c(Ee,this).add(e);const t=Yt(e);if(typeof t=="string"){const r=c(ge,this).get(t);r?r.push(e):c(ge,this).set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(c(Ee,this).delete(e)){const t=Yt(e);if(typeof t=="string"){const r=c(ge,this).get(t);if(r)if(r.length>1){const n=r.indexOf(e);n!==-1&&r.splice(n,1)}else r[0]===e&&c(ge,this).delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){const t=Yt(e);if(typeof t=="string"){const r=c(ge,this).get(t)?.find(n=>n.state.status==="pending");return!r||r===e}else return!0}runNext(e){const t=Yt(e);return typeof t=="string"?c(ge,this).get(t)?.find(r=>r!==e&&r.state.isPaused)?.continue()??Promise.resolve():Promise.resolve()}clear(){U.batch(()=>{c(Ee,this).forEach(e=>{this.notify({type:"removed",mutation:e})}),c(Ee,this).clear(),c(ge,this).clear()})}getAll(){return Array.from(c(Ee,this))}find(e){const t={exact:!0,...e};return this.getAll().find(r=>cs(t,r))}findAll(e={}){return this.getAll().filter(t=>cs(e,t))}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){const e=this.getAll().filter(t=>t.state.isPaused);return U.batch(()=>Promise.all(e.map(t=>t.continue().catch(G))))}};function Yt(e){return e.options.scope?.id}var Fe=new WeakMap,Ge=new WeakMap,X=new WeakMap,Le=new WeakMap,ze=new WeakSet,ca=class extends Ue{constructor(e,t){super(),ft(this,ze),w(this,Fe,void 0),w(this,Ge,void 0),w(this,X,void 0),w(this,Le,void 0),x(Fe,this,e),this.setOptions(t),this.bindMethods(),S(ze,this,er).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){const t=this.options;this.options=c(Fe,this).defaultMutationOptions(e),Dt(this.options,t)||c(Fe,this).getMutationCache().notify({type:"observerOptionsUpdated",mutation:c(X,this),observer:this}),t?.mutationKey&&this.options.mutationKey&&Ae(t.mutationKey)!==Ae(this.options.mutationKey)?this.reset():c(X,this)?.state.status==="pending"&&c(X,this).setOptions(this.options)}onSubscribe(){this.listeners.size===1&&c(X,this)&&(c(X,this).addObserver(this),S(ze,this,er).call(this))}onUnsubscribe(){this.hasListeners()||c(X,this)?.removeObserver(this)}onMutationUpdate(e){S(ze,this,er).call(this),S(ze,this,Is).call(this,e)}getCurrentResult(){return c(Ge,this)}reset(){c(X,this)?.removeObserver(this),x(X,this,void 0),S(ze,this,er).call(this),S(ze,this,Is).call(this)}mutate(e,t){return x(Le,this,t),c(X,this)?.removeObserver(this),x(X,this,c(Fe,this).getMutationCache().build(c(Fe,this),this.options)),c(X,this).addObserver(this),c(X,this).execute(e)}};function er(){const e=c(X,this)?.state??As();x(Ge,this,{...e,isPending:e.status==="pending",isSuccess:e.status==="success",isError:e.status==="error",isIdle:e.status==="idle",mutate:this.mutate,reset:this.reset})}function Is(e){U.batch(()=>{if(c(Le,this)&&this.hasListeners()){const t=c(Ge,this).variables,r=c(Ge,this).context,n={client:c(Fe,this),meta:this.options.meta,mutationKey:this.options.mutationKey};if(e?.type==="success"){try{c(Le,this).onSuccess?.(e.data,t,r,n)}catch(s){Promise.reject(s)}try{c(Le,this).onSettled?.(e.data,null,t,r,n)}catch(s){Promise.reject(s)}}else if(e?.type==="error"){try{c(Le,this).onError?.(e.error,t,r,n)}catch(s){Promise.reject(s)}try{c(Le,this).onSettled?.(void 0,e.error,t,r,n)}catch(s){Promise.reject(s)}}}this.listeners.forEach(t=>{t(c(Ge,this))})})}var ke=new WeakMap,ua=class extends Ue{constructor(e={}){super(),w(this,ke,void 0),this.config=e,x(ke,this,new Map)}build(e,t,r){const n=t.queryKey,s=t.queryHash??Ir(n,t);let i=this.get(s);return i||(i=new na({client:e,queryKey:n,queryHash:s,options:e.defaultQueryOptions(t),state:r,defaultOptions:e.getQueryDefaults(n)}),this.add(i)),i}add(e){c(ke,this).has(e.queryHash)||(c(ke,this).set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){c(ke,this).get(e.queryHash)===e&&(e.destroy(),c(ke,this).delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){U.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return c(ke,this).get(e)}getAll(){return[...c(ke,this).values()]}find(e){const t={exact:!0,...e};return this.getAll().find(r=>ls(t,r))}findAll(e={}){const t=this.getAll();return Object.keys(e).length>0?t.filter(r=>ls(e,r)):t}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){U.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){U.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},q=new WeakMap,Ve=new WeakMap,Je=new WeakMap,tr=new WeakMap,rr=new WeakMap,we=new WeakMap,nr=new WeakMap,sr=new WeakMap,ha=class{constructor(e={}){w(this,q,void 0),w(this,Ve,void 0),w(this,Je,void 0),w(this,tr,void 0),w(this,rr,void 0),w(this,we,void 0),w(this,nr,void 0),w(this,sr,void 0),x(q,this,e.queryCache||new ua),x(Ve,this,e.mutationCache||new la),x(Je,this,e.defaultOptions||{}),x(tr,this,new Map),x(rr,this,new Map),x(we,this,0)}mount(){var e;x(we,this,(e=c(we,this),e++,e)),c(we,this)===1&&(x(nr,this,Br.subscribe(async t=>{t&&(await this.resumePausedMutations(),c(q,this).onFocus())})),x(sr,this,jt.subscribe(async t=>{t&&(await this.resumePausedMutations(),c(q,this).onOnline())})))}unmount(){var e;x(we,this,(e=c(we,this),e--,e)),c(we,this)===0&&(c(nr,this)?.call(this),x(nr,this,void 0),c(sr,this)?.call(this),x(sr,this,void 0))}isFetching(e){return c(q,this).findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return c(Ve,this).findAll({...e,status:"pending"}).length}getQueryData(e){const t=this.defaultQueryOptions({queryKey:e});return c(q,this).get(t.queryHash)?.state.data}ensureQueryData(e){const t=this.defaultQueryOptions(e),r=c(q,this).build(this,t),n=r.state.data;return n===void 0?this.fetchQuery(e):(e.revalidateIfStale&&r.isStaleByTime(W(t.staleTime,r))&&this.prefetchQuery(t),Promise.resolve(n))}getQueriesData(e){return c(q,this).findAll(e).map(({queryKey:t,state:r})=>[t,r.data])}setQueryData(e,t,r){const n=this.defaultQueryOptions({queryKey:e}),s=c(q,this).get(n.queryHash)?.state.data,i=Qi(t,s);if(i!==void 0)return c(q,this).build(this,n).setData(i,{...r,manual:!0})}setQueriesData(e,t,r){return U.batch(()=>c(q,this).findAll(e).map(({queryKey:n})=>[n,this.setQueryData(n,t,r)]))}getQueryState(e){const t=this.defaultQueryOptions({queryKey:e});return c(q,this).get(t.queryHash)?.state}removeQueries(e){const t=c(q,this);U.batch(()=>{t.findAll(e).forEach(r=>{t.remove(r)})})}resetQueries(e,t){const r=c(q,this);return U.batch(()=>{const n=r.findAll(e),s=new Set(n);return n.forEach(i=>{i.reset()}),this.refetchQueries({type:"active",predicate:i=>s.has(i)},t)})}cancelQueries(e,t={}){const r={revert:!0,...t},n=U.batch(()=>c(q,this).findAll(e).map(s=>s.cancel(r)));return Promise.all(n).then(G).catch(G)}invalidateQueries(e,t={}){return U.batch(()=>(c(q,this).findAll(e).forEach(r=>{r.invalidate()}),e?.refetchType==="none"?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t)))}refetchQueries(e,t={}){const r={...t,cancelRefetch:t.cancelRefetch??!0},n=U.batch(()=>c(q,this).findAll(e).filter(s=>!s.isDisabled()&&!s.isStatic()).map(s=>{let i=s.fetch(void 0,r);return r.throwOnError||(i=i.catch(G)),s.state.fetchStatus==="paused"?Promise.resolve():i}));return Promise.all(n).then(G)}async query(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const r=c(q,this).build(this,t),n=r.isStaleByTime(W(t.staleTime,r))?await r.fetch(t):r.state.data,s=t.select;return s?s(n):n}fetchQuery(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const r=c(q,this).build(this,t);return r.isStaleByTime(W(t.staleTime,r))?r.fetch(t):Promise.resolve(r.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(G).catch(G)}infiniteQuery(e){return e._type="infinite",this.query(e)}fetchInfiniteQuery(e){return e._type="infinite",this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(G).catch(G)}ensureInfiniteQueryData(e){return e._type="infinite",this.ensureQueryData(e)}resumePausedMutations(){return jt.isOnline()?c(Ve,this).resumePausedMutations():Promise.resolve()}getQueryCache(){return c(q,this)}getMutationCache(){return c(Ve,this)}getDefaultOptions(){return c(Je,this)}setDefaultOptions(e){x(Je,this,e)}setQueryDefaults(e,t){c(tr,this).set(Ae(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){const t=[...c(tr,this).values()],r={};return t.forEach(n=>{je(e,n.queryKey)&&Object.assign(r,n.defaultOptions)}),r}setMutationDefaults(e,t){c(rr,this).set(Ae(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){const t=[...c(rr,this).values()],r={};return t.forEach(n=>{je(e,n.mutationKey)&&Object.assign(r,n.defaultOptions)}),r}defaultQueryOptions(e){if(e._defaulted)return e;const t={...c(Je,this).queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=Ir(t.queryKey,t)),t.refetchOnReconnect===void 0&&(t.refetchOnReconnect=t.networkMode!=="always"),t.throwOnError===void 0&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===Fr&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...c(Je,this).mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){c(q,this).clear(),c(Ve,this).clear()}},Os=Sr(!1),da=()=>Pr(Os),sl=Os.Provider;function pa(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var fa=Sr(pa()),ga=()=>Pr(fa),_a=(e,t,r)=>{const n=r?.state.error&&typeof e.throwOnError=="function"?Lr(e.throwOnError,[r.state.error,r]):e.throwOnError;(e.suspense||n)&&(t.isReset()||(e.retryOnMount=!1))},ma=e=>{pe(()=>{e.clearReset()},[e])},ba=({result:e,errorResetBoundary:t,throwOnError:r,query:n,suspense:s})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(s&&e.data===void 0||Lr(r,[e.error,n])),xa=e=>{if(e.suspense){const r=s=>s==="static"?s:Math.max(s??1e3,1e3),n=e.staleTime;e.staleTime=typeof n=="function"?(...s)=>r(n(...s)):r(n),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},va=(e,t)=>e?.suspense&&t.isPending,ya=(e,t,r)=>t.fetchOptimistic(e).catch(()=>{r.clearReset()});function ka(e,t,r){const n=da(),s=ga(),i=Ar(r),a=i.defaultQueryOptions(e),o=i.getQueryCache().get(a.queryHash),l=e.subscribed!==!1;a._optimisticResults=n?"isRestoring":l?"optimistic":void 0,xa(a),_a(a,s,o),ma(s);const[u]=de(()=>new t(i,a)),d=u.getOptimisticResult(a),p=!n&&l;if(jn(Ce(h=>{const f=p?u.subscribe(U.batchCalls(h)):G;return u.updateResult(),f},[u,p]),()=>u.getCurrentResult(),()=>u.getCurrentResult()),pe(()=>{u.setOptions(a)},[a,u]),va(a,d))throw ya(a,u,s);if(ba({result:d,errorResetBoundary:s,throwOnError:a.throwOnError,query:o,suspense:a.suspense}))throw d.error;return a.notifyOnChangeProps?d:u.trackResult(d)}function wa(e,t){const r=Ar(t),[n]=de(()=>new ca(r,e));pe(()=>{n.setOptions(e)},[n,e]);const s=jn(Ce(a=>n.subscribe(U.batchCalls(a)),[n]),()=>n.getCurrentResult(),()=>n.getCurrentResult()),i=Ce((...a)=>{n.mutate(a[0],a[1]).catch(G)},[n]);if(s.error&&Lr(n.options.throwOnError,[s.error]))throw s.error;return{...s,mutate:i,mutateAsync:s.mutate}}function Sa(e,t){return ka(e,aa,t)}var $a=6048e5;function Kr(e,t){return`schedulux_sess_${e}_${t}`}function Zr(e,t){try{const r=localStorage.getItem(Kr(e,t));if(!r)return null;const n=JSON.parse(r);return n.timestamp&&Date.now()-n.timestamp>$a?(Es(e,t),null):n}catch{return null}}function Gr(e,t,r){try{const n={...r,timestamp:r.timestamp||Date.now()};localStorage.setItem(Kr(e,t),JSON.stringify(n))}catch{}}function Es(e,t){try{localStorage.removeItem(Kr(e,t))}catch{}}async function Fs(e,t,r,n="live"){const s=Zr(t,r),i=e.replace(/\/+$/,""),a=n==="sandbox"?`${i}/api/v1/tenant/knowledge/onboarding/sandbox/init`:`${i}/api/v1/public/chat/init`,o={tenant_id:t,agent_id:r};s?.sessionId&&(o.session_id=s.sessionId),s?.token&&(o.token=s.token);const l=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},credentials:n==="sandbox"?"include":"same-origin",body:JSON.stringify(o)});if(!l.ok)throw new Error(`Init failed with status: ${l.status}`);const u=(await l.json()).data||{};Gr(t,r,{sessionId:u.session_id,token:u.token});const d=(u.messages||[]).map((p,h)=>({id:`init_${h}`,role:p.role==="user"?"user":"agent",content:p.content||p.text||"",created_at:p.created_at||new Date().toISOString()}));return{sessionId:u.session_id,token:u.token,isFirstTime:!!u.is_first_time,messages:d}}async function Ls(e,t,r,n,s,i,a,o,l="live"){const u=e.replace(/\/+$/,""),d=l==="sandbox"?`${u}/api/v1/tenant/knowledge/onboarding/sandbox`:`${u}/api/v1/public/chat`,p={tenant_id:t,agent_id:r,session_id:n,token:s,message:i};a&&(p.customer_name=a),o&&(p.customer_phone=o);const h=await fetch(d,{method:"POST",headers:{"Content-Type":"application/json"},credentials:l==="sandbox"?"include":"same-origin",body:JSON.stringify(p)});if(!h.ok){const m=await h.text().catch(()=>"");throw new Error(`Message failed (${h.status}): ${m||h.statusText}`)}const f=(await h.json()).data||{};return f.token&&Gr(t,r,{sessionId:f.session_id||n,token:f.token}),{response:f.response||f.reply||"",sessionId:f.session_id||n,token:f.token||s,user_message_id:f.user_message_id||void 0,agent_message_id:f.agent_message_id||void 0,created_at:f.created_at||void 0,booking_id:f.booking_id||void 0,booking_reference:f.booking_reference||void 0,status:f.status||void 0}}async function Pa(e,t,r,n,s,i,a,o,l="live",u){const d=e.replace(/\/+$/,""),p=l==="sandbox"?`${d}/api/v1/tenant/knowledge/onboarding/sandbox/stream`:`${d}/api/v1/public/chat/stream`,h={tenant_id:t,agent_id:r,session_id:n,token:s,message:i};a&&(h.customer_name=a),o&&(h.customer_phone=o);let f;try{f=await fetch(p,{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream"},credentials:l==="sandbox"?"include":"same-origin",body:JSON.stringify(h)})}catch(P){return console.warn("[Schedulux Widget] Stream fetch failed, falling back to unary:",P),Ls(e,t,r,n,s,i,a,o,l)}if(!f.ok||!f.body)return console.warn(`[Schedulux Widget] Stream endpoint returned status ${f.status}, falling back to unary.`),Ls(e,t,r,n,s,i,a,o,l);const m=f.body.getReader(),y=new TextDecoder;let b="",v="",g={};try{for(;;){const{done:P,value:O}=await m.read();if(P)break;b+=y.decode(O,{stream:!0});const T=b.split(`
`);b=T.pop()||"";for(const D of T){const k=D.trim();if(!k.startsWith("data:"))continue;const E=k.slice(5).trim();if(E)try{const $=JSON.parse(E);$.token&&Gr(t,r,{sessionId:$.session_id||n,token:$.token}),$.event_type==="token"&&$.delta?(v+=$.delta,u?.($.delta)):$.event_type==="done"?(g=$,$.response&&!v&&(v=$.response,u?.($.response))):$.event_type==="error"&&$.delta&&!v&&(v=$.delta,u?.($.delta))}catch{}}}}catch(P){console.warn("[Schedulux Widget] Stream read interrupted:",P)}return{response:v||g.response||"",sessionId:g.session_id||n,token:g.token||s,user_message_id:g.user_message_id||void 0,agent_message_id:g.agent_message_id||void 0,created_at:g.created_at||void 0,booking_id:g.booking_id||void 0,booking_reference:g.booking_reference||void 0,status:g.status||void 0}}async function Ra(e,t,r,n="live"){const s=e.replace(/\/+$/,""),i=n==="sandbox"?`${s}/api/v1/tenant/knowledge/onboarding/sandbox/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(r)}`:`${s}/api/v1/public/chat/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(r)}`,a=await fetch(i,{method:"GET",headers:{Accept:"application/json"},credentials:n==="sandbox"?"include":"same-origin"});if(!a.ok)throw new Error(`Widget config fetch failed (${a.status}): ${a.statusText}`);return(await a.json()).data?.widget_config||{}}async function Ca({apiBase:e,tenantId:t,agentId:r,sessionId:n,token:s,before:i,limit:a=20,mode:o="live"}){const l=e.replace(/\/+$/,""),u=new URLSearchParams;u.append("tenant_id",t),u.append("agent_id",r),n&&u.append("session_id",n),s&&u.append("token",s),i&&u.append("before",i),u.append("limit",String(a));const d=o==="sandbox"?`${l}/api/v1/tenant/knowledge/onboarding/sandbox/messages?${u.toString()}`:`${l}/api/v1/public/chat/messages?${u.toString()}`,p=await fetch(d,{method:"GET",headers:{Accept:"application/json"},credentials:o==="sandbox"?"include":"same-origin"});if(!p.ok){const f=await p.text().catch(()=>"");throw new Error(`Fetch messages failed (${p.status}): ${f||p.statusText}`)}const h=(await p.json()).data||{};return{messages:(h.messages||[]).map((f,m)=>({id:f.id||f.message_id||`msg_${Date.now()}_${m}`,role:f.role==="user"?"user":"agent",content:f.content||f.text||"",created_at:f.created_at||new Date().toISOString(),booking_id:f.booking_id,booking_reference:f.booking_reference,status:f.status})),next_cursor:h.next_cursor||null,has_more:!!h.has_more}}var Vr={all:["schedulux-widget"],messages:(e,t,r,n)=>[...Vr.all,"messages",e,t,r,n??""]};function Ma({options:e,config:t}){const r=Ar(),[n,s]=de(()=>Zr(e.tenantId,e.agentId)?.sessionId||""),[i,a]=de(()=>Zr(e.tenantId,e.agentId)?.token),[o,l]=de(!1),[u,d]=de(!1),p=t.initial_greeting||"Hi there! How can I assist you with scheduling today?",h=e.mode||"live",f=ht(()=>Vr.messages(h,e.tenantId,e.agentId,n),[h,e.tenantId,e.agentId,n]);pe(()=>{let k=!1;return(async()=>{l(!0);try{const $=await Fs(e.apiBase||"",e.tenantId,e.agentId,h);k||(s($.sessionId),a($.token))}catch($){console.warn("[Schedulux Widget] Session init fallback:",$)}finally{k||l(!1)}})(),()=>{k=!0}},[e.apiBase,e.tenantId,e.agentId,h]);const{data:m,fetchPreviousPage:y,hasPreviousPage:b,isFetchingPreviousPage:v,isLoading:g}=Sa({queryKey:f,queryFn:async({pageParam:k})=>n?Ca({apiBase:e.apiBase||"",tenantId:e.tenantId,agentId:e.agentId,sessionId:n,token:i,before:k,limit:20,mode:h}):{messages:[],next_cursor:null,has_more:!1},initialPageParam:void 0,getPreviousPageParam:k=>k.has_more&&k.next_cursor?k.next_cursor:void 0,getNextPageParam:()=>{},enabled:!!n,staleTime:3e5,refetchOnWindowFocus:!1}),P=ht(()=>{const k=m?.pages?m.pages.flatMap(M=>M.messages):[];if(k.length===0)return[{id:"welcome",role:"agent",content:p,created_at:new Date().toISOString()}];const E=new Set,$=[];for(const M of k){if(M.id){if(E.has(M.id))continue;E.add(M.id)}$.push(M)}return $},[m?.pages,p]),O=wa({mutationFn:async k=>{if(e.onSendMessage){const F=await e.onSendMessage(k);return{response:F.response,sessionId:n,token:i,booking_id:F.booking_id,booking_reference:F.booking_reference,status:F.status,streamAgentId:void 0}}const E=`stream_${Date.now()}`;let $=!1;const M=F=>{F&&($||($=!0,d(!1)),r.setQueryData(f,A=>{if(!A||A.pages.length===0)return{pageParams:[void 0],pages:[{messages:[{id:E,role:"agent",content:F,created_at:new Date().toISOString(),delivery_status:"pending"}],next_cursor:null,has_more:!1}]};const V=A.pages.length-1,K=A.pages[V],Y=K.messages.findIndex(fn=>fn.id===E);let ie;Y>=0?(ie=[...K.messages],ie[Y]={...ie[Y],content:(ie[Y].content||"")+F}):ie=[...K.messages,{id:E,role:"agent",content:F,created_at:new Date().toISOString(),delivery_status:"pending"}];const se=[...A.pages];return se[V]={...K,messages:ie},{...A,pages:se}}))};return{...await Pa(e.apiBase||"",e.tenantId,e.agentId,n,i,k,e.customerName,e.customerPhone,h,M),streamAgentId:$?E:void 0}},onMutate:async k=>{d(!0);const E=`temp_${Date.now()}`,$={id:E,role:"user",content:k,created_at:new Date().toISOString(),delivery_status:"pending"};return r.setQueryData(f,M=>{if(!M||M.pages.length===0)return{pageParams:[void 0],pages:[{messages:[$],next_cursor:null,has_more:!1}]};const F=M.pages.length-1,A={...M.pages[F],messages:[...M.pages[F].messages,$]},V=[...M.pages];return V[F]=A,{...M,pages:V}}),{tempId:E}},onSuccess:(k,E,$)=>{d(!1);const M=!!(k.sessionId&&k.sessionId!==n);M&&k.sessionId&&s(k.sessionId),k.token&&a(k.token);const F=k.response||"I would be happy to help you with that!",A={id:k.agent_message_id||k.streamAgentId||`agent_${Date.now()}`,role:"agent",content:F,created_at:k.created_at||new Date().toISOString(),booking_id:k.booking_id,booking_reference:k.booking_reference,status:k.status,delivery_status:"sent"},V=K=>{if(!K||K.pages.length===0)return{pageParams:[void 0],pages:[{messages:[A],next_cursor:null,has_more:!1}]};const Y=K.pages.length-1,ie=K.pages[Y];let se=ie.messages.map(ee=>$?.tempId&&ee.id===$.tempId?{...ee,id:k.user_message_id||ee.id,delivery_status:"sent"}:ee);k.streamAgentId&&se.some(ee=>ee.id===k.streamAgentId)?se=se.map(ee=>ee.id===k.streamAgentId?A:ee):se.some(ee=>ee.id===A.id||ee.role==="agent"&&ee.content===A.content&&Math.abs(new Date(ee.created_at||0).getTime()-new Date(A.created_at||0).getTime())<3e3)||se.push(A);const fn={...ie,messages:se},gi=[...K.pages];return gi[Y]=fn,{...K,pages:gi}};if(M&&k.sessionId){const K=Vr.messages(h,e.tenantId,e.agentId,k.sessionId),Y=r.getQueryData(f);r.setQueryData(K,V(Y))}else r.setQueryData(f,V);k.booking_reference&&e.onBookingConfirmed?.({booking_id:k.booking_id,booking_reference:k.booking_reference,status:k.status})},onError:(k,E,$)=>{console.error("[Schedulux Widget] Message error:",k),r.setQueryData(f,A=>{if(!A||A.pages.length===0)return A;const V=A.pages.length-1,K=A.pages[V],Y=K.messages.map(se=>$?.tempId&&se.id===$.tempId?{...se,delivery_status:"error"}:se),ie=[...A.pages];return ie[V]={...K,messages:Y},{...A,pages:ie}});const M=t.fallback_message||"I apologize, but I am having trouble connecting to the booking server. Please try again shortly or contact support.",F={id:`err_${Date.now()}`,role:"agent",content:M,created_at:new Date().toISOString(),delivery_status:"error"};r.setQueryData(f,A=>{if(!A||A.pages.length===0)return A;const V=A.pages.length-1,K={...A.pages[V],messages:[...A.pages[V].messages,F]},Y=[...A.pages];return Y[V]=K,{...A,pages:Y}})},onSettled:()=>{d(!1)}}),T=Ce(async k=>{!k.trim()||u||!n||await O.mutateAsync(k.trim())},[u,n,O]),D=Ce(async()=>{Es(e.tenantId,e.agentId),r.removeQueries({queryKey:f}),s(""),a(void 0),l(!0);try{const k=await Fs(e.apiBase||"",e.tenantId,e.agentId,h);s(k.sessionId),a(k.token)}finally{l(!1)}e.onReset?.()},[e.tenantId,e.agentId,e.apiBase,h,r,f,e.onReset]);return{messages:P,isTyping:u,isLoadingMessages:g,isInitializing:o,hasOlderMessages:!!b,isFetchingOlderMessages:v,loadOlderMessages:y,sendMessage:T,resetSession:D}}function Ta({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:_("path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"})})}function Aa({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M8 2v4"}),_("path",{d:"M16 2v4"}),_("rect",{width:"18",height:"18",x:"3",y:"4",rx:"2"}),_("path",{d:"M3 10h18"})]})}function Ia({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("circle",{cx:"12",cy:"12",r:"10"}),_("path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"}),_("path",{d:"M12 17h.01"})]})}function Oa({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"m22 2-7 20-4-9-9-4Z"}),_("path",{d:"M22 2 11 13"})]})}function zs({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M18 6 6 18"}),_("path",{d:"m6 6 12 12"})]})}function Ea({className:e="",size:t=16}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),_("path",{d:"M21 3v5h-5"}),_("path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),_("path",{d:"M8 16H3v5"})]})}function Fa({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("circle",{cx:"12",cy:"12",r:"10"}),_("path",{d:"m9 12 2 2 4-4"})]})}function La({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M12 8V4H8"}),_("rect",{width:"16",height:"12",x:"4",y:"8",rx:"2"}),_("path",{d:"M2 14h2"}),_("path",{d:"M20 14h2"}),_("path",{d:"M15 13v2"}),_("path",{d:"M9 13v2"})]})}function kt(e){"@babel/helpers - typeof";return kt=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},kt(e)}function za(e,t){if(kt(e)!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var n=r.call(e,t||"default");if(kt(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Ba(e){var t=za(e,"string");return kt(t)=="symbol"?t:t+""}function z(e,t,r){return(t=Ba(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var wt,ir;function Jr(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var Be=Jr();function Bs(e){Be=e}var We={exec:()=>null};function De(e){let t=[];return r=>{let n=Math.max(0,Math.min(3,r-1)),s=t[n];return s||(s=e(n),t[n]=s),s}}function R(e,t=""){let r=typeof e=="string"?e:e.source,n={replace:(s,i)=>{let a=typeof i=="string"?i:i.source;return a=a.replace(H.caret,"$1"),r=r.replace(s,a),n},getRegex:()=>new RegExp(r,t)};return n}var Ws=((e="")=>{try{return!!new RegExp("(?<=1)(?<!1)"+e)}catch{return!1}})(),H={codeRemoveIndent:/^(?: {0,3}\t| {1,4})/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,endingSpaceTabChar:/[ \t]$/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,leadingSpaceTab:/^[ \t]+/,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,blockquoteMarkerWhitespace:/^( {0,3}>)([ \t]+)/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\][ \t]+\S/,listReplaceTask:/^\[[ xX]\][ \t]+/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,numericCharacterReference:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/,numericCharacterReferenceOrAmpersand:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:De(e=>new RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),hrRegex:De(e=>new RegExp(`^ {0,${e}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),fencesBeginRegex:De(e=>new RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),headingBeginRegex:De(e=>new RegExp(`^ {0,${e}}#{1,6}(?:\\s|$)`)),pedanticHeadingBeginRegex:De(e=>new RegExp(`^ {0,${e}}#`)),htmlBeginRegex:De(e=>new RegExp(`^ {0,${e}}(?:</?(?:${$t})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`,"i")),blockquoteBeginRegex:De(e=>new RegExp(`^ {0,${e}}>`))},Wa=/^(?:[ \t]*(?:\n|$))+/,Da=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Na=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}(?:(?=`)\1`*|(?=~)\1~*) *(?=\n|$)|$)/,St=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Qa=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Xr=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,Ds=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+)[ \t]*(?:\n+|$)/,Ns=R(Ds).replace(/bull/g,Xr).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),qa=R(Ds).replace(/bull/g,Xr).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Yr=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/,ja=/^[^\n]+/,en=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\\n]|\n(?![ \t]*\n))+/,Ua=R(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",en).replace("title",/(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n]|\n(?!\n))*'|\((?:\\[\s\S]|[^()\\])*\))/).getRegex(),Ha=R(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g,Xr).getRegex(),$t="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",tn=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Ka=R("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?:[ \\t]+|\\n|/?>|$)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",tn).replace("tag",$t).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),Qs=e=>R(Yr).replace("hr",St).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list",e).replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",$t).getRegex(),Za=Qs(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/),Ga=Qs(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/),rn={blockquote:R(/^( {0,3}> ?(?:(?![ \t]*(?:\n|$))(paragraph)|[^\n]*)(?:\n|$))+/).replace("paragraph",Ga).getRegex(),code:Da,def:Ua,fences:Na,heading:Qa,hr:St,html:Ka,lheading:Ns,list:Ha,newline:Wa,paragraph:Za,table:We,text:ja},qs=R("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",St).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",$t).getRegex(),Va={...rn,lheading:qa,table:qs,paragraph:R(Yr).replace("hr",St).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",qs).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",$t).getRegex()},Ja={...rn,html:R(`^ *(?:comment(?: *\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1>(?: *\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?>(?: *\\n{2,}|\\s*$))`).replace("comment",tn).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:We,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:R(Yr).replace("hr",St).replace("heading",` *#{1,6} *[^
]`).replace("lheading",Ns).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Xa=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Ya=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,js=/^( {2,}|\\)\n(?!\s*$)[ \t]*/,eo=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,ce=/[\p{P}\p{S}]/u,Xe=/[\s\p{P}\p{S}]/u,Pt=/[^\s\p{P}\p{S}]/u,to=R(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,Xe).getRegex(),ro=/[\p{Pi}\p{Ps}"']/u,Us=/(?!~)[\p{P}\p{S}]/u,no=/(?!~)[\s\p{P}\p{S}]/u,so=/(?:[^\s\p{P}\p{S}]|~)/u,io=R(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Ws?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),Hs=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,ao=R(Hs,"u").replace(/punct/g,ce).getRegex(),oo=R(Hs,"u").replace(/punct/g,Us).getRegex(),lo=R(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/,"u").replace(/openQuote/g,ro).replace(/punct/g,ce).getRegex(),Ks="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",co=R(Ks,"gu").replace(/notPunctSpace/g,Pt).replace(/punctSpace/g,Xe).replace(/punct/g,ce).getRegex(),uo=R(Ks,"gu").replace(/notPunctSpace/g,so).replace(/punctSpace/g,no).replace(/punct/g,Us).getRegex(),ho=R("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,Pt).replace(/punctSpace/g,Xe).replace(/punct/g,ce).getRegex(),po=R("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,Pt).replace(/punctSpace/g,Xe).replace(/punct/g,ce).getRegex(),fo=R("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,Pt).replace(/punctSpace/g,Xe).replace(/punct/g,ce).getRegex(),go=R(/^~~?(?:((?!~)punct)|[^\s~])/,"u").replace(/punct/g,ce).getRegex(),_o=R("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,Pt).replace(/punctSpace/g,Xe).replace(/punct/g,ce).getRegex(),mo=R(/\\(punct)/,"gu").replace(/punct/g,ce).getRegex(),bo=R(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/,"gu").replace(/punct/g,ce).getRegex(),xo=R(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),vo=R(tn).replace("(?:-->|$)","-->").getRegex(),yo=R("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",vo).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Zs=/\[(?:\\[\s\S]|[^\[\]\\])*\]/,ar=R(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets",Zs).getRegex(),ko=R(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace("label",ar).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title",/"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\((?:\\[\s\S]|[^)\\])*\)/).getRegex(),wo=R(/^!?\[(label)\]\[(ref)\]/).replace("label",ar).replace("ref",en).getRegex(),So=R(/^!?\[(ref)\](?:\[\])?/).replace("ref",en).getRegex(),Gs=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/,$o=R(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets",Zs).getRegex(),Po=R("reflink|nolink(?!\\()","g").replace("reflink",R(/^!?\[(label)\]\[(ref)\]/).replace("label",$o).replace("ref",Gs).getRegex()).replace("nolink",R(/^!?\[(ref)\](?:\[\])?/).replace("ref",Gs).getRegex()).getRegex(),Vs=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Ro=R(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g,/[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),nn={_backpedal:We,anyPunctuation:mo,anyPunctuationOutsideCode:bo,autolink:xo,blockSkip:io,br:js,code:Ya,del:We,delLDelim:We,delRDelim:We,emStrongLDelim:ao,emStrongRDelimAst:co,emStrongRDelimUnd:po,escape:Xa,link:ko,nolink:So,punctuation:to,reflink:wo,reflinkSearch:Po,tag:yo,text:eo,url:We},Co={...nn,emStrongLDelim:lo,emStrongRDelimAst:ho,emStrongRDelimUnd:fo,link:R(/^!?\[(label)\]\((.*?)\)/).replace("label",ar).getRegex(),reflink:R(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",ar).getRegex()},sn={...nn,emStrongRDelimAst:uo,emStrongLDelim:oo,delLDelim:go,delRDelim:_o,url:R(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol",Ro).replace("protocol",Vs).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:R(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|wwwStart|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol",Vs).replace(/emailProtocol/g,/(?:mailto|xmpp):/).replace("wwwStart",Ws?"(?<![^\\s*_~(])www\\.":"www\\.").getRegex()},Mo={...sn,br:R(js).replace("{2,}","*").getRegex(),text:R(sn.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},or={normal:rn,gfm:Va,pedantic:Ja},Rt={normal:nn,gfm:sn,breaks:Mo,pedantic:Co},To={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},Js=e=>To[e];function ne(e,t){if(t){if(H.escapeTest.test(e))return e.replace(H.escapeReplace,Js)}else if(H.escapeTestNoEncode.test(e))return e.replace(H.escapeReplaceNoEncode,Js);return e}function Ao(e){return H.numericCharacterReference.test(e)?e.replace(H.numericCharacterReferenceOrAmpersand,(t,r,n)=>{if(r===void 0&&n===void 0)return"&amp;";let s=r===void 0?Number.parseInt(n,16):Number.parseInt(r,10);return s===0||s>1114111||s>=55296&&s<=57343?"�":s===38?"&amp;":String.fromCodePoint(s)}):e}function Xs(e){try{e=encodeURI(e).replace(H.percentDecode,"%")}catch{return null}return e}function Ys(e,t){let r=e.replace(H.findPipe,(s,i,a)=>{let o=!1,l=i;for(;--l>=0&&a[l]==="\\";)o=!o;return o?"|":" |"}).split(H.splitPipe),n=0;if(r[0].trim()||r.shift(),r.length>0&&!r.at(-1)?.trim()&&r.pop(),t)if(r.length>t)r.splice(t);else for(;r.length<t;)r.push("");for(;n<r.length;n++)r[n]=r[n].trim().replace(H.slashPipe,"|");return r}function _e(e,t,r){let n=e.length;if(n===0)return"";let s=0;for(;s<n;){let i=e.charAt(n-s-1);if(i===t&&!r)s++;else if(i!==t&&r)s++;else break}return e.slice(0,n-s)}function ei(e){let t=e.split(`
`),r=t.length-1;for(;r>=0&&H.blankLine.test(t[r]);)r--;return t.length-r<=2?e:t.slice(0,r+1).join(`
`)}function lr(e){return e.trim().replace(H.multipleSpaceGlobal," ").toLowerCase().toUpperCase().toLowerCase()}function ti(e,t){if(e.indexOf(t[0])===-1&&e.indexOf(t[1])===-1)return-1;let r=0;for(let n=0;n<e.length;n++)if(e[n]==="\\")n++;else if(e[n]===t[0])r++;else if(e[n]===t[1]&&(r--,r<0))return n;return r>0?-2:-1}var Ye=new WeakMap;function an(e){let t={"*":-1,_:-1},r=-1,n=e.length;for(let s=0;s<n;s++){let i=e[s];if(i!=="*"&&i!=="_"&&i!=="~")continue;let a=s===0?`
`:e[s-1],o=s+1;for(;o<n&&e[o]===i;)o++;a!==" "&&a!=="	"&&a!==`
`&&a!=="\r"&&a!=="\f"&&(i==="~"?r=s:t[i]=s),s=o-1}return{maskedSrc:e,lastPossibleEmStrongCloserIndex:t,lastPossibleDelCloserIndex:r}}function Io(e,t){let r=an(t),n=Ye.get(e);n?n.push(r):Ye.set(e,[r])}function Oo(e){let t=Ye.get(e);t&&(t.pop(),t.length===0&&Ye.delete(e))}function Eo(e,t,r){let n=Ye.get(e)?.at(-1);return n&&n.maskedSrc===t?n.lastPossibleEmStrongCloserIndex[r]:an(t).lastPossibleEmStrongCloserIndex[r]}function Fo(e,t){let r=Ye.get(e)?.at(-1);return r&&r.maskedSrc===t?r.lastPossibleDelCloserIndex:an(t).lastPossibleDelCloserIndex}function cr(e,t=0){let r=t,n="";for(let s of e)if(s==="	"){let i=4-r%4;n+=" ".repeat(i),r+=i}else n+=s,r++;return n}function ri(e,t,r,n,s){let i=t.href,a=t.title||null,o=e[1].replace(s.other.outputLinkReplace,"$1"),l=e[0].charAt(0)==="!",u=n.state.inLink,d=n.state.linkEmitted,p=n.state.inRawBlock;n.state.inLink=!0,n.state.linkEmitted=!1;let h=n.inlineTokens(o),f=n.state.linkEmitted;if(n.state.linkEmitted=d,n.state.inLink=u,!l){if(f){n.state.inRawBlock=p;return}n.state.linkEmitted=!0}return{type:l?"image":"link",raw:r,href:i,title:a,text:o,tokens:h}}function Lo(e,t,r){let n=e.match(r.other.indentCodeCompensation);if(n===null)return t;let s=n[1];return t.split(`
`).map(i=>{let a=i.match(r.other.beginningSpace);if(a===null)return i;let[o]=a;return i.slice(Math.min(o.length,s.length))}).join(`
`)}function ni(e,t,r,n){if(!t.includes("<"))return!1;for(let s=0;s<t.length;s++){if(t[s]==="\\"){s++;continue}if(t[s]==="`"){let o=n.inline.code.exec(t.slice(s));if(o){s+=o[0].length-1;continue}}if(t[s]!=="<")continue;let i=e.slice(r+s),a=n.inline.tag.exec(i)||n.inline.autolink.exec(i);if(a){if(a[0].length>t.length-s)return!0;s+=a[0].length-1}}return!1}var et=class{constructor(e){z(this,"options",void 0),z(this,"rules",void 0),z(this,"lexer",void 0),this.options=e||Be}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let r=this.options.pedantic?t[0]:ei(t[0]);return{type:"code",raw:r,codeBlockStyle:"indented",text:r.replace(this.rules.other.codeRemoveIndent,"")}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let r=t[0],n=Lo(r,t[3]||"",this.rules);return{type:"code",raw:r,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:n}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let r=t[2].trim();if(this.rules.other.endingHash.test(r)){let n=_e(r,"#");(this.options.pedantic||!n||this.rules.other.endingSpaceTabChar.test(n))&&(r=n.trim())}return{type:"heading",raw:_e(t[0],`
`),depth:t[1].length,text:r,tokens:this.lexer.inline(r)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:_e(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let r=_e(t[0],`
`).split(`
`),n="",s="",i=[];for(;r.length>0;){let a=!1,o=[],l=0;for(;l<r.length;l++)if(this.rules.other.blockquoteStart.test(r[l]))o.push(r[l]),a=!0;else if(!a)o.push(r[l]);else break;r=r.slice(l);let u=o.join(`
`),d=u.replace(this.rules.other.blockquoteMarkerWhitespace,(f,m,y)=>m+cr(y,m.length)).replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");n=n?`${n}
${u}`:u,s=s?`${s}
${d}`:d;let p=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(d,i,!0),this.lexer.state.top=p,r.length===0)break;let h=i.at(-1);if(h?.type==="code"||h?.type==="heading"||h?.type==="hr"||h?.type==="html"||h?.type==="table")break;if(h?.type==="blockquote"){let f=h,m=r.join(`
`),y=f.raw+`
`+m.replace(this.rules.other.blockquoteSetextReplace2,""),b=this.blockquote(y);i[i.length-1]=b;let v=y.substring(b.raw.length).replace(/^\n/,""),g=v?v.split(`
`).length:0,P=g?r.slice(0,-g):r;if(P.length>0&&(n=`${n}
${P.join(`
`)}`),s=s.substring(0,s.length-f.text.length)+b.text,r=r.slice(P.length),r.length>0&&this.rules.other.blockquoteStart.test(r[0]))continue;break}else if(h?.type==="list"){let f=h,m=f.raw+`
`+r.join(`
`),y=this.list(m);i[i.length-1]=y;let b=y.raw.length>f.raw.length?m.slice(f.raw.length+1,y.raw.length).split(`
`).length:0;if(b>0){let v=r.slice(0,b).join(`
`);n=`${n}
${v}`,s=`${s}
${v}`}r=r.slice(b);continue}}return{type:"blockquote",raw:n,tokens:i,text:s}}}list(e){let t=this.rules.block.list.exec(e);if(t){let r=e,n=()=>r.length-e.length,s=t[1].trim(),i=s.length>1,a={type:"list",raw:"",ordered:i,start:i?+s.slice(0,-1):"",loose:!1,items:[]};s=i?`\\d{1,9}\\${s.slice(-1)}`:`\\${s}`,this.options.pedantic&&(s=i?s:"[*+-]");let o=this.rules.other.listItemRegex(s),l=!1;for(;e;){let d=!1,p="";if(!(t=o.exec(e))||this.rules.block.hr.test(e))break;let h=n();e=e.substring(t[0].length);let f=t[2].split(`
`,1)[0],m=t[1].length,y=this.options.pedantic?cr(f,m):f.replace(this.rules.other.leadingSpaceTab,O=>cr(O,m)),b=e.split(`
`,1)[0],v=!y.trim(),g=0;if(this.options.pedantic?(g=2,p=y.trimStart()):v?g=m+1:(g=y.search(this.rules.other.nonSpaceChar),g=g>4?1:g,p=y.slice(g),g+=m),v&&this.rules.other.blankLine.test(b)&&(e=e.substring(b.length+1),d=!0),!d){let O=this.rules.other.nextBulletRegex(g),T=this.rules.other.hrRegex(g),D=this.rules.other.fencesBeginRegex(g),k=this.options.pedantic?this.rules.other.pedanticHeadingBeginRegex(g):this.rules.other.headingBeginRegex(g),E=this.rules.other.htmlBeginRegex(g),$=this.rules.other.blockquoteBeginRegex(g);for(;e;){let M=e.split(`
`,1)[0],F;if(b=M,this.options.pedantic?(b=b.replace(this.rules.other.listReplaceNesting,"  "),F=b):F=b.replace(this.rules.other.leadingSpaceTab,A=>cr(A)),D.test(b)||k.test(b)||E.test(b)||$.test(b)||O.test(b)||T.test(b))break;if(F.search(this.rules.other.nonSpaceChar)>=g||!b.trim())p+=`
`+F.slice(g);else{if(v||y.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||D.test(y)||k.test(y)||E.test(y)||T.test(y))break;let A=!this.options.pedantic&&/^ {0,3}(?:=+|-+) *$/.test(b)&&this.rules.block.lheading.test(`${y}
${b}`)?`    ${F.replace(/^ {0,3}/,"")}`:b;p+=`
`+A}v=!b.trim(),e=e.substring(M.length+1),y=F.slice(g)}}let P=r.slice(h,n());a.loose||(l?a.loose=!0:this.rules.other.doubleBlankLine.test(P)&&(l=!0)),a.items.push({type:"list_item",raw:P,task:!!this.options.gfm&&this.rules.other.listIsTask.test(p),loose:!1,text:p,tokens:[]})}let u=a.items.at(-1);if(u)u.raw=u.raw.trimEnd(),u.text=u.text.trimEnd();else return;a.raw=r.slice(0,n()).trimEnd();for(let d of a.items)if(this.lexer.state.top=!1,d.tokens=this.lexer.blockTokens(d.text,[]),!a.loose){let p=d.tokens.filter(h=>h.type==="space");a.loose=p.length>0&&p.some(h=>this.rules.other.anyLine.test(h.raw))}for(let d of a.items){let p=d.tokens[0];if(d.task&&(p?.type==="text"||p?.type==="paragraph")){d.text=d.text.replace(this.rules.other.listReplaceTask,""),p.raw=p.raw.replace(this.rules.other.listReplaceTask,""),p.text=p.text.replace(this.rules.other.listReplaceTask,"");for(let f=this.lexer.inlineQueue.length-1;f>=0;f--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[f].src)){this.lexer.inlineQueue[f].src=this.lexer.inlineQueue[f].src.replace(this.rules.other.listReplaceTask,"");break}let h=this.rules.other.listTaskCheckbox.exec(d.raw);if(h){let f={type:"checkbox",raw:h[0]+" ",checked:h[0]!=="[ ]"};d.checked=f.checked,a.loose?d.tokens[0]&&["paragraph","text"].includes(d.tokens[0].type)&&"tokens"in d.tokens[0]&&d.tokens[0].tokens?(d.tokens[0].raw=f.raw+d.tokens[0].raw,d.tokens[0].text=f.raw+d.tokens[0].text,d.tokens[0].tokens.unshift(f)):d.tokens.unshift({type:"paragraph",raw:f.raw,text:f.raw,tokens:[f]}):d.tokens.unshift(f)}}else d.task&&(d.task=!1)}if(a.loose)for(let d of a.items){d.loose=!0;for(let p of d.tokens)p.type==="text"&&(p.type="paragraph")}return a}}html(e){let t=this.rules.block.html.exec(e);if(t){let r=ei(t[0]);return{type:"html",block:!0,raw:r,pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:r}}}def(e){let t=this.rules.block.def.exec(e);if(t){if(!this.rules.other.startAngleBracket.test(t[2])&&ti(t[2],"()")!==-1)return;let r=lr(t[1]),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",s=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:r,raw:_e(t[0],`
`),href:n,title:s}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let r=Ys(t[1]),n=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),s=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],i={type:"table",raw:_e(t[0],`
`),header:[],align:[],rows:[]};if(r.length===n.length){for(let a of n)this.rules.other.tableAlignRight.test(a)?i.align.push("right"):this.rules.other.tableAlignCenter.test(a)?i.align.push("center"):this.rules.other.tableAlignLeft.test(a)?i.align.push("left"):i.align.push(null);for(let a=0;a<r.length;a++)i.header.push({text:r[a],tokens:this.lexer.inline(r[a]),header:!0,align:i.align[a]});for(let a of s)i.rows.push(Ys(a,i.header.length).map((o,l)=>({text:o,tokens:this.lexer.inline(o),header:!1,align:i.align[l]})));return i}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let r=t[1].trim();return{type:"heading",raw:_e(t[0],`
`),depth:t[2].charAt(0)==="="?1:2,text:r,tokens:this.lexer.inline(r)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let r=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:r,tokens:this.lexer.inline(r)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){if(this.lexer.state.linkParenPossible===!1)return;let t=this.rules.inline.link.exec(e);if(t){let r=t[0].charAt(0)==="!"?2:1;if(!this.options.pedantic&&ni(e,t[1],r,this.rules))return;let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let o=_e(n.slice(0,-1),"\\");if((n.length-o.length)%2===0)return}else{let o=ti(t[2],"()");if(o===-2)return;if(o>-1){let l=(t[0].indexOf("!")===0?5:4)+t[1].length+o;t[2]=t[2].substring(0,o),t[0]=t[0].substring(0,l).trim(),t[3]=""}}let s=_e(t[0].slice(0,-1),"\\");if((t[0].length-s.length)%2===0)return;let i=t[2],a="";if(this.options.pedantic){let o=this.rules.other.pedanticHrefTitle.exec(i);o&&(i=o[1],a=o[3])}else a=t[3]?t[3].slice(1,-1):"";return i=i.trim(),this.rules.other.startAngleBracket.test(i)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?i=i.slice(1):i=i.slice(1,-1)),ri(t,{href:i&&i.replace(this.rules.inline.anyPunctuation,"$1"),title:a&&a.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let r;if((r=this.rules.inline.reflink.exec(e))||(r=this.rules.inline.nolink.exec(e))){let n=r[0].charAt(0)==="!"?2:1;if(!this.options.pedantic&&ni(e,r[1],n,this.rules))return;let s=t[lr(r[2]||r[1])];if(!s){let i=r[0].charAt(0);return{type:"text",raw:i,text:i}}return ri(r,s,r[0],this.lexer,this.rules)}}emStrong(e,t,r=""){let n=this.rules.inline.emStrongLDelim.exec(e);if(!n||!n[1]&&!n[2]&&!n[3]&&!n[4])return;let s=n[0][0],i=r===s,a=t.length-e.length,o=a;for(;!this.options.pedantic&&o>0&&t[o-1]===s;)o--;let l=[...t.slice(Math.max(0,o-2),o)].at(-1)??"",u=l==="*"||l==="_"||!!this.rules.inline.punctuation.exec(l);o<a&&(r=l);let d=o<a?u:!!this.rules.inline.punctuation.exec(r);if(n[4]&&r.match(this.rules.other.unicodeAlphaNumeric))return;let p=n[1]||n[3]||"";if(!p||!r||d){let h=[...n[0]].length-1,f,m,y=h,b=0,v=a-o+h,g=!this.options.pedantic&&!!l.trim()&&(!!p||s==="*"&&!u);if(s!=="*"&&s!=="_")return;let P=s==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd,O=Eo(this,t,s),T=t.length-e.length+h;if(O<T)return;t=t.slice(-1*e.length+h);let D=O-T;for(P.lastIndex=0;(n=P.exec(t))!==null&&!(n.index>D);){if(f=n[1]||n[2]||n[3]||n[4]||n[5]||n[6],!f)continue;if(m=[...f].length,n[3]||n[4]){y+=m;continue}else if(n[5]||n[6]||g){if(i&&(n[5]||n[6]))break;if(v%3&&!((v+m)%3)){b+=m;continue}}if(y-=m,y>0)continue;m=Math.min(m,m+y+b);let k=[...n[0]][0].length,E=e.slice(0,h+n.index+k+m);if(Math.min(h,m)%2){let M=E.slice(1,-1);return{type:"em",raw:E,text:M,tokens:this.lexer.inlineTokens(M)}}let $=E.slice(2,-2);return{type:"strong",raw:E,text:$,tokens:this.lexer.inlineTokens($)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let r=t[2].replace(this.rules.other.newLineCharGlobal," "),n=this.rules.other.nonSpaceChar.test(r),s=this.rules.other.startingSpaceChar.test(r)&&this.rules.other.endingSpaceChar.test(r);return n&&s&&(r=r.substring(1,r.length-1)),{type:"codespan",raw:t[0],text:r}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e,t,r=""){let n=this.rules.inline.delLDelim.exec(e);if(n&&(!n[1]||!r||this.rules.inline.punctuation.exec(r))){let s=[...n[0]].length-1,i,a,o=s,l=this.rules.inline.delRDelim,u=Fo(this,t),d=t.length-e.length+s;if(u<d)return;t=t.slice(-1*e.length+s);let p=u-d;for(l.lastIndex=0;(n=l.exec(t))!==null&&!(n.index>p);){if(i=n[1]||n[2]||n[3]||n[4]||n[5]||n[6],!i||(a=[...i].length,a!==s))continue;if(n[3]||n[4]){o+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o);let h=[...n[0]][0].length,f=e.slice(0,s+n.index+h+a),m=f.slice(s,-s);return{type:"del",raw:f,text:m,tokens:this.lexer.inlineTokens(m)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let r,n;return t[2]==="@"?(r=t[1],n="mailto:"+r):(r=t[1],n=r),{type:"link",raw:t[0],text:r,href:n,autolink:!0,tokens:[{type:"text",raw:r,text:r}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let r,n;if(t[2]==="@")r=t[0],n="mailto:"+r;else{let s;do s=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(s!==t[0]);r=t[0],t[1]==="www."?n="http://"+t[0]:n=t[0]}return{type:"link",raw:t[0],text:r,href:n,autolink:!0,tokens:[{type:"text",raw:r,text:r}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let r=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:r?t[0]:Ao(t[0]),escaped:r}}}},ae=(wt=new WeakSet,class gn{constructor(t){ft(this,wt),z(this,"tokens",void 0),z(this,"options",void 0),z(this,"state",void 0),z(this,"inlineQueue",void 0),z(this,"tokenizer",void 0),this.tokens=[],this.tokens.links=Object.create(null),this.options=t||Be,this.options.tokenizer=this.options.tokenizer||new et,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,linkEmitted:!1,linkParenPossible:!0,top:!0};let r={other:H,block:or.normal,inline:Rt.normal};this.options.pedantic?(r.block=or.pedantic,r.inline=Rt.pedantic):this.options.gfm&&(r.block=or.gfm,this.options.breaks?r.inline=Rt.breaks:r.inline=Rt.gfm),this.tokenizer.rules=r}static get rules(){return{block:or,inline:Rt}}static lex(t,r){return new gn(r).lex(t)}static lexInline(t,r){return new gn(r).inlineTokens(t)}lex(t){t=t.replace(H.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let n=this.inlineQueue[r];this.state.inRawBlock=!1,this.inlineTokens(n.src,n.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],n=!1){this.tokenizer.lexer=this,this.options.pedantic&&(t=t.replace(H.tabCharGlobal,"    ").replace(H.spaceLine,""));let s=1/0;for(;t;){if(t.length<s)s=t.length;else{this.infiniteLoopError(t.charCodeAt(0));break}let i;if(this.options.extensions?.block?.some(o=>(i=o.call({lexer:this},t,r))?(t=t.substring(i.raw.length),r.push(i),!0):!1))continue;if(i=this.tokenizer.space(t)){t=t.substring(i.raw.length);let o=r.at(-1);i.raw.length===1&&o!==void 0?o.raw+=`
`:r.push(i);continue}if(i=this.tokenizer.code(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.at(-1).src=o.text):r.push(i);continue}if(i=this.tokenizer.fences(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.heading(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.hr(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.blockquote(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.list(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.html(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.def(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.raw,this.inlineQueue.at(-1).src=o.text):(this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title}),r.push(i));continue}if(i=this.tokenizer.table(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.lheading(t)){t=t.substring(i.raw.length),r.push(i);continue}let a=t;if(this.options.extensions?.startBlock){let o=1/0,l=t.slice(1),u;this.options.extensions.startBlock.forEach(d=>{u=d.call({lexer:this},l),typeof u=="number"&&u>=0&&(o=Math.min(o,u))}),o<1/0&&o>=0&&(a=t.substring(0,o+1))}if(this.state.top&&(i=this.tokenizer.paragraph(a))){let o=r.at(-1);n&&o?.type==="paragraph"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(i),n=a.length!==t.length,t=t.substring(i.raw.length);continue}if(i=this.tokenizer.text(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(i);continue}if(t){this.infiniteLoopError(t.charCodeAt(0));break}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}linkInText(t){if(!t.includes("["))return!1;let r=this.tokenizer.rules.inline.link;for(let n of t.matchAll(this.tokenizer.rules.inline.blockSkip))if(r.test(n[0])&&t.charAt(n.index-1)!=="!")return!0;for(let n of t.matchAll(this.tokenizer.rules.inline.reflinkSearch)){let s=n[0],i=s.lastIndexOf("[");if(!(s.charAt(0)==="!"||!Object.hasOwn(this.tokens.links,lr(s.slice(i+1,-1))))&&!(i>1&&this.linkInText(s.slice(1,i-1))))return!0}return!1}inlineTokens(t,r=[]){this.tokenizer.lexer=this;let n=this.state.linkParenPossible;this.state.linkParenPossible=n&&t.includes(")");try{return S(wt,this,zo).call(this,t,r)}finally{this.state.linkParenPossible=n}}infiniteLoopError(t){let r="Infinite loop on byte: "+t;if(this.options.silent)console.error(r);else throw new Error(r)}});function zo(e,t){let r=e.includes("*")||e.includes("_")||e.includes("~")||this.options.hooks?.emStrongMask||this.tokenizer.emStrong!==et.prototype.emStrong||this.tokenizer.del!==et.prototype.del?S(wt,this,Wo).call(this,e):e;Io(this.tokenizer,r);try{return S(wt,this,Bo).call(this,e,r,t)}finally{Oo(this.tokenizer)}}function Bo(e,t,r){let n=!1,s="",i=1/0;for(;e;){if(e.length<i)i=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}n||(s=""),n=!1;let a;if(this.options.extensions?.inline?.some(l=>(a=l.call({lexer:this},e,r))?(e=e.substring(a.raw.length),r.push(a),!0):!1))continue;if(a=this.tokenizer.escape(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.tag(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.link(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(a.raw.length);let l=r.at(-1);a.type==="text"&&l?.type==="text"?(l.raw+=a.raw,l.text+=a.text):r.push(a);continue}if(a=this.tokenizer.emStrong(e,t,s)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.codespan(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.br(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.del(e,t,s)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.autolink(e)){e=e.substring(a.raw.length),r.push(a);continue}if(!this.state.inLink&&(a=this.tokenizer.url(e))){e=e.substring(a.raw.length),r.push(a);continue}let o=e;if(this.options.extensions?.startInline){let l=1/0,u=e.slice(1),d;this.options.extensions.startInline.forEach(p=>{d=p.call({lexer:this},u),typeof d=="number"&&d>=0&&(l=Math.min(l,d))}),l<1/0&&l>=0&&(o=e.substring(0,l+1))}if(a=this.tokenizer.inlineText(o)){e=e.substring(a.raw.length),a.raw.slice(-1)!=="_"&&(s=a.raw.slice(-1)),n=!0;let l=r.at(-1);l?.type==="text"?(l.raw+=a.raw,l.text+=a.text):r.push(a);continue}if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return r}function Wo(e){let t=e;if(this.tokens.links&&e.includes("[")){let r=this.tokenizer.rules.inline.reflinkSearch,n=s=>{let i=s.lastIndexOf("[");if(!Object.hasOwn(this.tokens.links,lr(s.slice(i+1,-1))))return s;if(i>1&&s.charAt(0)!=="!"){let a=s.slice(1,i-1);if(this.linkInText(a))return"["+a.replace(r,n)+"]["+"a".repeat(s.length-i-2)+"]"}return"["+"a".repeat(s.length-2)+"]"};t=t.replace(r,n)}return t=t.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode,(r,n,s)=>s?"+".repeat(r.length):n?n+r.slice(n.length,-n.length).replace(/`/g,"+")+n:r),t=t.replace(this.tokenizer.rules.inline.blockSkip,(r,n,s)=>{let i=s?s.length:0;return r.slice(0,i)+"["+"a".repeat(r.length-i-2)+"]"}),t=this.options.hooks?.emStrongMask?.call({lexer:this},t)??t,t}var ur=class{constructor(e){z(this,"options",void 0),z(this,"parser",void 0),this.options=e||Be}space(e){return""}code({text:e,lang:t,escaped:r}){let n=(t||"").match(H.notSpaceStart)?.[0],s=e?e.replace(H.endingNewline,"")+`
`:"";return n?'<pre><code class="language-'+ne(n)+'">'+(r?s:ne(s,!0))+`</code></pre>
`:"<pre><code>"+(r?s:ne(s,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,r=e.start,n="";for(let a=0;a<e.items.length;a++){let o=e.items[a];n+=this.listitem(o)}let s=t?"ol":"ul",i=t&&r!==1?' start="'+r+'"':"";return"<"+s+i+`>
`+n+"</"+s+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",r="";for(let s=0;s<e.header.length;s++)r+=this.tablecell(e.header[s]);t+=this.tablerow({text:r});let n="";for(let s=0;s<e.rows.length;s++){let i=e.rows[s];r="";for(let a=0;a<i.length;a++)r+=this.tablecell(i[a]);n+=this.tablerow({text:r})}return n&&(n=`<tbody>${n}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+n+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),r=e.header?"th":"td";return(e.align?`<${r} align="${e.align}">`:`<${r}>`)+t+`</${r}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${ne(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,text:r,tokens:n,autolink:s}){let i=s?ne(r,!0):this.parser.parseInline(n),a=Xs(e);if(a===null)return i;e=ne(a,s);let o='<a href="'+e+'"';return t&&(o+=' title="'+ne(t)+'"'),o+=">"+i+"</a>",o}image({href:e,title:t,text:r,tokens:n}){n&&(r=this.parser.parseInline(n,this.parser.textRenderer));let s=Xs(e);if(s===null)return ne(r);e=s;let i=`<img src="${ne(e)}" alt="${ne(r)}"`;return t&&(i+=` title="${ne(t)}"`),i+=">",i}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:ne(e.text)}},on=class{constructor(){z(this,"parser",void 0)}strong({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}em({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}codespan({text:e}){return e}del({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}html({text:e}){return e}text({text:e}){return e}link({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}image({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}br(){return""}checkbox({raw:e}){return e}},oe=class _n{constructor(t){z(this,"options",void 0),z(this,"renderer",void 0),z(this,"textRenderer",void 0),this.options=t||Be,this.options.renderer=this.options.renderer||new ur,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new on,this.textRenderer.parser=this}static parse(t,r){return new _n(r).parse(t)}static parseInline(t,r){return new _n(r).parseInline(t)}parse(t){this.renderer.parser=this;let r="";for(let n=0;n<t.length;n++){let s=t[n];if(this.options.extensions?.renderers?.[s.type]){let a=s,o=this.options.extensions.renderers[a.type].call({parser:this},a);if(o!==!1||!["space","hr","heading","code","table","blockquote","list","checkbox","html","def","paragraph","text"].includes(a.type)){r+=o||"";continue}}let i=s;switch(i.type){case"space":r+=this.renderer.space(i);break;case"hr":r+=this.renderer.hr(i);break;case"heading":r+=this.renderer.heading(i);break;case"code":r+=this.renderer.code(i);break;case"table":r+=this.renderer.table(i);break;case"blockquote":r+=this.renderer.blockquote(i);break;case"list":r+=this.renderer.list(i);break;case"checkbox":r+=this.renderer.checkbox(i);break;case"html":r+=this.renderer.html(i);break;case"def":r+=this.renderer.def(i);break;case"paragraph":r+=this.renderer.paragraph(i);break;case"text":r+=this.renderer.text(i);break;default:{let a='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return r}parseInline(t,r=this.renderer){this.renderer.parser=this;let n="";for(let s=0;s<t.length;s++){let i=t[s];if(this.options.extensions?.renderers?.[i.type]){let o=this.options.extensions.renderers[i.type].call({parser:this},i);if(o!==!1||!["escape","html","link","image","checkbox","strong","em","codespan","br","del","text"].includes(i.type)){n+=o||"";continue}}let a=i;switch(a.type){case"escape":n+=r.text(a);break;case"html":n+=r.html(a);break;case"link":n+=r.link(a);break;case"image":n+=r.image(a);break;case"checkbox":n+=r.checkbox(a);break;case"strong":n+=r.strong(a);break;case"em":n+=r.em(a);break;case"codespan":n+=r.codespan(a);break;case"br":n+=r.br(a);break;case"del":n+=r.del(a);break;case"text":n+=r.text(a);break;default:{let o='Token with "'+a.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return n}},Ct=(ir=class{constructor(e){z(this,"options",void 0),z(this,"block",void 0),this.options=e||Be}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(e=this.block){return e?ae.lex:ae.lexInline}provideParser(e=this.block){return e?oe.parse:oe.parseInline}},z(ir,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),z(ir,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),ir);function Se(e,t){if(Array.isArray(t))for(let r=0;r<t.length;r++)e.push(t[r]);else e.push(t)}var Do=class{constructor(...e){z(this,"defaults",Jr()),z(this,"options",this.setOptions),z(this,"parse",this.parseMarkdown(!0)),z(this,"parseInline",this.parseMarkdown(!1)),z(this,"Parser",oe),z(this,"Renderer",ur),z(this,"TextRenderer",on),z(this,"Lexer",ae),z(this,"Tokenizer",et),z(this,"Hooks",Ct),this.use(...e)}walkTokens(e,t){let r=[];for(let n of e)switch(Se(r,t.call(this,n)),n.type){case"table":{let s=n;for(let i of s.header)Se(r,this.walkTokens(i.tokens,t));for(let i of s.rows)for(let a of i)Se(r,this.walkTokens(a.tokens,t));break}case"list":{let s=n;Se(r,this.walkTokens(s.items,t));break}default:{let s=n;this.defaults.extensions?.childTokens?.[s.type]?this.defaults.extensions.childTokens[s.type].forEach(i=>{let a=s[i].flat(1/0);Se(r,this.walkTokens(a,t))}):s.tokens&&Se(r,this.walkTokens(s.tokens,t))}}return r}use(...e){let t=this.defaults.extensions||{renderers:Object.create(null),childTokens:Object.create(null)};return e.forEach(r=>{let n={...r};if(n.async=this.defaults.async||n.async||!1,r.extensions&&(r.extensions.forEach(s=>{if(!s.name)throw new Error("extension name required");if("renderer"in s){let i=t.renderers[s.name];i?t.renderers[s.name]=function(...a){let o=s.renderer.apply(this,a);return o===!1&&(o=i.apply(this,a)),o}:t.renderers[s.name]=s.renderer}if("tokenizer"in s){if(!s.level||s.level!=="block"&&s.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let i=t[s.level];i?i.unshift(s.tokenizer):t[s.level]=[s.tokenizer],s.start&&(s.level==="block"?t.startBlock?t.startBlock.push(s.start):t.startBlock=[s.start]:s.level==="inline"&&(t.startInline?t.startInline.push(s.start):t.startInline=[s.start]))}"childTokens"in s&&s.childTokens&&(t.childTokens[s.name]=s.childTokens)}),n.extensions=t),r.renderer){let s=this.defaults.renderer||new ur(this.defaults);for(let i in r.renderer){if(!(i in s))throw new Error(`renderer '${i}' does not exist`);if(["options","parser"].includes(i))continue;let a=i,o=r.renderer[a],l=s[a];s[a]=(...u)=>{let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d===!1?"":d??""}}n.renderer=s}if(r.tokenizer){let s=this.defaults.tokenizer||new et(this.defaults);for(let i in r.tokenizer){if(!(i in s))throw new Error(`tokenizer '${i}' does not exist`);if(["options","rules","lexer"].includes(i))continue;let a=i,o=r.tokenizer[a],l=s[a];s[a]=(...u)=>{let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d}}n.tokenizer=s}if(r.hooks){let s=this.defaults.hooks||new Ct;for(let i in r.hooks){if(!(i in s))throw new Error(`hook '${i}' does not exist`);if(["options","block"].includes(i))continue;let a=i,o=r.hooks[a],l=s[a];Ct.passThroughHooks.has(i)?s[a]=u=>{if(s.options.async&&Ct.passThroughHooksRespectAsync.has(i))return(async()=>{let p=await o.call(s,u);return l.call(s,p)})();let d=o.call(s,u);return l.call(s,d)}:s[a]=(...u)=>{if(s.options.async)return(async()=>{let p=await o.apply(s,u);return p===!1&&(p=await l.apply(s,u)),p})();let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d}}n.hooks=s}if(r.walkTokens){let s=this.defaults.walkTokens,i=r.walkTokens;n.walkTokens=function(a){let o=[];return Se(o,i.call(this,a)),s&&Se(o,s.call(this,a)),o}}this.defaults={...this.defaults,...n}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return ae.lex(e,t??this.defaults)}parser(e,t){return oe.parse(e,t??this.defaults)}parseMarkdown(e){return(t,r)=>{let n={...r},s={...this.defaults,...n},i=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&n.async===!1)return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return i(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return i(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=e),s.async)return(async()=>{let a=s.hooks?await s.hooks.preprocess(t):t,o=await(s.hooks?await s.hooks.provideLexer(e):e?ae.lex:ae.lexInline)(a,s),l=s.hooks?await s.hooks.processAllTokens(o):o;s.walkTokens&&await Promise.all(this.walkTokens(l,s.walkTokens));let u=await(s.hooks?await s.hooks.provideParser(e):e?oe.parse:oe.parseInline)(l,s);return s.hooks?await s.hooks.postprocess(u):u})().catch(i);try{s.hooks&&(t=s.hooks.preprocess(t));let a=(s.hooks?s.hooks.provideLexer(e):e?ae.lex:ae.lexInline)(t,s);s.hooks&&(a=s.hooks.processAllTokens(a)),s.walkTokens&&this.walkTokens(a,s.walkTokens);let o=(s.hooks?s.hooks.provideParser(e):e?oe.parse:oe.parseInline)(a,s);return s.hooks&&(o=s.hooks.postprocess(o)),o}catch(a){return i(a)}}}onError(e,t){return r=>{if(r.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let n="<p>An error occurred:</p><pre>"+ne(r.message+"",!0)+"</pre>";return t?Promise.resolve(n):n}if(t)return Promise.reject(r);throw r}}},Ne=new Do;function L(e,t){return Ne.parse(e,t)}L.options=L.setOptions=function(e){return Ne.setOptions(e),L.defaults=Ne.defaults,Bs(L.defaults),L},L.getDefaults=Jr,L.defaults=Be;function No(...e){return Ne.use(...e),L.defaults=Ne.defaults,Bs(L.defaults),L}L.use=No,L.walkTokens=function(e,t){return Ne.walkTokens(e,t)},L.parseInline=Ne.parseInline,L.Parser=oe,L.parser=oe.parse,L.Renderer=ur,L.TextRenderer=on,L.Lexer=ae,L.lexer=ae.lex,L.Tokenizer=et,L.Hooks=Ct,L.parse=L;var il=L.options,al=L.setOptions,ol=L.walkTokens,ll=L.parseInline,cl=oe.parse,ul=ae.lex;L.use({gfm:!0,breaks:!0,renderer:{link({href:e,title:t,text:r}){return`<a href="${e.startsWith("javascript:")?"#":e}" target="_blank" rel="noopener noreferrer"${t?` title="${t}"`:""}>${r}</a>`}}});function Qo(e){return e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,"").replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,"")}function si(e){if(!e)return"";try{return Qo(L.parse(e))}catch(t){return console.warn("[Schedulux Widget] Markdown parse error:",t),e}}function qo(e){if(!e)return"";try{const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}function jo({message:e}){const t=e.role==="user",r=e.delivery_status==="pending",n=qo(e.created_at),s=ht(()=>si(e.content||""),[e.content]);return _("div",{className:`schedulux-msg-row ${t?"user":"agent"} ${r&&t?"is-pending":""}`,style:r&&t?{opacity:.72}:void 0,children:[_("div",{className:"schedulux-bubble",children:[_("div",{className:"schedulux-markdown",dangerouslySetInnerHTML:{__html:s}}),e.booking_reference&&_("div",{className:"schedulux-booking-card",children:[_("div",{className:"schedulux-booking-header",children:[_(Fa,{size:16}),_("span",{children:"Appointment Confirmed"})]}),_("div",{className:"schedulux-booking-ref",children:["Ref: ",e.booking_reference]})]})]}),_("div",{className:"schedulux-msg-time",children:[n,r&&t&&" • sending..."]})]})}function Uo({messages:e,isTyping:t,quickPrompts:r=[],onSelectPrompt:n,hasOlderMessages:s=!1,isLoadingOlder:i=!1,onLoadOlder:a}){const o=qe(null),l=qe(null),u=qe(e.length),d=qe(0),p=qe(!1),h=e[e.length-1],f=h?.content||"";pe(()=>{const v=u.current,g=e.length;if(u.current=g,p.current&&o.current){const P=o.current.scrollHeight-d.current;o.current.scrollTop+=P,p.current=!1;return}(g>v||t||h?.role==="agent"&&h?.delivery_status==="pending")&&(h?.delivery_status==="pending"&&o.current?o.current.scrollTop=o.current.scrollHeight:l.current?.scrollIntoView({behavior:"smooth"}))},[e,t,f]);const m=v=>{const g=v.currentTarget;g.scrollTop<=20&&s&&!i&&a&&(p.current=!0,d.current=g.scrollHeight,a())},y=()=>{o.current&&s&&!i&&a&&(p.current=!0,d.current=o.current.scrollHeight,a())},b=r.length>0&&e.length<=2;return _("div",{ref:o,className:"schedulux-messages",onScroll:m,children:[s&&_("div",{className:"schedulux-load-older",children:i?_("span",{className:"schedulux-loading-older-text",children:"Loading earlier messages..."}):_("button",{type:"button",onClick:y,className:"schedulux-load-older-btn",children:"Load earlier messages"})}),e.map((v,g)=>_(jo,{message:v},v.client_id||v.id||`msg_${g}`)),b&&_("div",{className:"schedulux-quick-prompts",children:r.map(v=>_("button",{type:"button",className:"schedulux-prompt-chip",onClick:()=>n(v),children:v},v))}),t&&_("div",{className:"schedulux-typing",children:[_("span",{className:"schedulux-typing-dot"}),_("span",{className:"schedulux-typing-dot"}),_("span",{className:"schedulux-typing-dot"})]}),_("div",{ref:l,style:{height:1}})]})}function Ho({config:e,onClose:t,onReset:r,inline:n=!1}){const s=e.agent_name||"AI Assistant",i=e.agent_subtitle||"Typically replies instantly",a=e.avatar_url||e.logo_url;return _("div",{className:"schedulux-header",children:[_("div",{className:"schedulux-header-brand",children:[_("div",{className:"schedulux-avatar",children:a?_("img",{src:a,alt:s}):_(La,{className:"schedulux-avatar-icon",size:20})}),_("div",{className:"schedulux-header-titles",children:[_("div",{className:"schedulux-title-row",children:[_("span",{className:"schedulux-header-title",children:s}),_("span",{className:"schedulux-status-dot",title:"Live Agent Active"})]}),_("span",{className:"schedulux-header-subtitle",children:i})]})]}),_("div",{className:"schedulux-header-actions",children:[_("button",{type:"button",onClick:r,className:"schedulux-header-btn",title:"Reset conversation","aria-label":"Reset conversation",children:_(Ea,{size:15})}),!n&&t&&_("button",{type:"button",onClick:t,className:"schedulux-header-btn",title:"Minimize chat","aria-label":"Minimize chat",children:_(zs,{size:16})})]})]})}function Ko({input:e,setInput:t,onSend:r,disabled:n,placeholder:s="Type a message or ask a question..."}){const i=qe(null),a=d=>{if(d.key==="Enter"&&!d.shiftKey){d.preventDefault();const p=e.trim();p&&!n&&(r(p),t(""),i.current&&(i.current.style.height="auto"))}},o=d=>{const p=d.target.value;t(p),i.current&&(i.current.style.height="auto",i.current.style.height=`${Math.min(i.current.scrollHeight,80)}px`)},l=()=>{const d=e.trim();d&&!n&&(r(d),t(""),i.current&&(i.current.style.height="auto"))},u=!!e.trim()&&!n;return _("div",{className:"schedulux-footer",children:[_("div",{className:"schedulux-input-box",children:[_("textarea",{ref:i,rows:1,value:e,onInput:o,onKeyDown:a,placeholder:s,disabled:n,className:"schedulux-textarea","aria-label":"Chat input message"}),_("button",{type:"button",onClick:l,disabled:!u,className:"schedulux-send-btn",title:"Send message","aria-label":"Send message",children:_(Oa,{size:16})})]}),_("div",{className:"schedulux-powered-by",children:["Powered by"," ",_("a",{href:"https://schedulux.ai",target:"_blank",rel:"noopener noreferrer",children:"Schedulux AI"})]})]})}function Zo({config:e,isOpen:t,onToggle:r}){const n=e.launcher_style||"bubble",s=e.launcher_icon||"chat",i=()=>{if(t)return _(zs,{size:22});switch(s){case"calendar":return _(Aa,{size:22});case"help":return _(Ia,{size:22});default:return _(Ta,{size:22})}},a=e.launcher_style==="pill"||e.launcher_style==="bar"?t?"Close":"Book with AI":null;return _("button",{type:"button",onClick:r,className:`schedulux-launcher style-${n}`,"aria-label":t?"Close chat":"Open chat",children:[i(),a&&_("span",{children:a}),!t&&_("span",{className:"schedulux-launcher-badge"})]})}function ii(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e)return;const t=new e,r=t.createOscillator(),n=t.createGain();r.type="sine",r.frequency.setValueAtTime(587.33,t.currentTime),r.frequency.exponentialRampToValueAtTime(880,t.currentTime+.15),n.gain.setValueAtTime(.08,t.currentTime),n.gain.exponentialRampToValueAtTime(.001,t.currentTime+.35),r.connect(n),n.connect(t.destination),r.start(),r.stop(t.currentTime+.35)}catch{}}function ai({options:e,config:t}){const[r,n]=de(!!e.inline),[s,i]=de(""),{messages:a,isTyping:o,hasOlderMessages:l,isFetchingOlderMessages:u,loadOlderMessages:d,sendMessage:p,resetSession:h}=Ma({options:e,config:t}),f=t.quick_prompts||["What services do you provide?","Check available appointment times","What are your operating hours?"];pe(()=>{if(t.auto_expand_delay_seconds&&t.auto_expand_delay_seconds>0){const b=setTimeout(()=>{n(!0)},t.auto_expand_delay_seconds*1e3);return()=>clearTimeout(b)}},[t.auto_expand_delay_seconds]),pe(()=>{if(t.sound_on_load){const b=setTimeout(()=>{ii()},500);return()=>clearTimeout(b)}},[t.sound_on_load]);const m=Ce(()=>{n(b=>{const v=!b;return e.onToggle?.(v),v})},[e]),y=Ce(async b=>{!b.trim()||o||(await p(b.trim()),ii())},[o,p]);return _("div",{className:`schedulux-root ${e.inline?"is-inline":""}`,children:[_("div",{className:`schedulux-window ${r?"is-open":""}`,children:[_(Ho,{config:t,onClose:()=>n(!1),onReset:h,inline:e.inline}),_(Uo,{messages:a,isTyping:o,quickPrompts:f,onSelectPrompt:y,hasOlderMessages:l,isLoadingOlder:u,onLoadOlder:()=>d()}),_(Ko,{input:s,setInput:i,onSend:y,disabled:o,placeholder:t.placeholder_text})]}),!e.inline&&_(Zo,{config:t,isOpen:r,onToggle:m})]})}var hr=4.5,Go=3,Vo="#4F46E5",oi="#0F172A",tt="#FFFFFF",ln="#000000",li=.179,Jo='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',rt=(e,t,r)=>Math.min(r,Math.max(t,e));function dr(e){if(!e)return null;const t=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e.trim());if(!t)return null;let r=t[1];return r.length===3&&(r=r.split("").map(n=>n+n).join("")),[parseInt(r.slice(0,2),16),parseInt(r.slice(2,4),16),parseInt(r.slice(4,6),16)]}function nt(e){return dr(e)??[0,0,0]}function pr(e,t,r){const n=s=>rt(Math.round(s),0,255).toString(16).padStart(2,"0").toUpperCase();return`#${n(e)}${n(t)}${n(r)}`}function ci(e,t){const r=dr(e);return r?pr(...r):t}var $e=e=>{const t=dr(e);return t?pr(...t):void 0};function Mt(e,t,r){const n=s=>{const i=s/255;return i<=.04045?i/12.92:Math.pow((i+.055)/1.055,2.4)};return .2126*n(e)+.7152*n(t)+.0722*n(r)}function ui(e,t){return(Math.max(e,t)+.05)/(Math.min(e,t)+.05)}function me(e,t){return ui(Mt(...nt(e)),Mt(...nt(t)))}function hi(e,t=oi,r=tt){const n=me(e,r),s=me(e,t);return Math.max(n,s)>=hr?n>=s?r:t:me(e,tt)>=me(e,ln)?tt:ln}function cn(e,t=oi,r=tt){const{L:n,C:s}=fr(e),i=me(e,r);return i>=hr||n<=.73&&s>=.12&&i>=2.7?r:hi(e,t,r)}var Xo=e=>{const t=e/255;return t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)},un=e=>(e<=.0031308?e*12.92:1.055*Math.pow(e,1/2.4)-.055)*255;function fr(e){const[t,r,n]=nt(e).map(Xo),s=Math.cbrt(.4122214708*t+.5363325363*r+.0514459929*n),i=Math.cbrt(.2119034982*t+.6806995451*r+.1073969566*n),a=Math.cbrt(.0883024619*t+.2817188376*r+.6299787005*n),o=.2104542553*s+.793617785*i-.0040720468*a,l=1.9779984951*s-2.428592205*i+.4505937099*a,u=.0259040371*s+.7827717662*i-.808675766*a;return{L:o,C:Math.hypot(l,u),h:(Math.atan2(u,l)*180/Math.PI+360)%360}}function st(e,t,r){const n=rt(e,0,1);let s=t,i=[0,0,0];for(let a=0;a<30;a++){const o=s*Math.cos(r*Math.PI/180),l=s*Math.sin(r*Math.PI/180),u=Math.pow(n+.3963377774*o+.2158037573*l,3),d=Math.pow(n-.1055613458*o-.0638541728*l,3),p=Math.pow(n-.0894841775*o-1.291485548*l,3),h=[4.0767416621*u-3.3077115913*d+.2309699292*p,-1.2684380046*u+2.6097574011*d-.3413193965*p,-.0041960863*u-.7034186147*d+1.707614701*p];if(i=[un(rt(h[0],0,1)),un(rt(h[1],0,1)),un(rt(h[2],0,1))],h.every(f=>f>=-1e-4&&f<=1.0001)||s<1e-4)break;s*=.92}return pr(...i)}function hn(e,t,r=.25,n=.92){const s=rt(e.L+t,r,n),i=e.h>=35&&e.h<=105&&t<0?t*35:0,a=(e.h+i+360)%360;return st(s,t<0?Math.min(e.C*1.05,.28):e.C,a)}function di(e,t,r=hr){if(me(e,t)>=r)return e;const{L:n,C:s,h:i}=fr(e),a=Mt(...nt(t))>li?-1:1;for(let o=1;o<=50;o++){const l=st(n+a*o*.02,s,i);if(me(l,t)>=r)return l}return a<0?ln:tt}var Yo=/^\d+(\.\d+)?(px|rem|em|%)$/;function el(){return typeof window<"u"&&typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches}function pi(e,t={}){const r=ci(e?.primary_color,Vo),n=e?.theme_mode??"light",s=$e(e?.background_color);let i=n==="dark"||n==="auto"&&(t.prefersDark??el());s&&(i=Mt(...nt(s))<li);const a=fr(r),o=$e(e?.secondary_color)??(i?hn(a,.06,.35,.88):hn(a,-.05,.25,.85)),l=s??(i?"#0F172A":tt),u=$e(e?.header_background)??(i?"#1E293B":a.L>.78?r:hn(a,-.03,.3,.72)),d=$e(e?.header_text_color)??cn(u),p=$e(e?.user_bubble_bg)??r,h=$e(e?.user_bubble_text)??cn(p),f=$e(e?.agent_bubble_bg)??(i?st(.24,Math.min(a.C*.08,.015),a.h):st(.968,Math.min(a.C*.05,.008),a.h)),m=i?"#F8FAFC":st(.22,Math.min(a.C*.08,.015),a.h);return{primary_color:r,secondary_color:o,background_color:l,header_background:u,header_text_color:d,user_bubble_bg:p,user_bubble_text:h,agent_bubble_bg:f,agent_bubble_text:$e(e?.agent_bubble_text)??di(m,f),border_radius:e?.border_radius&&Yo.test(e.border_radius)?e.border_radius:"16px",font_family:e?.font_family&&e.font_family!=="inherit"?e.font_family:Jo,theme_mode:n}}function tl(e){return[["header",e.header_text_color,e.header_background,Go],["user_bubble",e.user_bubble_text,e.user_bubble_bg,2.7],["agent_bubble",e.agent_bubble_text,e.agent_bubble_bg,hr]].map(([t,r,n,s])=>({pair:t,ratio:Math.round(me(r,n)*100)/100,min:s})).filter(t=>t.ratio<t.min).map(({pair:t,ratio:r})=>({pair:t,ratio:r}))}function dn(e,t){const r=pi(e?.theme),n=r.primary_color,s=r.secondary_color,i=r.background_color,a=r.header_background,o=r.header_text_color,l=r.user_bubble_bg,u=r.user_bubble_text,d=r.agent_bubble_bg,p=r.agent_bubble_text,h=r.border_radius,f=r.font_family,m=e?.bottom_spacing_px??20,y=e?.side_spacing_px??20,b=e?.position||"bottom-right",v=b.includes("left"),g=b.includes("top");return`
    :host {
      display: ${t?"block":"contents"};
      width: 100%;
      height: 100%;
      min-height: 0;
      --schedulux-primary: ${n};
      --schedulux-secondary: ${s};
      --schedulux-bg: ${i};
      --schedulux-header-bg: ${a};
      --schedulux-header-text: ${o};
      --schedulux-user-bubble-bg: ${l};
      --schedulux-user-bubble-text: ${u};
      --schedulux-agent-bubble-bg: ${d};
      --schedulux-agent-bubble-text: ${p};
      --schedulux-radius: ${h};
      --schedulux-font: ${f};
      --schedulux-pos-bottom: ${m}px;
      --schedulux-pos-side: ${y}px;
      --schedulux-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      --schedulux-border: rgba(226, 232, 240, 0.8);
      font-family: var(--schedulux-font);
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }

    .schedulux-mount-root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      flex: 1 1 0%;
      overflow: hidden;
    }

    *, *::before, *::after {
      box-sizing: inherit;
      margin: 0;
      padding: 0;
    }

    .schedulux-root {
      position: ${t?"relative":"fixed"};
      ${t?"width: 100%; height: 100%; top: auto; bottom: auto; left: auto; right: auto;":g?"top: var(--schedulux-pos-bottom);":"bottom: var(--schedulux-pos-bottom);"}
      ${t?"":v?"left: var(--schedulux-pos-side);":"right: var(--schedulux-pos-side);"}
      z-index: ${t?"1":"2147483647"};
      display: flex;
      flex-direction: ${g?"column-reverse":"column"};
      min-height: 0;
      ${t?"align-items: stretch;":v?"align-items: flex-start;":"align-items: flex-end;"}
      pointer-events: ${t?"auto":"none"};
    }

    .schedulux-root.is-inline {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      align-items: stretch !important;
      pointer-events: auto !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-window {
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      min-height: 0 !important;
      margin-bottom: 0 !important;
      box-shadow: none !important;
      border: 1px solid var(--schedulux-border) !important;
      border-radius: var(--schedulux-radius) !important;
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-launcher {
      display: none !important;
    }

    .schedulux-root * {
      pointer-events: auto;
    }

    /* Floating Launcher Button */
    .schedulux-launcher {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
      user-select: none;
    }

    .schedulux-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
      filter: brightness(1.06);
    }

    .schedulux-launcher:active {
      transform: scale(0.96);
    }

    .schedulux-launcher.style-bubble {
      width: 58px;
      height: 58px;
      padding: 0;
    }

    .schedulux-launcher.style-pill {
      height: 50px;
      padding: 0 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher.style-bar {
      height: 44px;
      padding: 0 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10B981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    /* Chat Window Container */
    .schedulux-window {
      position: relative;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: var(--schedulux-bg);
      border-radius: var(--schedulux-radius);
      box-shadow: var(--schedulux-shadow);
      border: 1px solid var(--schedulux-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: ${g?"0":"14px"};
      margin-top: ${g?"14px":"0"};
      opacity: 0;
      transform: translateY(${g?"-16px":"16px"}) scale(0.96);
      transform-origin: ${g?v?"top left":"top right":v?"bottom left":"bottom right"};
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      visibility: hidden;
    }

    .schedulux-window.is-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      visibility: visible;
    }

    /* Header */
    .schedulux-header {
      background: var(--schedulux-header-bg);
      color: var(--schedulux-header-text);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: var(--schedulux-radius);
      border-top-right-radius: var(--schedulux-radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }

    .schedulux-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .schedulux-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
    }

    .schedulux-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .schedulux-header-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .schedulux-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .schedulux-header-title {
      font-weight: 700;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
      animation: schedulux-pulse 2s infinite;
    }

    .schedulux-header-subtitle {
      font-size: 11px;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .schedulux-header-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: var(--schedulux-header-text);
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
      outline: none;
    }

    .schedulux-header-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }

    /* Message Body / List */
    .schedulux-messages {
      flex: 1 1 0% !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .schedulux-messages::-webkit-scrollbar {
      width: 5px;
    }
    .schedulux-messages::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 4px;
    }

    .schedulux-load-older {
      display: flex;
      justify-content: center;
      padding: 4px 0 8px 0;
      flex-shrink: 0;
    }

    .schedulux-load-older-btn {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      border-radius: 9999px;
      padding: 4px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .schedulux-load-older-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .schedulux-loading-older-text {
      font-size: 11px;
      color: #94A3B8;
      font-style: italic;
    }

    .schedulux-empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px 12px;
      color: #64748B;
      gap: 8px;
      margin: auto 0;
    }

    /* Bubbles */
    .schedulux-msg-row {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      animation: schedulux-slide-up 0.2s ease-out;
    }

    .schedulux-msg-row.agent {
      align-self: flex-start;
    }

    .schedulux-msg-row.user {
      align-self: flex-end;
    }

    .schedulux-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
    }

    .schedulux-msg-row.agent .schedulux-bubble {
      background: var(--schedulux-agent-bubble-bg);
      color: var(--schedulux-agent-bubble-text);
      border-bottom-left-radius: 3px;
    }

    .schedulux-msg-row.user .schedulux-bubble {
      background: var(--schedulux-user-bubble-bg);
      color: var(--schedulux-user-bubble-text);
      border-bottom-right-radius: 3px;
    }

    /* Markdown Styling Inside Message Bubbles */
    .schedulux-markdown {
      word-break: break-word;
    }

    .schedulux-markdown p {
      margin: 0 0 8px 0;
    }

    .schedulux-markdown p:last-child {
      margin-bottom: 0;
    }

    .schedulux-markdown strong,
    .schedulux-markdown b {
      font-weight: 700;
    }

    .schedulux-markdown em,
    .schedulux-markdown i {
      font-style: italic;
    }

    .schedulux-markdown ul,
    .schedulux-markdown ol {
      margin: 6px 0 8px 0;
      padding-left: 18px;
    }

    .schedulux-markdown li {
      margin-bottom: 3px;
    }

    .schedulux-markdown a {
      color: inherit;
      text-decoration: underline;
      font-weight: 600;
      transition: opacity 0.15s ease;
    }

    .schedulux-markdown a:hover {
      opacity: 0.8;
    }

    .schedulux-markdown code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      background: rgba(0, 0, 0, 0.06);
      padding: 2px 5px;
      border-radius: 4px;
    }

    .schedulux-markdown pre {
      margin: 8px 0;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 6px;
      overflow-x: auto;
    }

    .schedulux-markdown pre code {
      background: none;
      padding: 0;
    }

    /* Markdown Tables */
    .schedulux-markdown table {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      border-collapse: collapse;
      margin: 10px 0;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      font-size: 12px;
      line-height: 1.4;
      background: rgba(255, 255, 255, 0.45);
      -webkit-overflow-scrolling: touch;
    }

    .schedulux-markdown th {
      background: rgba(0, 0, 0, 0.04);
      font-weight: 700;
      padding: 7px 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      border-right: 1px solid rgba(0, 0, 0, 0.05);
      text-align: left;
      white-space: nowrap;
    }

    .schedulux-markdown td {
      padding: 7px 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      border-right: 1px solid rgba(0, 0, 0, 0.05);
      vertical-align: top;
    }

    .schedulux-markdown tr:last-child td {
      border-bottom: none;
    }

    .schedulux-markdown th:last-child,
    .schedulux-markdown td:last-child {
      border-right: none;
    }

    /* User Bubble Markdown Contrasts */
    .schedulux-msg-row.user .schedulux-markdown code {
      background: rgba(255, 255, 255, 0.18);
    }

    .schedulux-msg-row.user .schedulux-markdown pre {
      background: rgba(255, 255, 255, 0.14);
    }

    .schedulux-msg-row.user .schedulux-markdown table {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.18);
    }

    .schedulux-msg-row.user .schedulux-markdown th {
      background: rgba(255, 255, 255, 0.12);
      border-bottom-color: rgba(255, 255, 255, 0.18);
      border-right-color: rgba(255, 255, 255, 0.08);
    }

    .schedulux-msg-row.user .schedulux-markdown td {
      border-bottom-color: rgba(255, 255, 255, 0.08);
      border-right-color: rgba(255, 255, 255, 0.08);
    }

    /* Dark Mode Markdown Contrasts */
    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown table {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown th {
      background: rgba(255, 255, 255, 0.06);
      border-bottom-color: rgba(255, 255, 255, 0.12);
      border-right-color: rgba(255, 255, 255, 0.06);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown td {
      border-bottom-color: rgba(255, 255, 255, 0.06);
      border-right-color: rgba(255, 255, 255, 0.06);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown code {
      background: rgba(255, 255, 255, 0.1);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown pre {
      background: rgba(255, 255, 255, 0.08);
    }

    .schedulux-msg-time {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 3px;
      padding: 0 4px;
    }
    .schedulux-msg-row.user .schedulux-msg-time {
      text-align: right;
    }

    /* Booking Confirmation Card */
    .schedulux-booking-card {
      margin-top: 8px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      padding: 12px 14px;
      color: #065F46;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .schedulux-booking-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
    }

    .schedulux-booking-ref {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: rgba(6, 95, 70, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
      font-weight: 600;
    }

    /* Quick Prompts Container */
    .schedulux-quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .schedulux-prompt-chip {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #334155;
      font-size: 11.5px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      outline: none;
    }

    .schedulux-prompt-chip:hover {
      background: var(--schedulux-primary);
      color: #ffffff;
      border-color: var(--schedulux-primary);
      transform: translateY(-1px);
    }

    /* Typing Indicator */
    .schedulux-typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--schedulux-agent-bubble-bg);
      border-radius: 12px;
      width: fit-content;
      margin-bottom: 4px;
      align-self: flex-start;
    }

    .schedulux-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94A3B8;
      animation: schedulux-bounce 1.4s infinite ease-in-out both;
    }

    .schedulux-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .schedulux-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    /* Footer Input Area */
    .schedulux-footer {
      border-top: 1px solid var(--schedulux-border);
      padding: 12px;
      background: var(--schedulux-bg);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }

    .schedulux-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 4px 6px 4px 12px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .schedulux-input-box:focus-within {
      border-color: var(--schedulux-primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
    }

    .schedulux-textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      font-family: inherit;
      resize: none;
      max-height: 80px;
      min-height: 22px;
      line-height: 1.4;
      color: #1E293B;
    }

    .schedulux-textarea::placeholder {
      color: #94A3B8;
    }

    .schedulux-send-btn {
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      flex-shrink: 0;
    }

    .schedulux-send-btn:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: scale(1.04);
    }

    .schedulux-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .schedulux-powered-by {
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      user-select: none;
    }
    .schedulux-powered-by a {
      color: #64748B;
      text-decoration: none;
      font-weight: 600;
    }
    .schedulux-powered-by a:hover {
      text-decoration: underline;
    }

    /* Keyframes */
    @keyframes schedulux-pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    @keyframes schedulux-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    @keyframes schedulux-slide-up {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Mobile Screen */
    @media (max-width: 640px) {
      .schedulux-root,
      .schedulux-root.is-inline {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }
      .schedulux-window,
      .schedulux-root.is-inline .schedulux-window {
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        border-radius: 0 !important;
        margin-bottom: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .schedulux-header {
        border-radius: 0 !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }
    }
  `}var it=new Map;function gr(e){if(!e||typeof e!="object")return{};const t={};for(const[r,n]of Object.entries(e))if(n!=null)if(typeof n=="object"&&!Array.isArray(n)){const s=gr(n);Object.keys(s).length>0&&(t[r]=s)}else t[r]=n;return t}function pn(e){const t=`${e.tenantId}_${e.agentId}`;if(it.has(t)){const p=it.get(t);if(p)if(e.container)p.destroy();else return p}const r=!!e.container,n=e.container||document.createElement("div");r||(n.id=`schedulux-widget-${e.tenantId}-${e.agentId}`,document.body.appendChild(n));const s=n.shadowRoot||n.attachShadow({mode:"open"});s.innerHTML="";const i=document.createElement("style");let a=gr(e.config);i.textContent=dn(a,e.inline),s.appendChild(i);const o=document.createElement("div");o.className="schedulux-mount-root",s.appendChild(o);const l=new ha({defaultOptions:{queries:{retry:1,staleTime:3e5,refetchOnWindowFocus:!1}}}),u=p=>{In(lt(zi,{client:l},lt(ai,{options:e,config:p})),o)};u(a);const d={open:()=>{s.querySelector(".schedulux-window")?.classList.add("is-open")},close:()=>{s.querySelector(".schedulux-window")?.classList.remove("is-open")},toggle:()=>{s.querySelector(".schedulux-window")?.classList.toggle("is-open")},isOpen:()=>!!s.querySelector(".schedulux-window")?.classList.contains("is-open"),sendMessage:async p=>{const h=s.querySelector(".schedulux-textarea"),f=s.querySelector(".schedulux-send-btn");h&&f&&(h.value=p,h.dispatchEvent(new Event("input",{bubbles:!0})),f.click())},resetConversation:()=>{s.querySelector('button[aria-label="Reset conversation"]')?.click()},updateConfig:p=>{const h=gr(p);a={...a,...h,theme:{...a.theme||{},...h.theme||{}}},i.textContent=dn(a,e.inline),u(a)},destroy:()=>{l.clear(),In(null,o),r?s.innerHTML="":n.remove(),it.delete(t)}};return it.set(t,d),Ra(e.apiBase||"",e.tenantId,e.agentId,e.mode||"live").then(p=>{if(p&&Object.keys(p).length>0){const h=gr(e.config),f={...p,...h,theme:{...p.theme||{},...h.theme||{}}};d.updateConfig(f)}}).catch(p=>{console.warn("[Schedulux Widget] Remote config fetch fallback:",p)}),d}function fi(e,t){const r=`${e}_${t}`,n=it.get(r);n&&n.destroy()}if(typeof window<"u"){window.ScheduluxWidget={init:pn,destroy:fi,instances:it};const e=document.currentScript||document.querySelector("script[data-tenant-id][data-agent-id]");if(e){const t=e.getAttribute("data-tenant-id"),r=e.getAttribute("data-agent-id"),n=e.getAttribute("data-api-base")||"";if(t&&r){const s=e.getAttribute("data-primary-color"),i=e.getAttribute("data-agent-name"),a=e.getAttribute("data-greeting"),o=e.getAttribute("data-position"),l=e.getAttribute("data-theme-mode"),u=e.getAttribute("data-container"),d=e.getAttribute("data-inline"),p={};i&&(p.agent_name=i),a&&(p.initial_greeting=a),o&&(p.position=o),(s||l)&&(p.theme={},s&&(p.theme.primary_color=s),l&&(p.theme.theme_mode=l));const h=()=>{const f=u?document.querySelector(u):null;pn({tenantId:t,agentId:r,apiBase:n,container:f||void 0,inline:d==="true"||!!f,config:p})};u&&!document.querySelector(u)&&document.readyState==="loading"?document.addEventListener("DOMContentLoaded",h):h()}}}j.ChatWidget=ai,j.auditTheme=tl,j.contrastBetween=me,j.destroyScheduluxWidget=fi,j.ensureContrast=di,j.getBrandContrastColor=cn,j.getContrastColor=hi,j.getContrastRatio=ui,j.getRelativeLuminance=Mt,j.getWidgetStyles=dn,j.hexToOklch=fr,j.hexToRgb=nt,j.initScheduluxWidget=pn,j.normalizeHex=ci,j.oklchToHex=st,j.parseHex=dr,j.renderMarkdown=si,j.resolveTheme=pi,j.rgbToHex=pr})(this.ScheduluxWidgetBundle=this.ScheduluxWidgetBundle||{});
